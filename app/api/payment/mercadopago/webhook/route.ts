import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { kv } from "@vercel/kv";

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // MercadoPago sends notification with payment ID
    if (body.type === "payment" && body.data?.id) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: body.data.id });
      
      // Check payment status
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
          
          console.log(`Payment approved for user ${userId}: ${type} - ${itemId}`);
        }
      }
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