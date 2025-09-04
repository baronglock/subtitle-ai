import { kv } from './kv-client';

export interface UsageData {
  minutesUsed: number;
  lastReset: string;
  transcriptionCount: number;
  ipAddresses: string[];
}

const FREE_MONTHLY_MINUTES = 120; // 2 hours
const PRO_MONTHLY_MINUTES = 600; // 10 hours
const PREMIUM_MONTHLY_MINUTES = 1800; // 30 hours

export async function trackUsage(
  userEmail: string,
  durationInSeconds: number,
  ipAddress: string,
  userPlan: string = 'free'
): Promise<{ success: boolean; minutesUsed: number; minutesRemaining: number }> {
  if (!kv) {
    console.warn('KV storage not available, skipping usage tracking');
    return { success: true, minutesUsed: 0, minutesRemaining: 120 };
  }

  const key = `usage:${userEmail}`;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  
  // Get current usage
  let usage = await kv.get<UsageData>(key);
  
  // Reset if new month
  if (!usage || usage.lastReset !== currentMonth) {
    usage = {
      minutesUsed: 0,
      lastReset: currentMonth,
      transcriptionCount: 0,
      ipAddresses: []
    };
  }
  
  // Add new usage
  const minutesToAdd = durationInSeconds / 60;
  usage.minutesUsed += minutesToAdd;
  usage.transcriptionCount += 1;
  
  // Track IP addresses (for abuse detection)
  if (!usage.ipAddresses.includes(ipAddress)) {
    usage.ipAddresses.push(ipAddress);
  }
  
  // Check limits
  const limits = {
    free: FREE_MONTHLY_MINUTES,
    pro: PRO_MONTHLY_MINUTES,
    premium: PREMIUM_MONTHLY_MINUTES
  };
  
  const limit = limits[userPlan as keyof typeof limits] || FREE_MONTHLY_MINUTES;
  
  if (usage.minutesUsed > limit) {
    return { 
      success: false, 
      minutesUsed: usage.minutesUsed,
      minutesRemaining: 0
    };
  }
  
  // Save updated usage
  await kv.set(key, usage, { ex: 60 * 60 * 24 * 31 }); // Expire after 31 days
  
  return { 
    success: true, 
    minutesUsed: usage.minutesUsed,
    minutesRemaining: limit - usage.minutesUsed
  };
}

export async function getUsageStats(userEmail: string, userPlan: string = 'free'): Promise<{
  minutesUsed: number;
  minutesRemaining: number;
  transcriptionCount: number;
  percentageUsed: number;
  lastReset: string;
}> {
  if (!kv) {
    return {
      minutesUsed: 0,
      minutesRemaining: 120,
      transcriptionCount: 0,
      percentageUsed: 0,
      lastReset: new Date().toISOString().slice(0, 7)
    };
  }

  const key = `usage:${userEmail}`;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  
  let usage = await kv.get<UsageData>(key);
  
  // Reset if new month or no data
  if (!usage || usage.lastReset !== currentMonth) {
    usage = {
      minutesUsed: 0,
      lastReset: currentMonth,
      transcriptionCount: 0,
      ipAddresses: []
    };
  }
  
  const limits = {
    free: FREE_MONTHLY_MINUTES,
    pro: PRO_MONTHLY_MINUTES,
    premium: PREMIUM_MONTHLY_MINUTES
  };
  
  const limit = limits[userPlan as keyof typeof limits] || FREE_MONTHLY_MINUTES;
  
  return {
    minutesUsed: usage.minutesUsed,
    minutesRemaining: Math.max(0, limit - usage.minutesUsed),
    transcriptionCount: usage.transcriptionCount,
    percentageUsed: (usage.minutesUsed / limit) * 100,
    lastReset: usage.lastReset
  };
}

// Check for IP abuse (multiple accounts from same IP)
export async function checkIPAbuse(ipAddress: string): Promise<boolean> {
  if (!kv) {
    return false; // Can't check without KV
  }
  
  const key = `ip-usage:${ipAddress}`;
  const accounts = await kv.get<string[]>(key) || [];
  
  // If more than 3 accounts from same IP, consider it abuse
  return accounts.length > 3;
}

export async function registerIPForUser(ipAddress: string, userEmail: string): Promise<void> {
  if (!kv) {
    return;
  }
  
  const key = `ip-usage:${ipAddress}`;
  const accounts = await kv.get<string[]>(key) || [];
  
  if (!accounts.includes(userEmail)) {
    accounts.push(userEmail);
    await kv.set(key, accounts, { ex: 60 * 60 * 24 * 30 }); // Expire after 30 days
  }
}