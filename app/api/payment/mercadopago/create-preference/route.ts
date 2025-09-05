import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PRICING_PLANS, CREDIT_PACKAGES } from "@/lib/pricing-config";

// Initialize MercadoPago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { 
    timeout: 5000,
    idempotencyKey: 'abc' 
  }
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, itemId, currency } = await request.json();

    // Determine price and description
    let price = 0;
    let title = "";
    let description = "";

    if (type === "credit") {
      const creditPackage = CREDIT_PACKAGES.find(p => p.id === itemId);
      if (!creditPackage) {
        return NextResponse.json({ error: "Invalid credit package" }, { status: 400 });
      }
      price = currency === "BRL" ? creditPackage.priceBRL : creditPackage.priceUSD;
      title = `${creditPackage.minutes} Minutos de Crédito`;
      description = `Pacote de ${creditPackage.minutes} minutos de transcrição`;
    } else {
      const plan = PRICING_PLANS.find(p => p.id === itemId);
      if (!plan || plan.id === "free" || plan.id === "enterprise") {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      price = currency === "BRL" ? plan.priceBRL : plan.priceUSD;
      title = `Plano ${plan.name}`;
      description = `${plan.minutes} minutos por mês - Velocidade ${plan.processingSpeed}x`;
    }

    // Create preference
    const preference = new Preference(client);
    
    const preferenceData = {
      items: [
        {
          id: itemId,
          title: title,
          description: description,
          quantity: 1,
          currency_id: currency,
          unit_price: price,
        }
      ],
      payer: {
        email: session.user.email!,
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 1,
        default_payment_method_id: "pix", // Default to PIX
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&gateway=mercadopago`,
        failure: `${process.env.NEXTAUTH_URL}/pricing?payment=failed&gateway=mercadopago`,
        pending: `${process.env.NEXTAUTH_URL}/dashboard?payment=pending&gateway=mercadopago`,
      },
      auto_return: "approved",
      statement_descriptor: "SubtleAI",
      external_reference: `${(session.user as any).id}_${type}_${itemId}`,
      notification_url: `${process.env.NEXTAUTH_URL}/api/payment/mercadopago/webhook`,
      expires: false,
      metadata: {
        userId: (session.user as any).id,
        type: type,
        itemId: itemId,
        user_email: session.user.email, // For webhook notifications
      }
    };

    const response = await preference.create({ body: preferenceData });

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point, // Redirect URL for checkout
      sandboxInitPoint: response.sandbox_init_point, // For testing
    });

  } catch (error) {
    console.error("Error creating MercadoPago preference:", error);
    return NextResponse.json(
      { error: "Error creating payment preference" },
      { status: 500 }
    );
  }
}