import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { kv } from "@vercel/kv";
import { headers } from "next/headers";
import crypto from "crypto";

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    // Verify webhook signature for security
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const headersList = await headers();
      const signature = headersList.get("x-signature");
      const requestId = headersList.get("x-request-id");
      
      if (signature && requestId) {
        const body = await request.text();
        const ts = signature.split(",")[0]?.split("=")[1];
        const hash = signature.split(",")[1]?.split("=")[1];
        
        const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET);
        hmac.update(manifest);
        const calculatedHash = hmac.digest("hex");
        
        if (hash !== calculatedHash) {
          console.error("Invalid webhook signature");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
        
        // Parse body after verification
        const parsedBody = JSON.parse(body);
        await processPayment(parsedBody);
      }
    } else {
      // No secret configured, process without verification (less secure)
      const body = await request.json();
      await processPayment(body);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}

async function processPayment(body: any) {
  // MercadoPago sends notification with payment ID
  if (body.type === "payment" && body.data?.id) {
    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: body.data.id });
      
      console.log(`Processing payment ${body.data.id}: Status = ${paymentData.status}`);
      
      // Check payment status (approved = paid)
      if (paymentData.status === "approved") {
        const externalRef = paymentData.external_reference;
        if (externalRef) {
          const [userId, type, itemId] = externalRef.split("_");
          
          // Update user's plan or credits
          const userKey = `user:${userId}`;
          const userData = await kv.get(userKey) || {};
          
          if (type === "credit") {
            const creditPackage = (await import("@/lib/pricing-config")).CREDIT_PACKAGES.find(p => p.id === itemId);
            if (creditPackage) {
              const currentMinutes = (userData as any).availableMinutes || 0;
              await kv.set(userKey, {
                ...userData,
                availableMinutes: currentMinutes + creditPackage.minutes,
                lastPayment: {
                  gateway: "mercadopago",
                  paymentId: paymentData.id,
                  amount: paymentData.transaction_amount,
                  date: new Date().toISOString(),
                  type: "credit",
                  package: itemId,
                }
              });
            }
          } else {
            // Update subscription plan
            const plan = (await import("@/lib/pricing-config")).PRICING_PLANS.find(p => p.id === itemId);
            if (plan) {
              await kv.set(userKey, {
                ...userData,
                plan: plan.id,
                planMinutes: plan.minutes,
                planSpeed: plan.processingSpeed,
                subscriptionStart: new Date().toISOString(),
                subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                lastPayment: {
                  gateway: "mercadopago",
                  paymentId: paymentData.id,
                  amount: paymentData.transaction_amount,
                  date: new Date().toISOString(),
                  type: "subscription",
                  plan: plan.id,
                }
              });
            }
          }
          
          console.log(`✅ Payment approved for user ${userId}: ${type} - ${itemId}`);
          
          // Send confirmation email to user
          if (process.env.SMTP_HOST) {
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
            
            const userEmail = paymentData.payer?.email || paymentData.metadata?.user_email;
            
            if (userEmail) {
              await transporter.sendMail({
                from: `"SubtleAI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: userEmail,
                subject: `✅ Pagamento Confirmado - SubtleAI`,
                html: `
                  <h2>Pagamento Confirmado!</h2>
                  <p>Seu pagamento foi processado com sucesso.</p>
                  <p><strong>Valor:</strong> ${paymentData.currency_id} ${paymentData.transaction_amount}</p>
                  <p><strong>Método:</strong> ${paymentData.payment_method_id}</p>
                  <hr>
                  <p>Acesse seu dashboard para começar a usar:</p>
                  <p><a href="${process.env.NEXTAUTH_URL}/dashboard">Acessar Dashboard</a></p>
                  <p>Obrigado por escolher SubtleAI!</p>
                `,
              });
            }
          }
        }
      } else if (paymentData.status === "pending" || paymentData.status === "in_process") {
        console.log(`⏳ Payment pending for ${body.data.id}`);
      } else if (paymentData.status === "rejected") {
        console.log(`❌ Payment rejected for ${body.data.id}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  }
}