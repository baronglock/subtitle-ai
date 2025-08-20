import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { 
  createCheckoutSession, 
  createCreditPayment,
  createRevisionPayment,
  detectUserCountry 
} from "../../../lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const { 
      type, // "subscription" | "credits" | "revision"
      planId,
      packageId,
      billingPeriod,
      revisionMinutes,
      revisionLanguage
    } = await request.json();
    
    const headersList = headers();
    const country = detectUserCountry(headersList);
    const userId = (session.user as any).id;
    const email = session.user.email!;
    
    let checkoutUrl: string;
    
    switch (type) {
      case "subscription":
        if (!planId) {
          return NextResponse.json(
            { error: "Plan ID required" },
            { status: 400 }
          );
        }
        const subscriptionSession = await createCheckoutSession(
          planId,
          userId,
          email,
          country,
          billingPeriod || "monthly"
        );
        checkoutUrl = subscriptionSession.url!;
        break;
        
      case "credits":
        if (!packageId) {
          return NextResponse.json(
            { error: "Package ID required" },
            { status: 400 }
          );
        }
        const creditSession = await createCreditPayment(
          packageId,
          userId,
          email,
          country
        );
        checkoutUrl = creditSession.url!;
        break;
        
      case "revision":
        if (!revisionMinutes || !revisionLanguage) {
          return NextResponse.json(
            { error: "Revision minutes and language required" },
            { status: 400 }
          );
        }
        const revisionSession = await createRevisionPayment(
          revisionMinutes,
          revisionLanguage,
          userId,
          email,
          country
        );
        checkoutUrl = revisionSession.url!;
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid payment type" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ url: checkoutUrl });
    
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}