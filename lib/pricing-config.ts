export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  priceBRL: number;
  period: string;
  minutes: number;
  features: {
    text: string;
    included: boolean;
  }[];
  processingSpeed: number; // multiplier: 1x, 2x, 5x
  accuracy: string;
  technology: string;
  buttonText: string;
  popular?: boolean;
  isEnterprise?: boolean;
}

export interface CreditPackage {
  id: string;
  minutes: number;
  priceUSD: number;
  priceBRL: number;
  savings?: string;
}

// Main pricing plans
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying our service",
    priceUSD: 0,
    priceBRL: 0,
    period: "forever",
    minutes: 120, // 2 hours per month
    features: [
      { text: "2 hours per month (120 min)", included: true },
      { text: "Standard processing speed", included: true },
      { text: "Basic transcription quality", included: true },
      { text: "SRT & TXT export", included: true },
      { text: "10 languages", included: true },
      { text: "Google Translate", included: true },
      { text: "Email support", included: true },
      { text: "Priority processing", included: false },
      { text: "Speaker detection", included: false },
      { text: "API access", included: false },
    ],
    processingSpeed: 1, // 1x speed (half of content duration)
    accuracy: "~85% accuracy",
    technology: "Gemini Flash (Basic)",
    buttonText: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For content creators and professionals",
    priceUSD: 49,
    priceBRL: 249,
    period: "per month",
    minutes: 600, // 10 hours per month
    features: [
      { text: "10 hours per month (600 min)", included: true },
      { text: "2x faster processing", included: true },
      { text: "Premium transcription quality", included: true },
      { text: "All export formats", included: true },
      { text: "50+ languages", included: true },
      { text: "DeepL translation", included: true },
      { text: "Priority support", included: true },
      { text: "Speaker detection", included: true },
      { text: "Batch processing", included: true },
      { text: "API access", included: false },
    ],
    processingSpeed: 2, // 2x speed (quarter of content duration)
    accuracy: "~92% accuracy",
    technology: "Gemini Pro (Advanced)",
    buttonText: "Subscribe Now",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "For teams and heavy users",
    priceUSD: 149,
    priceBRL: 749,
    period: "per month",
    minutes: 1800, // 30 hours per month
    features: [
      { text: "30 hours per month (1800 min)", included: true },
      { text: "5x ultra-fast processing", included: true },
      { text: "Ultra-premium transcription", included: true },
      { text: "All export formats + API", included: true },
      { text: "100+ languages", included: true },
      { text: "Neural AI translation", included: true },
      { text: "24/7 priority support", included: true },
      { text: "Advanced speaker diarization", included: true },
      { text: "Batch processing", included: true },
      { text: "Full API access", included: true },
    ],
    processingSpeed: 5, // 5x speed (10% of content duration)
    accuracy: "~98% accuracy",
    technology: "Gemini Ultra (Enterprise)",
    buttonText: "Subscribe Now",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    priceUSD: 0, // Custom pricing
    priceBRL: 0,
    period: "custom",
    minutes: -1, // Unlimited
    features: [
      { text: "Unlimited transcription", included: true },
      { text: "10x lightning processing", included: true },
      { text: "99.9% accuracy guarantee", included: true },
      { text: "Custom integrations", included: true },
      { text: "All languages + dialects", included: true },
      { text: "Human review option", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom AI training", included: true },
      { text: "SLA guarantee", included: true },
      { text: "On-premise deployment", included: true },
    ],
    processingSpeed: 10,
    accuracy: "~99.9% accuracy",
    technology: "Custom AI Solution",
    buttonText: "Contact Sales",
    isEnterprise: true,
  },
];

// Credit packages for pay-as-you-go
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "credit-60",
    minutes: 60,
    priceUSD: 9.99,
    priceBRL: 49.90,
  },
  {
    id: "credit-180",
    minutes: 180,
    priceUSD: 24.99,
    priceBRL: 124.90,
    savings: "Save 15%",
  },
  {
    id: "credit-360",
    minutes: 360,
    priceUSD: 44.99,
    priceBRL: 224.90,
    savings: "Save 25%",
  },
  {
    id: "credit-720",
    minutes: 720,
    priceUSD: 79.99,
    priceBRL: 399.90,
    savings: "Save 35%",
  },
];

// Processing speeds by plan (in seconds per minute of content)
export const PROCESSING_SPEEDS = {
  free: 30, // 30 seconds to process 1 minute of content (2x real-time)
  pro: 15, // 15 seconds to process 1 minute of content (4x real-time)
  premium: 6, // 6 seconds to process 1 minute of content (10x real-time)
  enterprise: 3, // 3 seconds to process 1 minute of content (20x real-time)
};

// Gemini model configuration by plan
export const GEMINI_MODELS = {
  free: {
    model: "gemini-1.5-flash",
    temperature: 0.3,
    maxTokens: 8192,
  },
  pro: {
    model: "gemini-1.5-pro",
    temperature: 0.2,
    maxTokens: 32768,
  },
  premium: {
    model: "gemini-1.5-pro",
    temperature: 0.1,
    maxTokens: 65536,
    useAdvancedFeatures: true,
  },
  enterprise: {
    model: "gemini-1.5-pro", // or custom fine-tuned model
    temperature: 0.05,
    maxTokens: 131072,
    useAdvancedFeatures: true,
    customPrompts: true,
  },
};

// Translation services by plan
export const TRANSLATION_SERVICES = {
  free: "google-translate", // Google Translate API
  pro: "deepl", // DeepL API
  premium: "deepl-pro", // DeepL Pro with glossaries
  enterprise: "custom", // Custom translation with human review
};