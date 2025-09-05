import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { adminApiMiddleware } from "@/lib/admin-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  // Check admin auth
  const authError = await adminApiMiddleware();
  if (authError) return authError;
  
  try {
    const { ticketId } = await params;
    const { status } = await request.json();
    
    // Validate status
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    
    // Get existing ticket
    const ticketKey = `ticket:${ticketId}`;
    const ticket = await kv.get(ticketKey);
    
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    // Update ticket with new status
    const updatedTicket = {
      ...(ticket as any),
      status,
      statusUpdatedAt: new Date().toISOString(),
    };
    
    await kv.set(ticketKey, updatedTicket);
    
    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
    
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "Failed to update ticket status" },
      { status: 500 }
    );
  }
}