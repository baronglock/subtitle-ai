# Database Setup for Production

## Current Status
- ✅ User signup/login works
- ⚠️ Users are stored in memory (resets on server restart)
- ⚠️ Only test@example.com persists

## Quick Solution: Use Vercel KV (Redis)

### Step 1: Enable Vercel KV
1. Go to Vercel Dashboard → Your Project
2. Click "Storage" tab
3. Create a KV Store (free tier available)
4. It will add these env vars automatically:
   - `KV_URL`
   - `KV_REST_API_URL` 
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Step 2: Install Package
```bash
npm install @vercel/kv
```

### Step 3: Update userStore.ts
Replace the in-memory store with Vercel KV:

```typescript
import { kv } from '@vercel/kv';

export async function getUserByEmail(email: string) {
  return await kv.get(`user:${email}`);
}

export async function createUser(userData: {...}) {
  const user = {...};
  await kv.set(`user:${userData.email}`, user);
  return user;
}
```

## Alternative: PostgreSQL with Vercel Postgres

### Step 1: Enable Vercel Postgres
1. Go to Vercel Dashboard → Storage
2. Create a Postgres database
3. Copy the connection string

### Step 2: Install Packages
```bash
npm install @vercel/postgres
npm install prisma --save-dev
```

### Step 3: Create Schema
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  plan      String   @default("free")
  minutesUsed Int    @default(0)
  createdAt DateTime @default(now())
}
```

### Step 4: Deploy
```bash
npx prisma generate
npx prisma db push
```

## Testing Multiple Users

### On Vercel:
1. Go to https://your-app.vercel.app/signup
2. Create a new account with any email
3. Login with those credentials
4. Each user gets:
   - 30 minutes free trial
   - Separate usage tracking
   - Own dashboard

### Features Already Working:
- ✅ User registration
- ✅ Email/password authentication
- ✅ Google/GitHub OAuth (need to add API keys)
- ✅ Usage tracking per user
- ✅ Rate limiting per IP
- ✅ Plan restrictions (free/paid)

### To Enable OAuth:
Add these to Vercel Environment Variables:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`

## Current User Features

Each user account has:
- **Free Plan**: 30 minutes/month
- **Usage Tracking**: Minutes used/remaining
- **Security**: IP tracking, rate limiting
- **Unique Sessions**: Separate login sessions

## Testing Checklist

1. ✅ Create account at /signup
2. ✅ Login at /login
3. ✅ Upload file at /transcribe
4. ✅ Check usage in /dashboard
5. ✅ Logout and try another account

## Important Notes

- Without a database, users reset when server restarts
- Vercel KV is easiest for quick setup (5 min)
- PostgreSQL is better for long-term (more features)
- All auth/security features work now, just need persistent storage