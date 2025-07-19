import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Don't throw on module load, handle gracefully
let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-06-30.basil",
      typescript: true,
    });
    console.log(
      "✅ Stripe configured with key:",
      STRIPE_SECRET_KEY.substring(0, 12) + "...",
    );
  } catch (error) {
    console.error("❌ Stripe initialization failed:", error);
  }
} else {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing. Payment features will be disabled.");
}

// Helper function to get the correct client URL
function getClientUrl(): string {
  // In production, try to get from environment
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL;
  }

  // Fallback for development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }

  // Last resort fallback - use environment variable or default
  return process.env.FALLBACK_CLIENT_URL || "http://localhost:8080";
}

export const pricingPlans = [
  {
    id: "pro",
    name: "Pro",
    credits: 500,
    price: 19.99,
    originalPrice: 29.99,
    description: "Great for regular creators - 2K quality, no watermarks",
    popular: true,
    interval: "month",
    features: [
      "500 credits/month",
      "2K quality",
      "No watermarks",
      "Fast generation",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    credits: 1500,
    price: 39.99,
    originalPrice: 59.99,
    description: "Best value for professionals - 4K quality",
    interval: "month",
    features: [
      "1500 credits/month",
      "4K quality",
      "Priority generation",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: -1, // Unlimited
    price: 99.99,
    description: "For teams and agencies - Unlimited usage",
    interval: "month",
    features: [
      "Unlimited credits",
      "4K quality",
      "White-label",
      "Dedicated support",
    ],
  },
];

export const createCheckoutSession = async (
  userId: string,
  planId: string,
  userEmail: string,
): Promise<Stripe.Checkout.Session> => {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const plan = pricingPlans.find((p) => p.id === planId);

  if (!plan) {
    throw new Error("Invalid plan ID");
  }

  try {
    console.log("Creating Stripe session for:", {
      planId,
      userEmail,
      amount: plan.price,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `VisionAI ${plan.name} Credits`,
              description: `${plan.credits === -1 ? "Unlimited" : plan.credits} credits - ${plan.description}`,
              images: [
                "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200",
              ],
            },
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            // Remove recurring for one-time payment
          },
          quantity: 1,
        },
      ],
      mode: "payment", // Changed from subscription to payment
      customer_email: userEmail,
      success_url: `${getClientUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getClientUrl()}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId,
        planId,
        credits: plan.credits.toString(),
        planName: plan.name,
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    });

    console.log("✅ Stripe session created successfully:", session.id);
    return session;
  } catch (error) {
    console.error("❌ Stripe session creation failed:", error);
    if (error instanceof Error) {
      throw new Error(`Stripe error: ${error.message}`);
    }
    throw error;
  }
};

export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
): Stripe.Event => {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_WEBHOOK_SECRET,
  );
};

export const retrieveSession = async (
  sessionId: string,
): Promise<Stripe.Checkout.Session> => {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
};

export const createRefund = async (
  paymentIntentId: string,
  amount?: number,
): Promise<Stripe.Refund> => {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // If not provided, refunds the full amount
  });
};

// Create payment intent for custom checkout
export const createPaymentIntent = async (
  amount: number,
  currency: string = "usd",
  metadata: any = {},
) => {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("✅ Payment intent created:", paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error("❌ Payment intent creation failed:", error);
    throw error;
  }
};

// Handle payment intent webhook
export const handlePaymentIntentSucceeded = async (paymentIntent: any) => {
  try {
    console.log("💳 Payment intent succeeded:", paymentIntent.id);

    // Import here to avoid circular dependencies
    const { Payment } = require("../models/Payment");
    const { User } = require("../models/User");

    // Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    }).populate("user");

    if (!payment) {
      console.error("❌ Payment not found for intent:", paymentIntent.id);
      return;
    }

    // Update payment status
    payment.status = "succeeded";
    payment.processedAt = new Date();
    payment.webhookReceived = true;
    await payment.save();

    // Add credits to user
    const user = payment.user;
    user.credits += payment.credits;
    user.stats.creditsUsed += payment.credits;

    // Update user plan if it's a subscription
    if (payment.packageId && payment.packageId !== "free") {
      user.plan = payment.packageId;
    }

    await user.save();

    console.log(
      `✅ Payment processed: ${payment.credits} credits added to user ${user.email}`,
    );
  } catch (error) {
    console.error("❌ Payment intent processing failed:", error);
    // Don't re-throw to prevent webhook failure
  }
};

export default stripe;
