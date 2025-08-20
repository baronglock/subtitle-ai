import { headers } from "next/headers";
import crypto from "crypto";

// IP tracking and rate limiting
export async function getClientIP(): Promise<string> {
  const headersList = headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIP = headersList.get("x-real-ip");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

// Track user attempts by IP
const attemptsByIP = new Map<string, { count: number; firstAttempt: Date; blocked: boolean }>();

export async function checkRateLimit(ip: string, action: string): Promise<boolean> {
  const key = `${ip}:${action}`;
  const now = new Date();
  const attempt = attemptsByIP.get(key);
  
  if (!attempt) {
    attemptsByIP.set(key, { count: 1, firstAttempt: now, blocked: false });
    return true;
  }
  
  // Reset after 1 hour
  const hoursSinceFirst = (now.getTime() - attempt.firstAttempt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceFirst > 1) {
    attemptsByIP.set(key, { count: 1, firstAttempt: now, blocked: false });
    return true;
  }
  
  // Block if more than 10 attempts per hour for free users
  if (attempt.count >= 10) {
    attempt.blocked = true;
    return false;
  }
  
  attempt.count++;
  return true;
}

// Hash IP for privacy
export function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip + process.env.NEXTAUTH_SECRET).digest("hex");
}

// Check for suspicious patterns
export function detectSuspiciousActivity(
  email: string,
  ip: string,
  userAgent?: string
): { suspicious: boolean; reason?: string } {
  // Check for disposable email domains
  const disposableEmailDomains = [
    "tempmail.com", "guerrillamail.com", "mailinator.com", 
    "10minutemail.com", "throwaway.email", "yopmail.com"
  ];
  
  const emailDomain = email.split("@")[1]?.toLowerCase();
  if (disposableEmailDomains.some(domain => emailDomain?.includes(domain))) {
    return { suspicious: true, reason: "Disposable email detected" };
  }
  
  // Check for VPN/Proxy (basic check - can be enhanced)
  const vpnIndicators = ["vpn", "proxy", "tor", "relay"];
  if (userAgent && vpnIndicators.some(indicator => userAgent.toLowerCase().includes(indicator))) {
    return { suspicious: true, reason: "VPN/Proxy detected" };
  }
  
  // Check for rapid signups from same IP
  const ipAttempts = attemptsByIP.get(`${ip}:signup`);
  if (ipAttempts && ipAttempts.count > 3) {
    return { suspicious: true, reason: "Multiple signups from same IP" };
  }
  
  return { suspicious: false };
}

// Track usage by user
interface UserUsage {
  userId: string;
  minutesUsed: number;
  lastReset: Date;
  plan: "free" | "starter" | "pro" | "enterprise";
}

const userUsageMap = new Map<string, UserUsage>();

export function getUserUsage(userId: string): UserUsage {
  const usage = userUsageMap.get(userId);
  if (!usage) {
    const newUsage: UserUsage = {
      userId,
      minutesUsed: 0,
      lastReset: new Date(),
      plan: "free"
    };
    userUsageMap.set(userId, newUsage);
    return newUsage;
  }
  
  // Reset monthly usage
  const now = new Date();
  const daysSinceReset = (now.getTime() - usage.lastReset.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReset >= 30) {
    usage.minutesUsed = 0;
    usage.lastReset = now;
  }
  
  return usage;
}

export function canUseService(userId: string, requestedMinutes: number): boolean {
  const usage = getUserUsage(userId);
  
  const limits = {
    free: 30,
    starter: 300, // 5 hours
    pro: 600, // 10 hours
    enterprise: Infinity
  };
  
  const limit = limits[usage.plan];
  return usage.minutesUsed + requestedMinutes <= limit;
}

export function updateUsage(userId: string, minutes: number): void {
  const usage = getUserUsage(userId);
  usage.minutesUsed += minutes;
  userUsageMap.set(userId, usage);
}