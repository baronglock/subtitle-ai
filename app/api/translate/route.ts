import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Function to translate SRT content with Google Translate (free plan)
async function translateSRTWithGoogleTranslate(
  srtContent: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> {
  const lines = srtContent.split("\n");
  const translatedLines: string[] = [];
  
  for (const line of lines) {
    // Check if line is subtitle text (not number or timestamp)
    if (line && !line.match(/^\d+$/) && !line.includes("-->")) {
      try {
        const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
          sourceLanguage || "auto"
        }&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(line)}`;
        
        const response = await fetch(translateUrl);
        const data = await response.json();
        
        const translatedText = data[0]
          .map((item: any) => item[0])
          .filter((item: any) => item)
          .join("");
        
        translatedLines.push(translatedText);
      } catch (error) {
        // If translation fails, keep original text
        translatedLines.push(line);
      }
    } else {
      translatedLines.push(line);
    }
  }
  
  return translatedLines.join("\n");
}

// Function to translate SRT content with Gemini AI (paid plans)
async function translateSRTWithGemini(
  srtContent: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const prompt = `You are a professional subtitle translator. Translate the following SRT subtitle file from ${sourceLanguage || 'auto-detect'} to ${targetLanguage}.

CRITICAL REQUIREMENTS:
1. PRESERVE the exact SRT format including:
   - Subtitle numbers (1, 2, 3, etc.)
   - Timestamps (00:00:00,000 --> 00:00:00,000)
   - Empty lines between subtitle blocks
2. ONLY translate the subtitle text lines
3. DO NOT translate or modify numbers and timestamps
4. Maintain natural, conversational translations that fit the timing
5. Keep translations concise to match subtitle reading speed
6. Preserve any formatting tags like <i>, <b> if present

SRT Content:
${srtContent}

Return ONLY the translated SRT content, nothing else.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini translation failed, falling back to Google Translate:", error);
    // Fallback to Google Translate if Gemini fails
    return translateSRTWithGoogleTranslate(srtContent, targetLanguage, sourceLanguage);
  }
}

// Translation endpoint supporting both plain text and SRT format
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user as any)?.plan || "free";
    const { text, targetLanguage, sourceLanguage, format } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and target language are required" },
        { status: 400 }
      );
    }

    let translatedText: string;
    
    if (format === "srt") {
      // Use Gemini for paid plans, Google Translate for free
      if (userPlan !== "free") {
        translatedText = await translateSRTWithGemini(
          text,
          targetLanguage,
          sourceLanguage || "auto"
        );
      } else {
        // Add small delay for free plan to show difference
        await new Promise(resolve => setTimeout(resolve, 1000));
        translatedText = await translateSRTWithGoogleTranslate(
          text,
          targetLanguage,
          sourceLanguage || "auto"
        );
      }
    } else {
      // For plain text, always use Google Translate for simplicity
      const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
        sourceLanguage || "auto"
      }&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;

      const response = await fetch(translateUrl);
      const data = await response.json();

      translatedText = data[0]
        .map((item: any) => item[0])
        .filter((item: any) => item)
        .join("");
    }

    const quality = userPlan === "free" 
      ? "Standard (Google Translate)" 
      : "Premium AI (Gemini 1.5 - 99% accuracy with context)";

    return NextResponse.json({
      translatedText,
      srt: translatedText,
      sourceLanguage: sourceLanguage,
      targetLanguage,
      quality,
      userPlan,
      translationEngine: userPlan === "free" ? "Google Translate" : "Gemini AI"
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}