import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "../../../lib/userStore";
import { checkIPLimit, recordIPAccount, getClientIP } from "../../../lib/ip-tracking";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Check IP limit for free accounts
    const clientIP = getClientIP(request);
    const ipCheck = await checkIPLimit(clientIP, email);
    
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { 
          error: ipCheck.reason || "Account creation limit reached",
          existingAccounts: ipCheck.existingAccounts 
        },
        { status: 429 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await createUser({
      email,
      name,
      password: hashedPassword,
    });

    // Record IP for free accounts
    await recordIPAccount(clientIP, email, newUser.plan);

    // Return success (without password)
    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
      },
      message: "Account created successfully"
    });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}