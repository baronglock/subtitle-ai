import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// Create a new support ticket
export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();
    const session = await getServerSession(authOptions);
    
    // Generate ticket ID
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create ticket object
    const ticket = {
      id: ticketId,
      userId: session?.user ? (session.user as any).id : null,
      name: name || session?.user?.name || "Anonymous",
      email: email || session?.user?.email,
      subject: subject,
      message: message,
      status: "open", // open, in_progress, resolved, closed
      priority: "normal", // low, normal, high, urgent
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          from: email || session?.user?.email,
          name: name || session?.user?.name,
          message: message,
          timestamp: new Date().toISOString(),
          isAdmin: false,
        }
      ],
      assignedTo: null,
    };
    
    // Store ticket in KV
    await kv.set(`ticket:${ticketId}`, ticket);
    
    // Add to tickets list
    const ticketsList = await kv.get("tickets:list") || [];
    (ticketsList as any[]).unshift(ticketId);
    await kv.set("tickets:list", ticketsList);
    
    // Add to user's tickets if logged in
    if (session?.user) {
      const userTicketsKey = `user:${(session.user as any).id}:tickets`;
      const userTickets = await kv.get(userTicketsKey) || [];
      (userTickets as any[]).unshift(ticketId);
      await kv.set(userTicketsKey, userTickets);
    }
    
    // Send notification email to admin if configured
    if (process.env.SMTP_HOST && process.env.ADMIN_EMAIL) {
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
      
      await transporter.sendMail({
        from: `"SubtleAI Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `[Ticket #${ticketId.slice(-8)}] ${subject}`,
        html: `
          <h2>New Support Ticket</h2>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <hr>
          <p>
            <a href="${process.env.NEXTAUTH_URL}/admin/tickets/${ticketId}" 
               style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Ticket in Admin Panel
            </a>
          </p>
        `,
      });
      
      // Send confirmation to user
      await transporter.sendMail({
        from: `"SubtleAI Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: `Ticket #${ticketId.slice(-8)}: ${subject}`,
        html: `
          <h2>Recebemos sua mensagem!</h2>
          <p>Olá ${name},</p>
          <p>Obrigado por entrar em contato. Seu ticket foi criado com sucesso.</p>
          <p><strong>Número do Ticket:</strong> #${ticketId.slice(-8)}</p>
          <p>Responderemos em até 24 horas.</p>
          <hr>
          <p><strong>Sua mensagem:</strong></p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <hr>
          <p>Para acompanhar seu ticket, acesse sua conta em nosso site.</p>
          <p>Atenciosamente,<br>Equipe SubtleAI</p>
        `,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      ticketId: ticketId,
      ticketNumber: ticketId.slice(-8) 
    });
    
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

// Get tickets (for admin or user)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("admin") === "true";
    
    // Check if user is admin (you can implement your own admin check logic)
    const userEmail = session.user?.email;
    const isAdminUser = userEmail === process.env.ADMIN_EMAIL;
    
    let tickets = [];
    
    if (isAdmin && isAdminUser) {
      // Get all tickets for admin
      const ticketsList = await kv.get("tickets:list") || [];
      for (const ticketId of ticketsList as string[]) {
        const ticket = await kv.get(`ticket:${ticketId}`);
        if (ticket) tickets.push(ticket);
      }
    } else {
      // Get user's tickets
      const userTicketsKey = `user:${(session.user as any).id}:tickets`;
      const userTickets = await kv.get(userTicketsKey) || [];
      for (const ticketId of userTickets as string[]) {
        const ticket = await kv.get(`ticket:${ticketId}`);
        if (ticket) tickets.push(ticket);
      }
    }
    
    return NextResponse.json({ tickets });
    
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}