import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PRICING_PLANS, CREDIT_PACKAGES } from "@/lib/pricing-config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, itemId, paymentMethod, currency } = await request.json();

    // Determine price based on item and currency
    let price = 0;
    let description = "";
    let mode: Stripe.Checkout.SessionCreateParams["mode"] = "payment";

    if (type === "credit") {
      const creditPackage = CREDIT_PACKAGES.find(p => p.id === itemId);
      if (!creditPackage) {
        return NextResponse.json({ error: "Invalid credit package" }, { status: 400 });
      }
      price = currency === "BRL" ? creditPackage.priceBRL : creditPackage.priceUSD;
      description = `${creditPackage.minutes} minutes of transcription credits`;
    } else {
      const plan = PRICING_PLANS.find(p => p.id === itemId);
      if (!plan || plan.id === "free" || plan.id === "enterprise") {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      price = currency === "BRL" ? plan.priceBRL : plan.priceUSD;
      description = `${plan.name} Plan - ${plan.minutes} minutes per month`;
      mode = "subscription";
    }

    // Payment methods based on country
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = 
      currency === "BRL" && paymentMethod === "pix" 
        ? ["pix"]
        : currency === "BRL"
        ? ["card", "pix", "boleto"]  // Include PIX for Brazilian users
        : ["card"];

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      mode: mode,
      customer_email: session.user.email!,
      client_reference_id: (session.user as any).id,
      metadata: {
        type: type,
        itemId: itemId,
        userId: (session.user as any).id,
      },
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: type === "credit" ? "Transcription Credits" : `${itemId} Plan`,
              description: description,
            },
            unit_amount: Math.round(price * 100), // Stripe uses cents
            ...(mode === "subscription" && {
              recurring: {
                interval: "month" as const,
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?payment=cancelled`,
      // PIX specific settings
      ...(paymentMethod === "pix" && currency === "BRL" && {
        payment_method_options: {
          pix: {
            expires_after_seconds: 3600, // PIX expires in 1 hour
          },
        },
      }),
      // Locale
      locale: currency === "BRL" ? "pt-BR" : "en",
    });

    // For PIX payments, we need to get the payment intent details
    if (paymentMethod === "pix" && currency === "BRL") {
      // Note: In production, you'd handle this via webhooks
      return NextResponse.json({
        sessionUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        pixCode: "PIX_CODE_PLACEHOLDER", // This would come from the payment intent
        pixQrCode: "QR_CODE_URL_PLACEHOLDER", // This would be generated
      });
    }

    return NextResponse.json({
      sessionUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Error creating payment session:", error);
    return NextResponse.json(
      { error: "Error creating payment session" },
      { status: 500 }
    );
  }
}