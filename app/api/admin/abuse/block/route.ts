import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { adminApiMiddleware } from "@/lib/admin-auth";

export async function POST(request: Request) {
  // Check admin auth
  const authError = await adminApiMiddleware();
  if (authError) return authError;
  
  try {
    const { ip, action } = await request.json();
    
    if (!ip || !action) {
      return NextResponse.json(
        { error: "IP and action are required" },
        { status: 400 }
      );
    }
    
    // Get current blocked IPs
    const blockedIPsData = await kv.get("blocked_ips");
    let blockedIPs = (blockedIPsData as string[]) || [];
    
    if (action === "block") {
      // Add IP to blocked list if not already there
      if (!blockedIPs.includes(ip)) {
        blockedIPs.push(ip);
        await kv.set("blocked_ips", blockedIPs);
        
        // Log the blocking action
        await kv.set(`block_log:${ip}:${Date.now()}`, {
          action: "blocked",
          ip,
          timestamp: new Date().toISOString(),
          blockedBy: "admin",
        });
      }
      
      return NextResponse.json({
        success: true,
        message: `IP ${ip} has been blocked`,
        blockedIPs,
      });
      
    } else if (action === "unblock") {
      // Remove IP from blocked list
      blockedIPs = blockedIPs.filter(blockedIp => blockedIp !== ip);
      await kv.set("blocked_ips", blockedIPs);
      
      // Log the unblocking action
      await kv.set(`block_log:${ip}:${Date.now()}`, {
        action: "unblocked",
        ip,
        timestamp: new Date().toISOString(),
        unblockedBy: "admin",
      });
      
      return NextResponse.json({
        success: true,
        message: `IP ${ip} has been unblocked`,
        blockedIPs,
      });
      
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'block' or 'unblock'" },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error("Error managing IP block:", error);
    return NextResponse.json(
      { error: "Failed to manage IP block" },
      { status: 500 }
    );
  }
}