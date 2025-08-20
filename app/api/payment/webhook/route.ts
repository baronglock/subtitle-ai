import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { handleStripeWebhook } from "../../../lib/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  
  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }
  
  try {
    const result = await handleStripeWebhook(body, signature);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 400 }
      );
    }
    
    // TODO: Update database with payment result
    // For now, just log
    console.log("Webhook processed:", result);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}