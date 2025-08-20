# Vercel Setup Guide - Environment Variables

## 1. Enable Persistent User Storage (Vercel KV)

### Step 1: Create KV Database
1. Go to your Vercel Dashboard
2. Select your project (subtitle-ai)
3. Click on the "Storage" tab
4. Click "Create Database" → Choose "KV"
5. Name it (e.g., "subtitle-ai-users")
6. Click "Create"

Vercel will automatically add these environment variables:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## 2. Enable Google Login

### Step 1: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if needed
6. Application type: "Web application"
7. Add authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local testing)

### Step 2: Add to Vercel
Add these environment variables:
- `GOOGLE_CLIENT_ID`: Your OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your OAuth client secret

## 3. Enable GitHub Login

### Step 1: Create GitHub OAuth App
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: "SubtitleAI"
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Click "Register application"
5. Copy Client ID and generate Client Secret

### Step 2: Add to Vercel
Add these environment variables:
- `GITHUB_ID`: Your OAuth App Client ID
- `GITHUB_SECRET`: Your OAuth App Client Secret

## 4. NextAuth Configuration

Add this required environment variable:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your production URL (e.g., `https://subtitle-ai.vercel.app`)

## 5. RunPod Configuration

Already configured:
- `RUNPOD_API_KEY`: Your RunPod API key
- `RUNPOD_ENDPOINT_ID`: Your endpoint ID (tvw42lbaz1cf0e)

## 6. R2 Storage Configuration

Already configured:
- `R2_ACCOUNT_ID`: Your Cloudflare account ID
- `R2_ACCESS_KEY_ID`: Your R2 access key
- `R2_SECRET_ACCESS_KEY`: Your R2 secret key
- `R2_BUCKET_NAME`: Your bucket name
- `R2_PUBLIC_URL`: Your R2 public URL

## 7. Stripe Configuration (Optional - for payments)

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your webhook endpoint secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your publishable key

## 8. OpenAI Configuration (Optional - for GPT-5-mini translations)

- `OPENAI_API_KEY`: Your OpenAI API key

## How to Add Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add each variable with its value
5. Select which environments (Production, Preview, Development)
6. Click "Save"

## Testing

After adding all variables:
1. Redeploy your application (Vercel does this automatically)
2. Test signup with email/password
3. Test Google login
4. Test GitHub login
5. Verify users persist after signup

## Troubleshooting

### Users not persisting?
- Check if KV environment variables are set
- Check Vercel logs for KV connection errors

### OAuth login not working?
- Verify callback URLs match exactly
- Check if client ID and secret are correct
- Ensure NEXTAUTH_SECRET is set

### Getting "undefined" errors?
- Make sure all environment variables are added
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)