import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { adminApiMiddleware } from "@/lib/admin-auth";

export async function GET() {
  // Check admin auth
  const authError = await adminApiMiddleware();
  if (authError) return authError;
  
  try {
    // Get all ticket keys
    const ticketKeys = await kv.keys("ticket:*");
    
    const tickets = [];
    
    for (const key of ticketKeys) {
      const ticketData = await kv.get(key);
      if (ticketData) {
        const ticket = ticketData as any;
        tickets.push({
          id: key.replace('ticket:', ''),
          ...ticket,
        });
      }
    }
    
    // Sort tickets by creation date (newest first)
    tickets.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({
      tickets,
      total: tickets.length,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}