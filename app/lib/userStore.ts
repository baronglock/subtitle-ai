import bcrypt from "bcryptjs";
import { kv, isKVAvailable } from "./kv-client";

// User interface
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  minutesUsed: number;
  minutesLimit: number;
  createdAt: Date;
  stripeCustomerId?: string;
  provider?: string; // For OAuth (google, github)
}

// For local development without KV, use in-memory storage
let inMemoryUsers: User[] = [];
// Use the KV client availability flag
const USE_KV = isKVAvailable;

// Initialize with a test user for development
async function initializeTestUser() {
  const testUser: User = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    password: await bcrypt.hash("password123", 10),
    plan: "free",
    minutesUsed: 0,
    minutesLimit: 30,
    createdAt: new Date(),
  };
  
  if (USE_KV && kv) {
    try {
      const existing = await kv.get(`user:test@example.com`);
      if (!existing) {
        await kv.set(`user:test@example.com`, testUser);
        await kv.sadd("users:all", "test@example.com");
      }
    } catch (error) {
      console.error("KV initialization error:", error);
    }
  } else {
    const existing = inMemoryUsers.find(u => u.email === "test@example.com");
    if (!existing) {
      inMemoryUsers.push(testUser);
    }
  }
}

// Initialize on module load
initializeTestUser();

export async function getAllUsers(): Promise<User[]> {
  if (USE_KV && kv) {
    try {
      const emails = await kv.smembers("users:all");
      const users: User[] = [];
      for (const email of emails) {
        const user = await kv.get(`user:${email}`);
        if (user) users.push(user as User);
      }
      return users;
    } catch (error) {
      console.error("KV error in getAllUsers:", error);
      return [];
    }
  }
  return inMemoryUsers;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (USE_KV && kv) {
    try {
      const user = await kv.get(`user:${email}`);
      return user as User | undefined;
    } catch (error) {
      console.error("KV error in getUserByEmail:", error);
      return undefined;
    }
  }
  return inMemoryUsers.find(u => u.email === email);
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (USE_KV && kv) {
    try {
      // Get all users and find by ID (since we key by email)
      const emails = await kv.smembers("users:all");
      for (const email of emails) {
        const user = await kv.get(`user:${email}`) as User;
        if (user && user.id === id) {
          return user;
        }
      }
      return undefined;
    } catch (error) {
      console.error("KV error in getUserById:", error);
      return undefined;
    }
  }
  return inMemoryUsers.find(u => u.id === id);
}

export async function createUser(userData: {
  email: string;
  name: string;
  password: string;
  provider?: string;
}): Promise<User> {
  const newUser: User = {
    id: Date.now().toString(),
    email: userData.email,
    name: userData.name,
    password: userData.password, // Should already be hashed
    plan: "free",
    minutesUsed: 0,
    minutesLimit: 30,
    createdAt: new Date(),
    provider: userData.provider,
  };
  
  if (USE_KV && kv) {
    try {
      await kv.set(`user:${userData.email}`, newUser);
      await kv.sadd("users:all", userData.email);
    } catch (error) {
      console.error("KV error in createUser:", error);
      // Fallback to in-memory
      inMemoryUsers.push(newUser);
    }
  } else {
    inMemoryUsers.push(newUser);
  }
  
  return newUser;
}

export async function updateUserPlan(userId: string, plan: User["plan"], minutesLimit: number): Promise<void> {
  if (USE_KV && kv) {
    try {
      const emails = await kv.smembers("users:all");
      for (const email of emails) {
        const user = await kv.get(`user:${email}`) as User;
        if (user && user.id === userId) {
          user.plan = plan;
          user.minutesLimit = minutesLimit;
          await kv.set(`user:${email}`, user);
          break;
        }
      }
    } catch (error) {
      console.error("KV error in updateUserPlan:", error);
    }
  } else {
    const user = inMemoryUsers.find(u => u.id === userId);
    if (user) {
      user.plan = plan;
      user.minutesLimit = minutesLimit;
    }
  }
}

export async function updateUserUsage(userId: string, minutesUsed: number): Promise<void> {
  if (USE_KV && kv) {
    try {
      const emails = await kv.smembers("users:all");
      for (const email of emails) {
        const user = await kv.get(`user:${email}`) as User;
        if (user && user.id === userId) {
          user.minutesUsed += minutesUsed;
          await kv.set(`user:${email}`, user);
          break;
        }
      }
    } catch (error) {
      console.error("KV error in updateUserUsage:", error);
    }
  } else {
    const user = inMemoryUsers.find(u => u.id === userId);
    if (user) {
      user.minutesUsed += minutesUsed;
    }
  }
}

export async function resetUserUsage(userId: string): Promise<void> {
  if (USE_KV && kv) {
    try {
      const emails = await kv.smembers("users:all");
      for (const email of emails) {
        const user = await kv.get(`user:${email}`) as User;
        if (user && user.id === userId) {
          user.minutesUsed = 0;
          await kv.set(`user:${email}`, user);
          break;
        }
      }
    } catch (error) {
      console.error("KV error in resetUserUsage:", error);
    }
  } else {
    const user = inMemoryUsers.find(u => u.id === userId);
    if (user) {
      user.minutesUsed = 0;
    }
  }
}

// OAuth user creation/update
export async function findOrCreateOAuthUser(profile: {
  email: string;
  name: string;
  provider: string;
}): Promise<User> {
  let user = await getUserByEmail(profile.email);
  
  if (!user) {
    // Create new OAuth user (no password needed)
    user = await createUser({
      email: profile.email,
      name: profile.name,
      password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
      provider: profile.provider,
    });
  }
  
  return user;
}