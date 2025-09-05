import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Create a transporter using your email service
    // For Gmail, you'll need an app-specific password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM, // Your business email (e.g., support@subtleai.com)
        pass: process.env.EMAIL_APP_PASSWORD, // Gmail app-specific password
      },
    });

    // Email options
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_FROM}>`, // Shows as from your business email
      to: process.env.EMAIL_TO, // Your personal email where you want to receive
      replyTo: email, // When you reply, it will go to the customer's email
      subject: `[SubtleAI Support] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Support Request</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="padding: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #1f2937;">Message:</h3>
            <p style="color: #4b5563; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; color: #92400e;">
              <strong>Note:</strong> Reply directly to this email to respond to the customer.
            </p>
          </div>
        </div>
      `,
      text: `
        New Support Request from SubtleAI
        
        From: ${name}
        Email: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
        
        Reply directly to this email to respond to the customer.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Also send a confirmation email to the customer
    const confirmationOptions = {
      from: `"SubtleAI Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "We received your message - SubtleAI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #3b82f6;">Thank you for contacting SubtleAI</h1>
          </div>
          <div style="padding: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
            <p>Hi ${name},</p>
            <p>We've received your message and our support team will get back to you within 24 hours.</p>
            <p>For reference, here's a copy of your message:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Subject:</strong> ${subject}</p>
              <p style="margin-top: 10px;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>Best regards,<br>The SubtleAI Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(confirmationOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}