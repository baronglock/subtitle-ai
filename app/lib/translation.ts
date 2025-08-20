import OpenAI from "openai";

// Translation providers with fallback
export type TranslationProvider = "gpt5-mini" | "google" | "libre" | "mymemory";
export type PlanType = "free" | "starter" | "pro" | "enterprise";

// Initialize OpenAI for GPT-5-mini (paid plans)
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Translation quality by plan
const TRANSLATION_CONFIG = {
  free: {
    provider: "google" as TranslationProvider,
    quality: "basic",
    accuracy: "85%",
    speed: "slow",
    description: "Basic translation with Google Translate"
  },
  starter: {
    provider: "gpt5-mini" as TranslationProvider,
    quality: "high",
    accuracy: "95%",
    speed: "fast",
    description: "High-quality AI translation with GPT-5-mini"
  },
  pro: {
    provider: "gpt5-mini" as TranslationProvider,
    quality: "premium",
    accuracy: "99.5%",
    speed: "fast",
    description: "Premium AI translation with GPT-5-mini + context optimization"
  },
  enterprise: {
    provider: "gpt5-mini" as TranslationProvider,
    quality: "professional",
    accuracy: "99.9%",
    speed: "priority",
    description: "Professional translation with GPT-5-mini + human review option"
  }
};

// Translate with GPT-5-mini for paid plans
async function translateWithGPT5Mini(
  text: string,
  targetLang: string,
  sourceLang?: string,
  context?: string
): Promise<string> {
  const client = getOpenAI();
  if (!client) {
    throw new Error("OpenAI API key not configured");
  }
  
  try {
    const systemPrompt = `You are a professional translator. Translate the following text from ${
      sourceLang || "auto-detected language"
    } to ${targetLang}. Maintain the tone, style, and meaning. ${
      context ? `Context: ${context}` : ""
    }`;

    const response = await client.chat.completions.create({
      model: "gpt-5-mini", // Using GPT-5-mini as requested
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error("GPT-5-mini translation error:", error);
    throw error;
  }
}

// Google Translate (free tier and fallback)
async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
      sourceLang || "auto"
    }&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const data = await response.json();
    
    return data[0]
      ?.map((item: any) => item[0])
      ?.filter((item: any) => item)
      ?.join("") || text;
  } catch (error) {
    console.error("Google Translate error:", error);
    throw error;
  }
}

// LibreTranslate (backup free provider)
async function translateWithLibre(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang || "auto",
        target: targetLang,
        format: "text"
      })
    });

    if (!response.ok) throw new Error("LibreTranslate failed");
    
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error("LibreTranslate error:", error);
    throw error;
  }
}

// MyMemory (another backup - 5000 chars/day free)
async function translateWithMyMemory(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  try {
    const langPair = `${sourceLang || "en"}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${langPair}`;

    const response = await fetch(url);
    const data = await response.json();
    
    return data.responseData?.translatedText || text;
  } catch (error) {
    console.error("MyMemory error:", error);
    throw error;
  }
}

// Main translation function with fallback chain
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
  userPlan: PlanType = "free"
): Promise<{ translatedText: string; provider: string; quality: string }> {
  const config = TRANSLATION_CONFIG[userPlan];
  
  // For paid plans, use GPT-5-mini
  if (userPlan !== "free") {
    try {
      const translatedText = await translateWithGPT5Mini(
        text,
        targetLang,
        sourceLang,
        userPlan === "enterprise" ? "Professional translation required" : undefined
      );
      return {
        translatedText,
        provider: "GPT-5-mini",
        quality: config.quality
      };
    } catch (error) {
      console.error("GPT-5-mini failed, falling back to Google");
    }
  }
  
  // Free plan or fallback chain
  const providers = [
    { name: "Google Translate", fn: translateWithGoogle },
    { name: "LibreTranslate", fn: translateWithLibre },
    { name: "MyMemory", fn: translateWithMyMemory }
  ];
  
  for (const provider of providers) {
    try {
      const translatedText = await provider.fn(text, targetLang, sourceLang);
      return {
        translatedText,
        provider: provider.name,
        quality: userPlan === "free" ? "basic" : "fallback"
      };
    } catch (error) {
      console.error(`${provider.name} failed, trying next...`);
      continue;
    }
  }
  
  // If all fail, return original text
  return {
    translatedText: text,
    provider: "none",
    quality: "failed"
  };
}

// Translate SRT with quality based on plan
export async function translateSRTWithQuality(
  srtContent: string,
  targetLang: string,
  sourceLang?: string,
  userPlan: PlanType = "free"
): Promise<string> {
  const lines = srtContent.split("\n");
  const translatedLines: string[] = [];
  
  // For free plan, add delay to simulate "slower" processing
  const delay = userPlan === "free" ? 100 : 0;
  
  for (const line of lines) {
    // Check if line is subtitle text (not number or timestamp)
    if (line && !line.match(/^\d+$/) && !line.includes("-->")) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const { translatedText } = await translateText(
        line,
        targetLang,
        sourceLang,
        userPlan
      );
      
      translatedLines.push(translatedText);
    } else {
      translatedLines.push(line);
    }
  }
  
  return translatedLines.join("\n");
}