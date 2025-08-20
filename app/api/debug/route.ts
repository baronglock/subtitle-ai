import { NextResponse } from "next/server";
import { kv, isKVAvailable } from "../../lib/kv-client";
import { getAllUsers } from "../../lib/userStore";

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GITHUB_ID: !!process.env.GITHUB_ID,
      KV_URL: !!process.env.STORAGE_USERS_KV_REST_API_URL,
      KV_TOKEN: !!process.env.STORAGE_USERS_KV_REST_API_TOKEN,
    };

    // Test KV connection
    let kvTest = { available: false, error: null, testWrite: false };
    if (isKVAvailable && kv) {
      try {
        // Try a test write/read
        await kv.set("test:ping", "pong", { ex: 60 }); // expires in 60 seconds
        const result = await kv.get("test:ping");
        kvTest = { 
          available: true, 
          error: null,
          testWrite: result === "pong"
        };
      } catch (error: any) {
        kvTest = { 
          available: false, 
          error: error.message,
          testWrite: false
        };
      }
    }

    // Get users count
    let usersCount = 0;
    try {
      const users = await getAllUsers();
      usersCount = users.length;
    } catch (error) {
      console.error("Error getting users:", error);
    }

    return NextResponse.json({
      status: "Debug Info",
      environment: envCheck,
      kvConnection: kvTest,
      isKVAvailable,
      usersCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Debug endpoint error",
      message: error.message,
    }, { status: 500 });
  }
}