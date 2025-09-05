import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// Get single ticket
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { ticketId } = await params;
    const ticket = await kv.get(`ticket:${ticketId}`);
    
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    
    // Check if user has access to this ticket
    const userEmail = session.user?.email;
    const isAdmin = userEmail === process.env.ADMIN_EMAIL;
    const isOwner = (ticket as any).email === userEmail || (ticket as any).userId === (session.user as any).id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ ticket });
    
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// Update ticket (add reply)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { message, status } = await request.json();
    
    const { ticketId } = await params;
    const ticket = await kv.get(`ticket:${ticketId}`);
    
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    
    const ticketData = ticket as any;
    
    // Check if user has access to this ticket
    const userEmail = session.user?.email;
    const isAdmin = userEmail === process.env.ADMIN_EMAIL;
    const isOwner = ticketData.email === userEmail || ticketData.userId === (session.user as any).id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Add message to ticket
    if (message) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        from: session.user?.email || "unknown",
        name: session.user?.name || "User",
        message: message,
        timestamp: new Date().toISOString(),
        isAdmin: isAdmin,
      };
      
      ticketData.messages.push(newMessage);
      ticketData.updatedAt = new Date().toISOString();
      
      // Send email notification
      if (process.env.SMTP_HOST) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        
        // Send to the other party
        const sendTo = isAdmin ? ticketData.email : process.env.ADMIN_EMAIL;
        const fromName = isAdmin ? "SubtleAI Support" : ticketData.name;
        
        await transporter.sendMail({
          from: `"${fromName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: sendTo,
          subject: `Re: Ticket #${ticketId.slice(-8)}: ${ticketData.subject}`,
          html: `
            <h2>Nova resposta no Ticket #${ticketId.slice(-8)}</h2>
            <p><strong>De:</strong> ${session.user?.name || 'User'} ${isAdmin ? '(Suporte)' : ''}</p>
            <p><strong>Mensagem:</strong></p>
            <blockquote style="border-left: 3px solid #3b82f6; padding-left: 10px; margin-left: 0;">
              ${message.replace(/\n/g, '<br>')}
            </blockquote>
            <hr>
            <h3>Histórico da conversa:</h3>
            ${ticketData.messages.slice(-5).map((msg: any) => `
              <div style="margin-bottom: 15px; padding: 10px; background: ${msg.isAdmin ? '#e0f2fe' : '#f3f4f6'}; border-radius: 5px;">
                <p style="margin: 0 0 5px 0;"><strong>${msg.name}</strong> ${msg.isAdmin ? '(Suporte)' : ''} - ${new Date(msg.timestamp).toLocaleString('pt-BR')}</p>
                <p style="margin: 0;">${msg.message.replace(/\n/g, '<br>')}</p>
              </div>
            `).join('')}
            <hr>
            <p>
              <a href="${process.env.NEXTAUTH_URL}/${isAdmin ? 'admin' : 'dashboard'}/tickets/${ticketId}" 
                 style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Ver ticket completo
              </a>
            </p>
          `,
        });
      }
    }
    
    // Update status if provided
    if (status && isAdmin) {
      ticketData.status = status;
      ticketData.updatedAt = new Date().toISOString();
    }
    
    // Save updated ticket
    await kv.set(`ticket:${ticketId}`, ticketData);
    
    return NextResponse.json({ 
      success: true,
      ticket: ticketData 
    });
    
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}