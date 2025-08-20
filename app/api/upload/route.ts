// app/api/upload/route.ts

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// Configura o cliente S3 para se conectar ao Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Nome do arquivo e tipo são obrigatórios" }, { status: 400 });
    }

    // Cria um comando para colocar um objeto no bucket
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: filename, // O nome que o arquivo terá no R2
      ContentType: contentType,
    });

    // Gera a URL segura que permite fazer o upload (válida por 10 minutos)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}