import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { trackUsage, checkIPAbuse, registerIPForUser } from "../../lib/usageTracker";

// Força uso do Cloudflare R2, nunca AWS S3
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Importante para R2
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function formatToSRT(segments: Array<{text: string, start: number, end: number}>): string {
  let srtContent = "";
  
  segments.forEach((segment, index) => {
    const startTime = formatTime(segment.start);
    const endTime = formatTime(segment.end);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${segment.text.trim()}\n\n`;
  });
  
  return srtContent;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

// Function to create SRT from plain text (when no timestamps available)
function createSRTFromText(text: string, duration: number = 60): string {
  // Split text into words
  const words = text.split(/\s+/);
  const segments: Array<{text: string, start: number, end: number}> = [];
  
  // Configuration for subtitle generation
  const MAX_WORDS_PER_SUBTITLE = 8;
  const MAX_CHARS_PER_SUBTITLE = 42; // Industry standard for readability
  const WORDS_PER_MINUTE = 150; // Average speaking rate
  const SECONDS_PER_WORD = 60 / WORDS_PER_MINUTE; // ~0.4 seconds per word
  const MIN_SUBTITLE_DURATION = 1.5; // Minimum time for readability
  const MAX_SUBTITLE_DURATION = 4.0; // Maximum time to avoid too long on screen
  
  let currentSegment = "";
  let currentWordCount = 0;
  let currentStartTime = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testSegment = currentSegment ? `${currentSegment} ${word}` : word;
    
    // Check if adding this word would exceed limits
    if (currentWordCount >= MAX_WORDS_PER_SUBTITLE || 
        testSegment.length > MAX_CHARS_PER_SUBTITLE ||
        (word.match(/[.!?]$/) && currentWordCount >= 3)) { // Natural break at punctuation
      
      // Calculate duration based on word count
      const segmentDuration = Math.max(
        MIN_SUBTITLE_DURATION,
        Math.min(MAX_SUBTITLE_DURATION, currentWordCount * SECONDS_PER_WORD)
      );
      
      // Add the segment
      segments.push({
        text: currentSegment.trim(),
        start: currentStartTime,
        end: currentStartTime + segmentDuration
      });
      
      // Reset for next segment
      currentStartTime += segmentDuration;
      currentSegment = word;
      currentWordCount = 1;
    } else {
      currentSegment = testSegment;
      currentWordCount++;
    }
  }
  
  // Add final segment
  if (currentSegment) {
    const segmentDuration = Math.max(
      MIN_SUBTITLE_DURATION,
      Math.min(MAX_SUBTITLE_DURATION, currentWordCount * SECONDS_PER_WORD)
    );
    
    segments.push({
      text: currentSegment.trim(),
      start: currentStartTime,
      end: Math.min(currentStartTime + segmentDuration, duration)
    });
  }
  
  // Adjust timing if total exceeds duration
  const totalTime = segments[segments.length - 1]?.end || 0;
  if (totalTime > duration && segments.length > 0) {
    const ratio = duration / totalTime;
    segments.forEach(segment => {
      segment.start *= ratio;
      segment.end *= ratio;
    });
  }
  
  return formatToSRT(segments);
}

export async function POST(request: NextRequest) {
  console.log("=== Transcription API called ===");
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", session.user.email);
    
    // Get user IP for abuse detection
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    // Check for IP abuse
    const isAbuse = await checkIPAbuse(ip);
    if (isAbuse) {
      console.log("IP abuse detected for:", ip);
      return NextResponse.json({ 
        error: "Too many accounts from this IP address. Please contact support." 
      }, { status: 429 });
    }
    
    // Register IP for this user
    await registerIPForUser(ip, session.user.email);

    const { fileName, fileKey, sourceLanguage } = await request.json();

    if (!fileName && !fileKey) {
      console.log("No fileName or fileKey provided");
      return NextResponse.json({ error: "File name or key is required" }, { status: 400 });
    }

    // Get user plan
    const userPlan = (session.user as any).plan || "free";

    console.log("Starting transcription for:", fileName || fileKey, "User plan:", userPlan);
    console.log("Source language:", sourceLanguage || "auto-detect");

    // Download file from R2
    // Usar fileKey se disponível (novo método), senão usar fileName (compatibilidade)
    const key = fileKey || `uploads/${session.user.email}/${fileName}`;
    
    console.log("Attempting to download file from R2:");
    console.log("- Endpoint:", process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    console.log("- Bucket:", process.env.R2_BUCKET_NAME);
    console.log("- Key:", key);
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const response = await s3Client.send(command);
    const audioData = await response.Body?.transformToByteArray();
    
    if (!audioData) {
      return NextResponse.json({ error: "Failed to download file from storage" }, { status: 500 });
    }

    console.log("Audio file downloaded, size:", audioData.length, "bytes");

    // Convert audio to base64 for Gemini
    const base64Audio = Buffer.from(audioData).toString('base64');
    
    // Try to estimate audio duration (rough estimate based on file size and common bitrates)
    // This is a fallback - Gemini should provide the actual duration
    const estimatedDuration = Math.round((audioData.length / 1024) / 16); // Very rough: ~16KB per second for compressed audio
    
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured in environment variables");
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    console.log("Gemini API key present:", !!process.env.GEMINI_API_KEY);
    console.log("API key length:", process.env.GEMINI_API_KEY?.length);
    console.log("API key starts with:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");

    // Use Gemini 1.5 Flash for best cost efficiency
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Updated to correct model name
      });
      console.log("Gemini model initialized successfully");
    } catch (modelError: any) {
      console.error("Failed to initialize Gemini model:", modelError);
      return NextResponse.json({ 
        error: "Failed to initialize AI model", 
        details: modelError.message 
      }, { status: 500 });
    }

    // Prepare the prompt based on user plan
    const languageHint = sourceLanguage && sourceLanguage !== "auto" 
      ? `The audio is in ${sourceLanguage}. ` 
      : "";

    // Enhanced prompt for better transcription with timestamps
    const prompt = `${languageHint}Please transcribe this audio file with precise timestamps.

IMPORTANT: Analyze the audio and provide the transcription in segments with accurate timestamps.

Return a JSON object with this EXACT structure:
{
  "transcription": "the complete transcribed text here",
  "segments": [
    {"start": 0.0, "end": 2.5, "text": "first phrase or sentence"},
    {"start": 2.5, "end": 5.0, "text": "second phrase or sentence"},
    {"start": 5.0, "end": 8.3, "text": "third phrase or sentence"}
  ],
  "detected_language": "the detected language (e.g., English, Spanish, Portuguese)",
  "duration": total_audio_duration_in_seconds,
  "confidence": "high"
}

Guidelines:
- Each segment should be 3-8 words for optimal subtitle readability
- Start and end times must be in seconds (float)
- Segments should match natural speech pauses
- No overlap between segments
- Return ONLY valid JSON, no markdown or additional text`;

    try {
      // Create the audio part for Gemini
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType: response.ContentType || "audio/mpeg",
        },
      };

      console.log("Sending to Gemini API with model: gemini-1.5-flash");

      // Generate transcription
      const result = await model.generateContent([prompt, audioPart]);
      const responseText = result.response.text();
      
      console.log("Gemini response received, length:", responseText.length);

      // Parse the response
      let transcriptionData;
      let srtContent;
      
      try {
        // Extract JSON from response (Gemini might wrap it in markdown)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          transcriptionData = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, treat as plain text response
          transcriptionData = {
            transcription: responseText.trim(),
            detected_language: "Unknown",
            duration: 60,
            confidence: "medium"
          };
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", parseError);
        // Fallback: treat entire response as transcription
        transcriptionData = {
          transcription: responseText,
          detected_language: "Unknown",
          duration: 60,
          confidence: "medium"
        };
      }

      // Generate SRT format
      if (transcriptionData.segments && Array.isArray(transcriptionData.segments) && transcriptionData.segments.length > 0) {
        // Use real timestamps from Gemini if available
        console.log("Using timestamp segments from Gemini");
        srtContent = formatToSRT(transcriptionData.segments);
      } else {
        // Fallback to our improved text-based generation
        console.log("Generating timestamps from text");
        const duration = transcriptionData.duration || estimatedDuration || 60;
        srtContent = createSRTFromText(
          transcriptionData.transcription,
          duration
        );
      }

      // Calculate approximate cost (32 tokens per second of audio)
      const estimatedTokens = (transcriptionData.duration || 60) * 32;
      const estimatedCost = (estimatedTokens / 1000000) * 0.075; // $0.075 per 1M tokens for Flash
      
      // Track usage
      const usageResult = await trackUsage(
        session.user.email,
        transcriptionData.duration || 60,
        ip,
        userPlan
      );
      
      if (!usageResult.success) {
        return NextResponse.json({ 
          error: "Monthly transcription limit exceeded",
          minutesUsed: usageResult.minutesUsed,
          minutesRemaining: 0
        }, { status: 403 });
      }

      // Return the response
      return NextResponse.json({
        transcription: transcriptionData.transcription,
        text: transcriptionData.transcription, // For compatibility
        srt: srtContent,
        detected_language: transcriptionData.detected_language || "Unknown",
        language: transcriptionData.detected_language || "Unknown",
        duration: transcriptionData.duration || 60,
        processing_info: {
          quality: userPlan === "free" ? "Standard" : "Premium",
          processing_speed: "Fast",
          accuracy: userPlan === "free" ? "High" : "Very High",
          confidence: transcriptionData.confidence || "high"
        },
        usage: {
          minutesUsed: usageResult.minutesUsed,
          minutesRemaining: usageResult.minutesRemaining
        }
      });

    } catch (geminiError: any) {
      console.error("=== Gemini API Error Details ===");
      console.error("Error name:", geminiError.name);
      console.error("Error message:", geminiError.message);
      console.error("Error stack:", geminiError.stack);
      console.error("Full error object:", JSON.stringify(geminiError, null, 2));
      
      // Return more specific error information
      if (geminiError.message?.includes("API key") || geminiError.message?.includes("API_KEY")) {
        return NextResponse.json(
          { error: "Invalid Gemini API key", details: "Please check your API key configuration" },
          { status: 500 }
        );
      }
      
      if (geminiError.message?.includes("model") || geminiError.message?.includes("Model")) {
        return NextResponse.json(
          { error: "Model not available", details: "The specified Gemini model is not available" },
          { status: 500 }
        );
      }

      if (geminiError.message?.includes("quota") || geminiError.message?.includes("limit")) {
        return NextResponse.json(
          { error: "API quota exceeded", details: "Gemini API quota or rate limit exceeded" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          error: "Gemini transcription failed", 
          details: geminiError.message || "Unknown Gemini API error"
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("=== General Transcription Error ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Transcription failed", 
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}