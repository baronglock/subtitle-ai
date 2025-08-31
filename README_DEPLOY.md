# Deployment Instructions for Subtitle AI with Gemini

## Environment Variables Required

You need to add these environment variables in Vercel:

### Required for Core Functionality:
```
GEMINI_API_KEY=your-gemini-api-key-here  # MOST IMPORTANT - Get from Google AI Studio
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### For Storage (R2):
```
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
```

### For User Storage (Upstash KV):
```
KV_REST_API_URL=your-upstash-rest-api-url
KV_REST_API_TOKEN=your-upstash-rest-api-token
```

### For OAuth (Optional):
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### For Payments (Stripe):
```
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and add it as `GEMINI_API_KEY` in Vercel

## Deployment Steps

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables above
4. Deploy!

## Features

- **Transcription**: Powered by Gemini 1.5 Flash (fast and accurate)
- **Translation**: 
  - Free Plan: Google Translate (90% accuracy)
  - Paid Plans: Gemini AI with context awareness (99% accuracy)
- **No external servers needed**: Everything runs on Vercel + Gemini API