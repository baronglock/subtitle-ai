import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PRICING_PLANS, CREDIT_PACKAGES } from "@/lib/pricing-config";
import QRCode from "qrcode";
import { kv } from "@vercel/kv";
import { generatePixCode } from "@/lib/pix-config";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, itemId, currency } = await request.json();

    // Only for Brazilian users
    if (currency !== "BRL") {
      return NextResponse.json({ error: "PIX only available for BRL" }, { status: 400 });
    }

    // Determine price and description
    let price = 0;
    let description = "";

    if (type === "credit") {
      const creditPackage = CREDIT_PACKAGES.find(p => p.id === itemId);
      if (!creditPackage) {
        return NextResponse.json({ error: "Invalid credit package" }, { status: 400 });
      }
      price = creditPackage.priceBRL;
      description = `${creditPackage.minutes} minutos de crédito`;
    } else {
      const plan = PRICING_PLANS.find(p => p.id === itemId);
      if (!plan || plan.id === "free" || plan.id === "enterprise") {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      price = plan.priceBRL;
      description = `Plano ${plan.name} - ${plan.minutes} minutos/mês`;
    }

    // Generate unique order ID
    const orderId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate PIX code (Copia e Cola)
    const pixCode = generatePixCode(price, orderId);
    
    // Generate QR Code image
    const qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      }
    });

    // Store pending payment in KV
    await kv.set(`pending_pix:${orderId}`, {
      userId: (session.user as any).id,
      userEmail: session.user.email,
      type: type,
      itemId: itemId,
      amount: price,
      description: description,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    }, { ex: 1800 }); // Expire in 30 minutes

    // Also store by user ID for easy lookup
    const userPendingKey = `user_pending_pix:${(session.user as any).id}`;
    await kv.set(userPendingKey, orderId, { ex: 1800 });

    // Send email notification to admin
    if (process.env.SMTP_HOST && process.env.ADMIN_EMAIL) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"SubtleAI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `⏳ PIX Pendente - ${session.user.email}`,
        html: `
          <h2>Novo PIX Pendente</h2>
          <p><strong>Cliente:</strong> ${session.user.email}</p>
          <p><strong>Valor:</strong> R$ ${price.toFixed(2)}</p>
          <p><strong>Produto:</strong> ${description}</p>
          <p><strong>ID do Pedido:</strong> ${orderId}</p>
          <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <hr>
          <p>⚠️ <strong>IMPORTANTE:</strong> Quando confirmar o recebimento do PIX, acesse:</p>
          <p><a href="${process.env.NEXTAUTH_URL}/api/payment/pix-simple/confirm?orderId=${orderId}&secret=${process.env.ADMIN_SECRET || 'your-secret'}">
            CLIQUE AQUI PARA CONFIRMAR PAGAMENTO
          </a></p>
          <p>ou copie este link:</p>
          <code>${process.env.NEXTAUTH_URL}/api/payment/pix-simple/confirm?orderId=${orderId}&secret=${process.env.ADMIN_SECRET || 'your-secret'}</code>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      pixCode: pixCode,
      qrCode: qrCodeDataUrl,
      amount: price,
      description: description,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error("Error generating PIX:", error);
    return NextResponse.json(
      { error: "Error generating PIX payment" },
      { status: 500 }
    );
  }
}