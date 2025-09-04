import { createClient } from "@vercel/kv";

// Create KV client with Upstash environment variables
// Using STORAGE_USERS_KV_ prefix as configured in Vercel
const kvUrl = process.env.STORAGE_USERS_KV_REST_API_URL || process.env.KV_REST_API_URL;
const kvToken = process.env.STORAGE_USERS_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;

// Only create client if we have valid URLs (not placeholder values)
const hasValidUrl = kvUrl && kvUrl.startsWith('https://') && kvToken && kvToken !== 'your-upstash-rest-api-token';

export const kv = hasValidUrl
  ? createClient({
      url: kvUrl,
      token: kvToken,
    })
  : null;

// Export a flag to check if KV is available
export const isKVAvailable = !!kv;