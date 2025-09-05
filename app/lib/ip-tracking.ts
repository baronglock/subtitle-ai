import { kv, isKVAvailable } from "./kv-client";

interface IPRecord {
  ip: string;
  freeAccounts: string[]; // Array of email addresses
  lastActivity: Date;
  totalAccounts: number;
}

// In-memory storage for development
const ipRecords = new Map<string, IPRecord>();

export async function checkIPLimit(ip: string, email: string): Promise<{
  allowed: boolean;
  reason?: string;
  existingAccounts?: string[];
}> {
  try {
    let record: IPRecord | null = null;

    if (isKVAvailable && kv) {
      record = await kv.get(`ip:${ip}`) as IPRecord | null;
    } else {
      record = ipRecords.get(ip) || null;
    }

    if (!record) {
      // First account from this IP
      return { allowed: true };
    }

    // Check if email already registered from this IP
    if (record.freeAccounts.includes(email)) {
      return { allowed: true }; // Allow login for existing account
    }

    // Check limit (2 free accounts per IP)
    if (record.freeAccounts.length >= 2) {
      return {
        allowed: false,
        reason: "Maximum number of free accounts (2) reached for this IP address",
        existingAccounts: record.freeAccounts.map(e => 
          e.substring(0, 3) + "***@" + e.split("@")[1] // Partially hide emails
        ),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking IP limit:", error);
    // Allow in case of error to not block legitimate users
    return { allowed: true };
  }
}

export async function recordIPAccount(
  ip: string, 
  email: string,
  plan: string = "free"
): Promise<void> {
  // Only track free accounts
  if (plan !== "free") return;

  try {
    let record: IPRecord;

    if (isKVAvailable && kv) {
      record = await kv.get(`ip:${ip}`) as IPRecord || {
        ip,
        freeAccounts: [],
        lastActivity: new Date(),
        totalAccounts: 0,
      };
    } else {
      record = ipRecords.get(ip) || {
        ip,
        freeAccounts: [],
        lastActivity: new Date(),
        totalAccounts: 0,
      };
    }

    // Add email if not already present
    if (!record.freeAccounts.includes(email)) {
      record.freeAccounts.push(email);
      record.totalAccounts++;
    }
    record.lastActivity = new Date();

    if (isKVAvailable && kv) {
      await kv.set(`ip:${ip}`, record, { ex: 30 * 24 * 60 * 60 }); // 30 days TTL
    } else {
      ipRecords.set(ip, record);
    }
  } catch (error) {
    console.error("Error recording IP account:", error);
  }
}

export async function getIPStats(ip: string): Promise<IPRecord | null> {
  try {
    if (isKVAvailable && kv) {
      return await kv.get(`ip:${ip}`) as IPRecord | null;
    } else {
      return ipRecords.get(ip) || null;
    }
  } catch (error) {
    console.error("Error getting IP stats:", error);
    return null;
  }
}

// Helper to extract IP from request headers
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  // Priority: CF > X-Real-IP > X-Forwarded-For > default
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs
    return forwardedFor.split(",")[0].trim();
  }
  
  return "127.0.0.1"; // Fallback for local development
}

// Device fingerprinting for additional security
export async function generateDeviceFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string
): Promise<string> {
  const data = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  // Simple hash for demo - in production use proper fingerprinting library
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex.substring(0, 16); // Use first 16 chars
}