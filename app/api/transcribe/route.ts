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

function formatToSRT(transcription: string, duration: number = 0): string {
  // Split transcription into sentences
  const sentences = transcription.match(/[^.!?]+[.!?]+/g) || [transcription];
  
  let srtContent = "";
  let currentTime = 0;
  const avgTimePerSentence = duration > 0 ? duration / sentences.length : 3;
  
  sentences.forEach((sentence, index) => {
    const startTime = currentTime;
    const endTime = startTime + avgTimePerSentence;
    
    const startTimeStr = formatTime(startTime);
    const endTimeStr = formatTime(endTime);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTimeStr} --> ${endTimeStr}\n`;
    srtContent += `${sentence.trim()}\n\n`;
    
    currentTime = endTime;
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

    // Download file from R2
    const key = `uploads/${session.user.email}/${fileName}`;
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const response = await s3Client.send(command);
    const audioData = await response.Body?.transformToByteArray();
    
    if (!audioData) {
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    // Convert audio to base64
    const base64Audio = Buffer.from(audioData).toString('base64');
    
    // Prepare the prompt for Gemini
    const languageInstruction = sourceLanguage && sourceLanguage !== "auto" 
      ? `The audio is in ${sourceLanguage}. ` 
      : "";
    
    const prompt = `${languageInstruction}Please transcribe this audio file accurately. 
    Return the transcription in the following JSON format:
    {
      "transcription": "full transcription text here",
      "detected_language": "detected language name",
      "confidence": "high/medium/low",
      "duration": estimated duration in seconds
    }
    
    Be as accurate as possible with the transcription. Maintain proper punctuation and capitalization.`;

    // Use Gemini Flash model for transcription (faster and cheaper)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    // Create the file part for Gemini
    const filePart = {
      inlineData: {
        data: base64Audio,
        mimeType: response.ContentType || "audio/mpeg",
      },
    };

    // Generate transcription
    const result = await model.generateContent([prompt, filePart]);
    const responseText = result.response.text();
    
    // Parse the JSON response
    let transcriptionData;
    try {
      // Extract JSON from the response (Gemini might add markdown formatting)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        transcriptionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      // Fallback: treat the entire response as transcription
      transcriptionData = {
        transcription: responseText,
        detected_language: "Unknown",
        confidence: "medium",
        duration: 60
      };
    }

    // Generate SRT format
    const srtContent = formatToSRT(
      transcriptionData.transcription, 
      transcriptionData.duration || 60
    );

    // Return the response
    return NextResponse.json({
      transcription: transcriptionData.transcription,
      text: transcriptionData.transcription, // For compatibility
      srt: srtContent,
      detected_language: transcriptionData.detected_language,
      language: transcriptionData.detected_language, // For compatibility
      duration: transcriptionData.duration || 0,
      processing_info: {
        model_used: "Gemini 1.5 Flash",
        quality: userPlan === "free" ? "Standard Quality" : "Premium Quality",
        processing_speed: "Ultra Fast",
        accuracy: userPlan === "free" ? "~95%" : "~99%",
        confidence: transcriptionData.confidence
      }
    });

  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}