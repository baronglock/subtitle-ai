import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { adminApiMiddleware } from "@/lib/admin-auth";

export async function GET() {
  // Check admin auth
  const authError = await adminApiMiddleware();
  if (authError) return authError;
  
  try {
    // Get all user keys
    const userKeys = await kv.keys("user:*");
    
    // Statistics
    const stats = {
      totalUsers: 0,
      freeUsers: 0,
      proUsers: 0,
      premiumUsers: 0,
      totalMinutesUsed: 0,
      totalRevenue: 0,
      activeToday: 0,
      ipAbuseDetected: [],
      recentTranscriptions: [],
    };
    
    const users = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get all users data
    for (const key of userKeys) {
      if (!key.includes(':tickets') && !key.includes(':ip')) {
        const userData = await kv.get(key);
        if (userData) {
          const user = userData as any;
          const userId = key.replace('user:', '');
          
          // Get user session data if exists
          const sessionKey = `session:${userId}`;
          const sessionData = await kv.get(sessionKey);
          
          const enrichedUser = {
            id: userId,
            email: user.email || sessionData?.email || 'Unknown',
            name: user.name || sessionData?.name || 'Unknown',
            plan: user.plan || 'free',
            minutesUsed: user.minutesUsed || 0,
            availableMinutes: user.availableMinutes || 0,
            planMinutes: user.planMinutes || 120,
            createdAt: user.createdAt || user.registeredAt,
            lastActive: user.lastActive || user.lastLogin,
            subscriptionEnd: user.subscriptionEnd,
            totalSpent: user.totalSpent || 0,
            ipAddress: user.lastIp,
            transcriptionCount: user.transcriptionCount || 0,
          };
          
          users.push(enrichedUser);
          
          // Update stats
          stats.totalUsers++;
          
          if (enrichedUser.plan === 'free') stats.freeUsers++;
          else if (enrichedUser.plan === 'pro') stats.proUsers++;
          else if (enrichedUser.plan === 'premium') stats.premiumUsers++;
          
          stats.totalMinutesUsed += enrichedUser.minutesUsed;
          stats.totalRevenue += enrichedUser.totalSpent;
          
          // Check if active today
          if (enrichedUser.lastActive && enrichedUser.lastActive.startsWith(today)) {
            stats.activeToday++;
          }
        }
      }
    }
    
    // Get IP tracking data for abuse detection
    const ipKeys = await kv.keys("ip:*");
    for (const ipKey of ipKeys) {
      const ipData = await kv.get(ipKey);
      if (ipData) {
        const ip = ipData as any;
        if (ip.freeAccounts && ip.freeAccounts.length > 2) {
          stats.ipAbuseDetected.push({
            ip: ipKey.replace('ip:', ''),
            accounts: ip.freeAccounts.length,
            emails: ip.freeAccounts,
          });
        }
      }
    }
    
    // Get recent transcriptions (last 24 hours)
    const transcriptionKeys = await kv.keys("transcription:*");
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (const tKey of transcriptionKeys.slice(0, 100)) { // Limit to last 100
      const transcription = await kv.get(tKey);
      if (transcription) {
        const trans = transcription as any;
        const transDate = new Date(trans.createdAt || trans.timestamp);
        
        if (transDate > twentyFourHoursAgo) {
          stats.recentTranscriptions.push({
            id: tKey.replace('transcription:', ''),
            userId: trans.userId,
            userEmail: trans.userEmail,
            fileName: trans.fileName || 'Unknown',
            duration: trans.duration || trans.minutes,
            language: trans.language,
            status: trans.status,
            createdAt: trans.createdAt || trans.timestamp,
            cost: trans.cost || 0,
          });
        }
      }
    }
    
    // Sort users by last active
    users.sort((a, b) => {
      const dateA = new Date(a.lastActive || 0).getTime();
      const dateB = new Date(b.lastActive || 0).getTime();
      return dateB - dateA;
    });
    
    // Sort recent transcriptions by date
    stats.recentTranscriptions.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({
      stats,
      users: users.slice(0, 100), // Limit to 100 users for performance
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}