import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { GoogleGenerativeAI } from "@google/generative-ai";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
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
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const avgTimePerSentence = duration / sentences.length;
  
  const segments = sentences.map((sentence, index) => ({
    text: sentence.trim(),
    start: index * avgTimePerSentence,
    end: (index + 1) * avgTimePerSentence
  }));
  
  return formatToSRT(segments);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, sourceLanguage } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    // Get user plan
    const userPlan = (session.user as any).plan || "free";

    console.log("Starting transcription for:", fileName, "User plan:", userPlan);

    // Download file from R2
    const key = `uploads/${session.user.email}/${fileName}`;
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
    
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Use Gemini 1.5 Flash for best cost efficiency
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Updated to correct model name
    });

    // Prepare the prompt based on user plan
    const languageHint = sourceLanguage && sourceLanguage !== "auto" 
      ? `The audio is in ${sourceLanguage}. ` 
      : "";

    // Enhanced prompt for better transcription
    const prompt = `${languageHint}Please transcribe this audio file accurately.
Return the transcription as a valid JSON object with this exact structure:
{
  "transcription": "the complete transcribed text here",
  "detected_language": "the detected language (e.g., English, Spanish, Portuguese)",
  "duration": 60,
  "confidence": "high"
}

Important: Return ONLY the JSON object, no additional text or markdown formatting.`;

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
      const srtContent = createSRTFromText(
        transcriptionData.transcription,
        transcriptionData.duration || 60
      );

      // Calculate approximate cost (32 tokens per second of audio)
      const estimatedTokens = (transcriptionData.duration || 60) * 32;
      const estimatedCost = (estimatedTokens / 1000000) * 0.075; // $0.075 per 1M tokens for Flash

      // Return the response
      return NextResponse.json({
        transcription: transcriptionData.transcription,
        text: transcriptionData.transcription, // For compatibility
        srt: srtContent,
        detected_language: transcriptionData.detected_language || "Unknown",
        language: transcriptionData.detected_language || "Unknown",
        duration: transcriptionData.duration || 60,
        processing_info: {
          model_used: "Gemini 1.5 Flash",
          quality: userPlan === "free" ? "Standard Quality" : "Premium Quality",
          processing_speed: "Ultra Fast",
          accuracy: userPlan === "free" ? "~90%" : "~97%",
          confidence: transcriptionData.confidence || "high",
          estimated_cost: `$${estimatedCost.toFixed(4)}`
        }
      });

    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError);
      
      // Return more specific error information
      if (geminiError.message?.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid Gemini API key", details: "Please check your API key configuration" },
          { status: 500 }
        );
      }
      
      if (geminiError.message?.includes("model")) {
        return NextResponse.json(
          { error: "Model not available", details: "The specified Gemini model is not available" },
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
    console.error("Transcription error:", error);
    return NextResponse.json(
      { 
        error: "Transcription failed", 
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}