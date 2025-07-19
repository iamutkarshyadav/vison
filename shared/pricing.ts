// Unified pricing configuration used across the entire application

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  interval: "month" | "year" | "lifetime";
  credits: number | "unlimited";
  imageQuality: "Standard" | "HD" | "2K" | "4K";
  watermark: boolean;
  generationSpeed: "Standard" | "Fast" | "Priority";
  supportLevel: "Community" | "Email" | "Priority" | "Dedicated";
  popular?: boolean;
  enterprise?: boolean;
  features: string[];
  limitations?: string[];
  stripePriceId?: string; // Stripe price ID for subscriptions
  badge?: string;
  color?: string;
  gradient?: string;
}

export const UNIFIED_PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    interval: "month",
    credits: 20,
    imageQuality: "HD",
    watermark: true,
    generationSpeed: "Standard",
    supportLevel: "Community",
    features: [
      "20 credits per month",
      "HD quality images (1024x1024)",
      "Basic AI models",
      "Community access",
      "Standard generation speed",
      "Email support",
    ],
    limitations: ["Watermarked images", "Standard queue priority"],
    color: "gray",
    gradient: "from-gray-500 to-slate-600",
  },
  {
    id: "pro",
    name: "Professional",
    price: 29.99,
    originalPrice: 49.99,
    interval: "month",
    credits: 1000,
    imageQuality: "2K",
    watermark: false,
    generationSpeed: "Fast",
    supportLevel: "Priority",
    popular: true,
    badge: "Most Popular",
    features: [
      "1000 credits per month",
      "2K quality images (2048x2048)",
      "All AI models access",
      "No watermarks",
      "Priority generation queue",
      "Commercial license included",
      "Advanced editing tools",
      "Priority email support",
      "Community sharing",
    ],
    stripePriceId: "price_professional_monthly", // Replace with actual Stripe price ID
    color: "primary",
    gradient: "from-purple-600 to-blue-600",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99.99,
    interval: "month",
    credits: "unlimited",
    imageQuality: "4K",
    watermark: false,
    generationSpeed: "Priority",
    supportLevel: "Dedicated",
    enterprise: true,
    badge: "Best Value",
    features: [
      "Unlimited credits",
      "4K quality images (4096x4096)",
      "All AI models + Beta access",
      "Custom model training",
      "API access (50,000 calls/month)",
      "White-label solution available",
      "Team management tools",
      "Dedicated account manager",
      "24/7 phone support",
      "99.9% SLA guarantee",
      "Custom integrations",
    ],
    stripePriceId: "price_enterprise_monthly", // Replace with actual Stripe price ID
    color: "enterprise",
    gradient: "from-amber-500 to-orange-600",
  },
];

// Helper functions
export function getPlanById(planId: string): PricingPlan | undefined {
  return UNIFIED_PRICING_PLANS.find((plan) => plan.id === planId);
}

export function getPopularPlan(): PricingPlan | undefined {
  return UNIFIED_PRICING_PLANS.find((plan) => plan.popular);
}

export function getFreePlan(): PricingPlan {
  return UNIFIED_PRICING_PLANS.find((plan) => plan.id === "free")!;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

export function calculateSavings(
  originalPrice?: number,
  price?: number,
): number {
  if (!originalPrice || !price) return 0;
  return originalPrice - price;
}

export function calculateDiscountPercentage(
  originalPrice?: number,
  price?: number,
): number {
  if (!originalPrice || !price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

// Plan comparison utilities
export function comparePlans(planA: PricingPlan, planB: PricingPlan): number {
  // Free plan always first
  if (planA.id === "free") return -1;
  if (planB.id === "free") return 1;

  // Sort by price
  return planA.price - planB.price;
}

export function getPlanFeatures(planId: string): string[] {
  const plan = getPlanById(planId);
  return plan?.features || [];
}

export function getPlanLimitations(planId: string): string[] {
  const plan = getPlanById(planId);
  return plan?.limitations || [];
}

export function isPlanPopular(planId: string): boolean {
  const plan = getPlanById(planId);
  return plan?.popular || false;
}

export function getPlanCredits(planId: string): number | "unlimited" {
  const plan = getPlanById(planId);
  return plan?.credits || 0;
}

export function getPlanQuality(planId: string): string {
  const plan = getPlanById(planId);
  return plan?.imageQuality || "Standard";
}
