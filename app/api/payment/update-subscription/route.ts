import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateUserSubscription } from "@/app/lib/userStore";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, plan, paymentIntentId } = await request.json();

    // Update user subscription in database
    await updateUserSubscription(userId, plan as "pro" | "enterprise", paymentIntentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Error updating subscription" },
      { status: 500 }
    );
  }
}