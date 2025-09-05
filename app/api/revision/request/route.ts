import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import nodemailer from "nodemailer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      transcriptionId, 
      contentMinutes, 
      language, 
      transcriptionText,
      paymentIntentId 
    } = await request.json();

    // Calculate price (R$2.50 per minute for Brazil, $0.50 for others)
    const isBrazil = request.headers.get("cf-ipcountry") === "BR";
    const pricePerMinute = isBrazil ? 2.50 : 0.50;
    const currency = isBrazil ? "BRL" : "USD";
    const totalPrice = contentMinutes * pricePerMinute;

    // Create payment intent if not provided
    let finalPaymentIntentId = paymentIntentId;
    
    if (!paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          type: "human_revision",
          transcriptionId,
          contentMinutes: contentMinutes.toString(),
          language,
          userEmail: session.user.email!,
        },
      });
      finalPaymentIntentId = paymentIntent.id;
    }

    // Send notification email to admin
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const adminEmail = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO, // Your personal email
      subject: `[URGENTE] Nova Revisão Humana - ${contentMinutes} minutos em ${language}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">⚡ Nova Solicitação de Revisão Humana</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Cliente:</strong> ${session.user.name} (${session.user.email})</p>
            <p><strong>Duração do conteúdo:</strong> ${contentMinutes} minutos</p>
            <p><strong>Idioma:</strong> ${language}</p>
            <p><strong>Valor:</strong> ${currency} ${totalPrice.toFixed(2)}</p>
            <p><strong>Prazo:</strong> 24 horas</p>
            <p><strong>Payment ID:</strong> ${finalPaymentIntentId}</p>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0;">📝 Transcrição Original:</h3>
            <div style="max-height: 400px; overflow-y: auto; background: white; padding: 10px; border-radius: 4px;">
              <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${transcriptionText}</pre>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 8px;">
            <p style="margin: 0;"><strong>Ação necessária:</strong></p>
            <ol>
              <li>Revisar e corrigir a transcrição acima</li>
              <li>Garantir precisão de 99.9%</li>
              <li>Enviar versão revisada em até 24 horas</li>
              <li>Responder este email com o arquivo revisado</li>
            </ol>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(adminEmail);

    // Send confirmation email to user
    const userEmail = {
      from: process.env.EMAIL_FROM,
      to: session.user.email!,
      subject: "Revisão Humana Solicitada - SubtleAI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">✅ Revisão Humana Confirmada</h2>
          
          <p>Olá ${session.user.name},</p>
          
          <p>Recebemos sua solicitação de revisão humana para ${contentMinutes} minutos de conteúdo em ${language}.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Detalhes do Pedido:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>✓ Duração: ${contentMinutes} minutos</li>
              <li>✓ Idioma: ${language}</li>
              <li>✓ Valor: ${currency} ${totalPrice.toFixed(2)}</li>
              <li>✓ Prazo de entrega: 24 horas</li>
              <li>✓ Precisão garantida: 99.9%</li>
            </ul>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
            <p><strong>🕐 Prazo de entrega:</strong> Você receberá a transcrição revisada em até 24 horas por email.</p>
          </div>

          <p>Nossa equipe de revisores especializados está trabalhando na sua transcrição para garantir máxima precisão.</p>
          
          <p>Atenciosamente,<br>Equipe SubtleAI</p>
        </div>
      `,
    };

    await transporter.sendMail(userEmail);

    // Store revision request in database (or KV store)
    // This would be implemented with your storage solution

    return NextResponse.json({
      success: true,
      message: "Revision request submitted successfully",
      paymentIntentId: finalPaymentIntentId,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      totalPrice,
      currency,
    });
  } catch (error) {
    console.error("Error processing revision request:", error);
    return NextResponse.json(
      { error: "Failed to process revision request" },
      { status: 500 }
    );
  }
}