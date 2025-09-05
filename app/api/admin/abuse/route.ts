import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { adminApiMiddleware } from "@/lib/admin-auth";

export async function GET() {
  // Check admin auth
  const authError = await adminApiMiddleware();
  if (authError) return authError;
  
  try {
    // Get IP tracking data
    const ipKeys = await kv.keys("ip:*");
    const ipAbuse = [];
    const suspiciousPatterns = [];
    
    for (const ipKey of ipKeys) {
      const ipData = await kv.get(ipKey);
      if (ipData) {
        const ip = ipData as any;
        const ipAddress = ipKey.replace('ip:', '');
        
        // Check for multiple free accounts
        if (ip.freeAccounts && ip.freeAccounts.length > 2) {
          // Calculate total usage for this IP
          let totalMinutes = 0;
          let totalTranscriptions = 0;
          let lastActivity = null;
          
          for (const email of ip.freeAccounts) {
            // Try to find user by email
            const userKeys = await kv.keys("user:*");
            for (const userKey of userKeys) {
              const userData = await kv.get(userKey);
              if (userData && (userData as any).email === email) {
                const user = userData as any;
                totalMinutes += user.minutesUsed || 0;
                totalTranscriptions += user.transcriptionCount || 0;
                
                if (user.lastActive) {
                  const userLastActive = new Date(user.lastActive);
                  if (!lastActivity || userLastActive > lastActivity) {
                    lastActivity = userLastActive;
                  }
                }
              }
            }
          }
          
          ipAbuse.push({
            ip: ipAddress,
            accounts: ip.freeAccounts.length,
            emails: ip.freeAccounts,
            totalMinutes,
            totalTranscriptions,
            lastActivity: lastActivity?.toISOString(),
            firstSeen: ip.firstSeen,
            lastSeen: ip.lastSeen,
          });
        }
        
        // Check for rapid account creation patterns
        if (ip.accountCreationTimes && ip.accountCreationTimes.length > 3) {
          const times = ip.accountCreationTimes.map((t: string) => new Date(t).getTime());
          times.sort((a: number, b: number) => a - b);
          
          // Check if 3+ accounts were created within 1 hour
          for (let i = 0; i < times.length - 2; i++) {
            if (times[i + 2] - times[i] < 60 * 60 * 1000) {
              suspiciousPatterns.push({
                type: "Rapid Account Creation",
                description: `IP ${ipAddress} created 3+ accounts within 1 hour`,
                timestamp: new Date(times[i]).toISOString(),
                ip: ipAddress,
              });
              break;
            }
          }
        }
      }
    }
    
    // Get rate limit violations
    const rateLimitKeys = await kv.keys("ratelimit:*");
    const rateLimitViolations = [];
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    
    for (const rlKey of rateLimitKeys) {
      const rlData = await kv.get(rlKey);
      if (rlData) {
        const rl = rlData as any;
        if (rl.violations && rl.lastViolation > twentyFourHoursAgo) {
          rateLimitViolations.push({
            key: rlKey.replace('ratelimit:', ''),
            violations: rl.violations,
            lastViolation: new Date(rl.lastViolation).toISOString(),
          });
        }
      }
    }
    
    // Get blocked IPs
    const blockedIPsData = await kv.get("blocked_ips");
    const blockedIPs = (blockedIPsData as string[]) || [];
    
    // Sort by number of accounts (highest first)
    ipAbuse.sort((a, b) => b.accounts - a.accounts);
    
    return NextResponse.json({
      ipAbuse,
      blockedIPs,
      rateLimitViolations,
      suspiciousPatterns,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching abuse data:", error);
    return NextResponse.json(
      { error: "Failed to fetch abuse data" },
      { status: 500 }
    );
  }
}