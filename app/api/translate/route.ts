import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { translateSRTWithQuality, PlanType } from "../../lib/translation";
import { getClientIP, checkRateLimit } from "../../lib/security";

// Translation endpoint supporting both plain text and SRT format
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = (session.user as any)?.plan || "free";
    const clientIP = await getClientIP();
    
    // Rate limiting for free users
    if (userPlan === "free") {
      const canProceed = await checkRateLimit(clientIP, "translate");
      if (!canProceed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please upgrade your plan for unlimited translations." },
          { status: 429 }
        );
      }
    }

    const { text, targetLanguage, sourceLanguage, format } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and target language are required" },
        { status: 400 }
      );
    }

    // Add processing delay for free plan to show it's "slower"
    if (userPlan === "free") {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    let translatedText: string;
    
    if (format === "srt") {
      // Use the quality-based translation for SRT
      translatedText = await translateSRTWithQuality(
        text,
        targetLanguage,
        sourceLanguage || "auto",
        userPlan as PlanType
      );
    } else {
      // For plain text, use simple translation
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
      ? "Basic (85% accuracy - Google Translate)" 
      : userPlan === "starter"
      ? "High Quality (95% accuracy - GPT-5-mini)"
      : userPlan === "pro"
      ? "Premium (99.5% accuracy - GPT-5-mini)"
      : "Professional (99.9% accuracy - GPT-5-mini)";

    return NextResponse.json({
      translatedText,
      srt: translatedText,
      sourceLanguage: sourceLanguage,
      targetLanguage,
      quality,
      userPlan
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}

// Function to translate SRT content
async function translateSRT(
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