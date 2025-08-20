// app/api/transcribe/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { 
  getClientIP, 
  checkRateLimit, 
  detectSuspiciousActivity,
  canUseService,
  updateUsage,
  getUserUsage
} from "../../lib/security";
import { translateSRTWithQuality, PlanType } from "../../lib/translation";

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID!;

// Legacy translation function for backward compatibility
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    // Security: Check authentication for free trial
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required for transcription service" },
        { status: 401 }
      );
    }
    
    // Get client IP for security checks
    const headersList = await headers();
    const clientIP = await getClientIP();
    const userAgent = headersList.get("user-agent") || "";
    
    // Check for suspicious activity
    const suspicious = detectSuspiciousActivity(
      session.user?.email || "",
      clientIP,
      userAgent
    );
    
    if (suspicious.suspicious) {
      return NextResponse.json(
        { error: `Security check failed: ${suspicious.reason}` },
        { status: 403 }
      );
    }
    
    // Rate limiting for free users
    const userPlan = (session.user as any)?.plan || "free";
    if (userPlan === "free") {
      const canProceed = await checkRateLimit(clientIP, "transcribe");
      if (!canProceed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please upgrade your plan for unlimited access." },
          { status: 429 }
        );
      }
    }
    
    const { fileName, targetLanguage, sourceLanguage, estimatedMinutes = 5 } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName é obrigatório" }, { status: 400 });
    }

    // Chama o RunPod serverless endpoint with user plan
    const runpodResponse = await fetch(
      `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/runsync`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RUNPOD_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            bucketName: process.env.R2_BUCKET_NAME!,
            fileName: fileName,
            targetLanguage: targetLanguage || null,
            userPlan: userPlan,  // Send user plan to select model quality
          },
        }),
      }
    );

    if (!runpodResponse.ok) {
      const error = await runpodResponse.text();
      console.error("Erro do RunPod:", error);
      return NextResponse.json(
        { error: "Erro ao processar transcrição" },
        { status: runpodResponse.status }
      );
    }

    const result = await runpodResponse.json();

    // RunPod retorna a resposta em result.output
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    let output = result.output;

    // Check usage limits
    const userId = (session?.user as any)?.id || "anonymous";
    const actualMinutes = Math.ceil(output.duration / 60) || estimatedMinutes;
    
    if (!canUseService(userId, actualMinutes)) {
      const usage = getUserUsage(userId);
      return NextResponse.json(
        { 
          error: `Monthly limit exceeded. You've used ${usage.minutesUsed} minutes. Please upgrade your plan or purchase credits.`,
          usage: usage
        },
        { status: 403 }
      );
    }
    
    // Update usage
    updateUsage(userId, actualMinutes);
    
    // Translation with quality based on user plan
    if (targetLanguage && output.srt) {
      try {
        // Add processing delay for free plan to show it's "slower"
        if (userPlan === "free") {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const translatedSRT = await translateSRTWithQuality(
          output.srt,
          targetLanguage,
          output.detected_language || sourceLanguage,
          userPlan as PlanType
        );
        
        output.srt = translatedSRT;
        output.translated = true;
        output.translationQuality = userPlan === "free" 
          ? "Basic (85% accuracy - Google Translate)" 
          : userPlan === "starter"
          ? "High Quality (95% accuracy - GPT-5-mini)"
          : userPlan === "pro"
          ? "Premium (99.5% accuracy - GPT-5-mini with optimization)"
          : "Professional (99.9% accuracy - GPT-5-mini)";
        output.userPlan = userPlan;
      } catch (error) {
        console.error("Translation failed:", error);
        output.translationError = "Translation failed, returning original text";
      }
    }

    return NextResponse.json(output);
  } catch (error) {
    console.error("Erro ao chamar RunPod:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para verificar status de jobs assíncronos (opcional)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "jobId é obrigatório" }, { status: 400 });
  }

  try {
    const statusResponse = await fetch(
      `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
      {
        headers: {
          "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      return NextResponse.json(
        { error: "Erro ao verificar status" },
        { status: statusResponse.status }
      );
    }

    const status = await statusResponse.json();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}