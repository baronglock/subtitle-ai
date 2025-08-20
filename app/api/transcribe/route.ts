// app/api/transcribe/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID!;

// Helper function to translate SRT content
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
    const { fileName, targetLanguage, sourceLanguage } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName é obrigatório" }, { status: 400 });
    }

    // Chama o RunPod serverless endpoint
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

    // If translation is requested and user is on free plan, use Google Translate
    if (targetLanguage && output.srt) {
      const userPlan = (session?.user as any)?.plan || "free";
      
      if (userPlan === "free") {
        // Free plan: use Google Translate API
        try {
          const translatedSRT = await translateSRT(
            output.srt,
            targetLanguage,
            output.detected_language || sourceLanguage
          );
          output.srt = translatedSRT;
          output.translated = true;
          output.translationMethod = "Google Translate (Free Plan)";
        } catch (error) {
          console.error("Translation failed:", error);
          output.translationError = "Translation failed, returning original text";
        }
      }
      // Pro and Enterprise plans would use more advanced translation services
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