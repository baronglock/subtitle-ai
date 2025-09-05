import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { PRICING_PLANS, CREDIT_PACKAGES } from "@/lib/pricing-config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const secret = searchParams.get("secret");

    // Verify admin secret
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Get pending payment
    const pendingPayment = await kv.get(`pending_pix:${orderId}`);
    if (!pendingPayment) {
      return NextResponse.json({ error: "Payment not found or expired" }, { status: 404 });
    }

    const payment = pendingPayment as any;

    // Update user's plan or credits
    const userKey = `user:${payment.userId}`;
    const userData = await kv.get(userKey) || {};

    if (payment.type === "credit") {
      const creditPackage = CREDIT_PACKAGES.find(p => p.id === payment.itemId);
      if (creditPackage) {
        const currentMinutes = (userData as any).availableMinutes || 0;
        await kv.set(userKey, {
          ...userData,
          availableMinutes: currentMinutes + creditPackage.minutes,
          lastPayment: {
            gateway: "pix_simple",
            orderId: orderId,
            amount: payment.amount,
            date: new Date().toISOString(),
            type: "credit",
            package: payment.itemId,
          }
        });
      }
    } else {
      // Update subscription plan
      const plan = PRICING_PLANS.find(p => p.id === payment.itemId);
      if (plan) {
        await kv.set(userKey, {
          ...userData,
          plan: plan.id,
          planMinutes: plan.minutes,
          planSpeed: plan.processingSpeed,
          subscriptionStart: new Date().toISOString(),
          subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastPayment: {
            gateway: "pix_simple",
            orderId: orderId,
            amount: payment.amount,
            date: new Date().toISOString(),
            type: "subscription",
            plan: plan.id,
          }
        });
      }
    }

    // Mark payment as completed
    await kv.set(`pending_pix:${orderId}`, {
      ...payment,
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    // Remove from pending
    await kv.del(`user_pending_pix:${payment.userId}`);

    // Send confirmation email to user
    if (process.env.SMTP_HOST && payment.userEmail) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
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
        to: payment.userEmail,
        subject: `✅ Pagamento Confirmado - SubtleAI`,
        html: `
          <h2>Pagamento Confirmado!</h2>
          <p>Seu pagamento foi processado com sucesso.</p>
          <p><strong>Produto:</strong> ${payment.description}</p>
          <p><strong>Valor:</strong> R$ ${payment.amount.toFixed(2)}</p>
          <hr>
          <p>Acesse seu dashboard para começar a usar:</p>
          <p><a href="${process.env.NEXTAUTH_URL}/dashboard">Acessar Dashboard</a></p>
          <p>Obrigado por escolher SubtleAI!</p>
        `,
      });
    }

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pagamento Confirmado</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 1rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #10b981; margin-bottom: 1rem; }
            p { color: #4b5563; margin: 0.5rem 0; }
            .order-id { 
              background: #f3f4f6; 
              padding: 0.5rem 1rem; 
              border-radius: 0.5rem;
              font-family: monospace;
              margin: 1rem 0;
            }
            .success-icon {
              width: 80px;
              height: 80px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1rem;
            }
            .success-icon::after {
              content: "✓";
              color: white;
              font-size: 3rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon"></div>
            <h1>Pagamento Confirmado!</h1>
            <p>O pagamento foi processado com sucesso.</p>
            <div class="order-id">Pedido: ${orderId}</div>
            <p><strong>Cliente:</strong> ${payment.userEmail}</p>
            <p><strong>Valor:</strong> R$ ${payment.amount.toFixed(2)}</p>
            <p><strong>Produto:</strong> ${payment.description}</p>
            <p style="margin-top: 2rem; color: #10b981;">
              ✅ O cliente já tem acesso ao produto!
            </p>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Error confirming payment" },
      { status: 500 }
    );
  }
}