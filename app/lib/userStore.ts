import bcrypt from "bcryptjs";

// Simple in-memory user store for demo
// In production, use a proper database like PostgreSQL or MongoDB
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
}

// Initialize with a test user for easy testing
const initialUsers: User[] = [
  {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    password: bcrypt.hashSync("password123", 10), // Password: password123
    plan: "free",
    minutesUsed: 0,
    minutesLimit: 30,
    createdAt: new Date(),
  }
];

let users: User[] = initialUsers;

export function getAllUsers(): User[] {
  return users;
}

export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function createUser(userData: {
  email: string;
  name: string;
  password: string;
}): User {
  const newUser: User = {
    id: String(users.length + 1),
    email: userData.email,
    name: userData.name,
    password: userData.password, // Should already be hashed
    plan: "free",
    minutesUsed: 0,
    minutesLimit: 30,
    createdAt: new Date(),
  };
  
  users.push(newUser);
  return newUser;
}

export function updateUserPlan(userId: string, plan: User["plan"], minutesLimit: number) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.plan = plan;
    user.minutesLimit = minutesLimit;
  }
}

export function updateUserUsage(userId: string, minutesUsed: number) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.minutesUsed += minutesUsed;
  }
}

export function resetUserUsage(userId: string) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.minutesUsed = 0;
  }
}