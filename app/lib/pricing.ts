export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  minutes: number;
  priceMonthly: {
    brl: number;
    usd: number;
  };
  priceYearly: {
    brl: number;
    usd: number;
  };
  pricePerHour: {
    brl: number;
    usd: number;
  };
  features: string[];
  translationQuality: string;
  accuracy: string;
  speed: string;
  popular?: boolean;
}

export interface CreditPackage {
  id: string;
  minutes: number;
  price: {
    brl: number;
    usd: number;
  };
  pricePerMinute: {
    brl: number;
    usd: number;
  };
}

// Pricing configuration as specified
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    description: "Test our service with 30 minutes free",
    minutes: 30,
    priceMonthly: { brl: 0, usd: 0 },
    priceYearly: { brl: 0, usd: 0 },
    pricePerHour: { brl: 0, usd: 0 },
    features: [
      "30 minutes per month",
      "Standard translation quality",
      "~90% accuracy",
      "Standard processing speed",
      "SRT export",
      "15+ languages",
      "Email support"
    ],
    translationQuality: "Standard (Google Translate)",
    accuracy: "90%",
    speed: "Standard",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for content creators",
    minutes: 300, // 5 hours
    priceMonthly: { brl: 75, usd: 15 }, // R$15/hour for 5 hours
    priceYearly: { brl: 810, usd: 162 }, // 10% discount
    pricePerHour: { brl: 15, usd: 3 },
    features: [
      "5 hours (300 minutes) per month",
      "Premium AI translation",
      "~97% accuracy",
      "Fast AI processing",
      "All export formats",
      "100+ languages",
      "Priority support",
      "API access"
    ],
    translationQuality: "Premium AI (Gemini 1.5)",
    accuracy: "97%",
    speed: "Fast",
    popular: true
  },
  {
    id: "pro",
    name: "Professional",
    description: "For professionals and teams",
    minutes: 600, // 10 hours
    priceMonthly: { brl: 139.90, usd: 27.98 }, // R$13.99/hour for 10 hours
    priceYearly: { brl: 1511, usd: 302 }, // 10% discount
    pricePerHour: { brl: 13.99, usd: 2.80 },
    features: [
      "10 hours (600 minutes) per month",
      "Advanced AI translation with context",
      "~99% accuracy",
      "Priority GPU processing",
      "All export formats",
      "100+ languages",
      "24/7 priority support",
      "API access",
      "Bulk uploads",
      "Custom glossary"
    ],
    translationQuality: "Advanced AI (Gemini 1.5 Pro)",
    accuracy: "99%",
    speed: "Priority",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for organizations",
    minutes: Infinity,
    priceMonthly: { brl: 499, usd: 99 },
    priceYearly: { brl: 5389, usd: 1069 }, // 10% discount
    pricePerHour: { brl: 0, usd: 0 }, // Unlimited
    features: [
      "Unlimited minutes",
      "Enterprise AI with custom training",
      "~99.9% accuracy",
      "Instant GPU processing",
      "All export formats",
      "100+ languages",
      "Dedicated support",
      "API access",
      "Bulk uploads",
      "Custom AI models",
      "Human revision option",
      "SLA guarantee"
    ],
    translationQuality: "Enterprise AI (Gemini Ultra)",
    accuracy: "99.9%",
    speed: "Instant",
  }
];

// Credit packages for on-demand purchases
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "credit_60",
    minutes: 60,
    price: { brl: 17.99, usd: 3.59 },
    pricePerMinute: { brl: 0.30, usd: 0.06 }
  },
  {
    id: "credit_180",
    minutes: 180,
    price: { brl: 49.99, usd: 9.99 },
    pricePerMinute: { brl: 0.28, usd: 0.055 }
  },
  {
    id: "credit_360",
    minutes: 360,
    price: { brl: 89.99, usd: 17.99 },
    pricePerMinute: { brl: 0.25, usd: 0.05 }
  }
];

// Human revision service pricing
export const HUMAN_REVISION_PRICING = {
  pricePerMinute: {
    brl: 2.50,
    usd: 0.50
  },
  deliveryTime: "24 hours",
  minimumMinutes: 10,
  languages: [
    "Portuguese", "English", "Spanish", "French", 
    "German", "Italian", "Japanese", "Chinese"
  ]
};

// Get plan by ID
export function getPlanById(planId: string): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.id === planId);
}

// Calculate price based on currency and billing period
export function calculatePrice(
  plan: PricingPlan,
  currency: "brl" | "usd",
  billingPeriod: "monthly" | "yearly"
): number {
  if (billingPeriod === "yearly") {
    return plan.priceYearly[currency];
  }
  return plan.priceMonthly[currency];
}

// Format price with currency
export function formatPrice(amount: number, currency: "brl" | "usd"): string {
  const formatter = new Intl.NumberFormat(
    currency === "brl" ? "pt-BR" : "en-US",
    {
      style: "currency",
      currency: currency === "brl" ? "BRL" : "USD"
    }
  );
  return formatter.format(amount);
}

// Calculate human revision cost
export function calculateRevisionCost(
  minutes: number,
  currency: "brl" | "usd"
): number {
  const minMinutes = Math.max(minutes, HUMAN_REVISION_PRICING.minimumMinutes);
  return minMinutes * HUMAN_REVISION_PRICING.pricePerMinute[currency];
}