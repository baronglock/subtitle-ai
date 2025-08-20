import Stripe from "stripe";
import { PRICING_PLANS, CREDIT_PACKAGES, formatPrice } from "./pricing";

// Lazy initialization - only create when needed, not during build
function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-07-30.basil",
  });
}

// Detect user's country from IP or browser
export function detectUserCountry(headers: any): "BR" | "US" | "OTHER" {
  const acceptLanguage = headers.get("accept-language") || "";
  const cfCountry = headers.get("cf-ipcountry") || "";
  
  if (cfCountry === "BR" || acceptLanguage.includes("pt-BR")) {
    return "BR";
  }
  if (cfCountry === "US" || acceptLanguage.includes("en-US")) {
    return "US";
  }
  return "OTHER";
}

// Create Stripe checkout session for subscription
export async function createCheckoutSession(
  planId: string,
  userId: string,
  email: string,
  country: "BR" | "US" | "OTHER",
  billingPeriod: "monthly" | "yearly" = "monthly"
) {
  const plan = PRICING_PLANS.find(p => p.id === planId);
  if (!plan) throw new Error("Plan not found");

  const currency = country === "BR" ? "brl" : "usd";
  const price = billingPeriod === "yearly" ? plan.priceYearly[currency] : plan.priceMonthly[currency];
  
  // Payment methods based on country
  const paymentMethods = country === "BR" 
    ? ["card", "boleto", "pix"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[]
    : ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: paymentMethods,
    mode: "subscription",
    customer_email: email,
    client_reference_id: userId,
    metadata: {
      planId,
      userId,
      billingPeriod
    },
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `${plan.name} Plan`,
            description: plan.description,
            metadata: {
              minutes: plan.minutes.toString(),
              accuracy: plan.accuracy,
              quality: plan.translationQuality
            }
          },
          unit_amount: Math.round(price * 100), // Stripe uses cents
          recurring: {
            interval: billingPeriod === "yearly" ? "year" : "month"
          }
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?payment=cancelled`,
    // Enable PIX for Brazilian customers
    payment_method_options: country === "BR" ? {
      pix: {
        expires_after_seconds: 3600 // PIX expires in 1 hour
      },
      boleto: {
        expires_after_days: 3 // Boleto expires in 3 days
      }
    } : undefined,
    // Localization
    locale: country === "BR" ? "pt-BR" : "en"
  });

  return session;
}

// Create one-time payment for credits
export async function createCreditPayment(
  packageId: string,
  userId: string,
  email: string,
  country: "BR" | "US" | "OTHER"
) {
  const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!creditPackage) throw new Error("Package not found");

  const currency = country === "BR" ? "brl" : "usd";
  const price = creditPackage.price[currency];
  
  const paymentMethods = country === "BR" 
    ? ["card", "boleto", "pix"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[]
    : ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: paymentMethods,
    mode: "payment",
    customer_email: email,
    client_reference_id: userId,
    metadata: {
      type: "credits",
      packageId,
      userId,
      minutes: creditPackage.minutes.toString()
    },
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `${creditPackage.minutes} Minutes Credit`,
            description: `Add ${creditPackage.minutes} minutes to your account`,
          },
          unit_amount: Math.round(price * 100)
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&type=credits`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?payment=cancelled`,
    payment_method_options: country === "BR" ? {
      pix: {
        expires_after_seconds: 3600
      },
      boleto: {
        expires_after_days: 3
      }
    } : undefined,
    locale: country === "BR" ? "pt-BR" : "en"
  });

  return session;
}

// Create payment for human revision service
export async function createRevisionPayment(
  minutes: number,
  language: string,
  userId: string,
  email: string,
  country: "BR" | "US" | "OTHER"
) {
  const currency = country === "BR" ? "brl" : "usd";
  const pricePerMinute = currency === "brl" ? 2.50 : 0.50;
  const totalPrice = minutes * pricePerMinute;
  
  const paymentMethods = country === "BR" 
    ? ["card", "boleto", "pix"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[]
    : ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: paymentMethods,
    mode: "payment",
    customer_email: email,
    client_reference_id: userId,
    metadata: {
      type: "revision",
      userId,
      minutes: minutes.toString(),
      language
    },
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: "Human Revision Service",
            description: `Professional human revision for ${minutes} minutes of ${language} content (24hr delivery)`,
          },
          unit_amount: Math.round(totalPrice * 100)
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&type=revision`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
    payment_method_options: country === "BR" ? {
      pix: {
        expires_after_seconds: 3600
      },
      boleto: {
        expires_after_days: 3
      }
    } : undefined,
    locale: country === "BR" ? "pt-BR" : "en"
  });

  return session;
}

// Handle webhook events from Stripe
export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<{ success: boolean; userId?: string; action?: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  try {
    const event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const metadata = session.metadata;
        
        if (!userId) return { success: false };
        
        if (metadata?.type === "credits") {
          // Add credits to user account
          const minutes = parseInt(metadata.minutes);
          // TODO: Update user credits in database
          return { success: true, userId, action: `added_${minutes}_credits` };
        } else if (metadata?.type === "revision") {
          // Create revision task
          // TODO: Create revision task in database
          return { success: true, userId, action: "revision_requested" };
        } else {
          // Update user subscription
          const planId = metadata?.planId;
          // TODO: Update user plan in database
          return { success: true, userId, action: `subscribed_to_${planId}` };
        }
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // TODO: Downgrade user to free plan
        return { success: true, action: "subscription_cancelled" };
      }
      
      default:
        return { success: true };
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return { success: false };
  }
}

// Get customer portal URL for managing subscription
export async function createCustomerPortal(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  
  return session.url;
}