import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Simple translation using Google Translate API (for free plan)
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, targetLanguage, sourceLang } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and target language are required" },
        { status: 400 }
      );
    }

    // For free plan, use Google Translate Web API (limited but free)
    // For production, you should use Google Cloud Translation API with proper API key
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
      sourceLang || "auto"
    }&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(translateUrl);
    const data = await response.json();

    // Extract translated text from Google's response
    const translatedText = data[0]
      .map((item: any) => item[0])
      .filter((item: any) => item)
      .join("");

    return NextResponse.json({
      translatedText,
      sourceLanguage: data[2] || sourceLang,
      targetLanguage,
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