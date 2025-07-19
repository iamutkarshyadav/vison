import { RequestHandler, Router } from "express";
import express from "express";
import Stripe from "stripe";
import { AuthRequest, authMiddleware } from "../utils/auth";
import connectToDatabase from "../database/connection";
import { User } from "../models/User";
import { Payment } from "../models/Payment";

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

// Plan configuration
const PLANS = {
  pro: {
    id: "pro",
    name: "Professional Plan",
    price: 29.99,
    credits: 1000,
    description: "1000 credits per month with 2K quality images"
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    price: 99.99,
    credits: "unlimited",
    description: "Unlimited credits with 4K quality images"
  }
};

// Create payment intent endpoint
export const createPaymentIntent: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required"
      });
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID"
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.user._id.toString(),
        planId: plan.id,
        planName: plan.name,
        credits: typeof plan.credits === "number" ? plan.credits.toString() : plan.credits,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save payment record
    const payment = new Payment({
      user: req.user._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: Math.round(plan.price * 100),
      currency: "usd",
      status: "pending",
      credits: typeof plan.credits === "number" ? plan.credits : 999999, // Use 999999 for unlimited
      planId: plan.id,
      planName: plan.name,
      metadata: {
        customerEmail: req.user.email,
        customerName: req.user.name,
      },
    });

    await payment.save();

    console.log("✅ Payment intent created:", {
      paymentIntentId: paymentIntent.id,
      planId: plan.id,
      amount: plan.price,
      userId: req.user._id
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        credits: plan.credits
      }
    });

  } catch (error) {
    console.error("❌ Payment intent creation error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create payment intent"
    });
  }
};

// Handle Stripe webhook for payment confirmation
export const handleStripeWebhook: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();

    console.log("🔔 Webhook received:", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      bodyLength: req.body?.length || 0
    });

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      console.error("❌ Missing Stripe signature");
      return res.status(400).json({
        success: false,
        message: "Missing Stripe signature"
      });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log("✅ Webhook signature verified, event type:", event.type);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature"
      });
    }

    // Handle payment intent succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("💰 Processing payment intent:", paymentIntent.id);

      // Find payment record
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id
      }).populate("user");

      if (!payment) {
        console.error("❌ Payment not found for intent:", paymentIntent.id);
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      // Check if already processed
      if (payment.status === "succeeded") {
        console.log("ℹ️ Payment already processed:", paymentIntent.id);
        return res.json({ received: true });
      }

      // Update payment status
      payment.status = "succeeded";
      payment.processedAt = new Date();
      payment.webhookReceived = true;
      await payment.save();

      // Add credits to user
      const user = payment.user as any;
      const oldCredits = user.credits;

      // Handle unlimited credits for enterprise plan
      if (payment.planId === "enterprise") {
        user.credits = 999999; // Set to very high number for unlimited
      } else {
        user.credits += payment.credits;
      }

      // Update user plan
      if (payment.planId && payment.planId !== "free") {
        user.plan = payment.planId;
      }

      await user.save();

      console.log(`✅ Payment processed: ${payment.credits} credits added to user ${user.email} (${oldCredits} → ${user.credits})`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(400).json({
      success: false,
      message: "Webhook processing failed"
    });
  }
};

// Fallback payment confirmation endpoint (called from frontend)
export const confirmPayment: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required"
      });
    }

    console.log("🔍 Confirming payment intent:", paymentIntentId);

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed"
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      user: req.user._id
    }).populate("user");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }

    // Check if already processed
    if (payment.status === "succeeded") {
      console.log("ℹ️ Payment already processed via webhook");
      return res.json({
        success: true,
        message: "Payment already processed",
        creditsAdded: payment.credits
      });
    }

    // Process the payment
    payment.status = "succeeded";
    payment.processedAt = new Date();
    payment.webhookReceived = false; // Mark as processed via fallback
    await payment.save();

    // Add credits to user
    const user = payment.user as any;
    const oldCredits = user.credits;

    // Handle unlimited credits for enterprise plan
    if (payment.planId === "enterprise") {
      user.credits = 999999; // Set to very high number for unlimited
    } else {
      user.credits += payment.credits;
    }

    // Update user plan
    if (payment.planId && payment.planId !== "free") {
      user.plan = payment.planId;
    }

    await user.save();

    console.log(`✅ Payment confirmed via fallback: ${payment.credits} credits added to user ${user.email} (${oldCredits} → ${user.credits})`);

    res.json({
      success: true,
      message: "Payment confirmed and credits added",
      creditsAdded: payment.credits,
      newBalance: user.credits
    });

  } catch (error) {
    console.error("❌ Payment confirmation error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to confirm payment"
    });
  }
};

// Get payment history
export const getPaymentHistory: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const payments = await Payment.find({
      user: req.user._id,
      status: "succeeded"
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-user -stripePaymentIntentId");

    const history = payments.map((payment) => ({
      id: payment._id,
      planName: payment.planName,
      credits: payment.credits,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      date: payment.createdAt,
      processedAt: payment.processedAt,
    }));

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error("❌ Payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history"
    });
  }
};

// Test endpoint (development only)
export const testPayment: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    message: "Payment API is working",
    plans: Object.keys(PLANS),
    stripe: !!process.env.STRIPE_SECRET_KEY
  });
};

// Debug endpoint to check user credits and payments (development only)
export const debugUserCredits: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Get user with latest data
    const user = await User.findById(req.user._id).select("-password");

    // Get recent payments
    const payments = await Payment.find({
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      user: {
        id: user?._id,
        email: user?.email,
        credits: user?.credits,
        plan: user?.plan
      },
      recentPayments: payments.map(p => ({
        id: p._id,
        status: p.status,
        amount: p.amount / 100,
        credits: p.credits,
        planName: p.planName,
        createdAt: p.createdAt,
        processedAt: p.processedAt,
        webhookReceived: p.webhookReceived
      }))
    });

  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get debug info"
    });
  }
};

// Temporary test endpoint to manually test credit updates (development only)
export const testCreditUpdate: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();

    // Find a test user
    const user = await User.findOne({ email: 'demo@test.com' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Test user not found"
      });
    }

    console.log('🧪 Testing credit update for user:', user.email);
    console.log('   Current credits:', user.credits);

    // Simulate adding credits
    const oldCredits = user.credits;
    user.credits += 1000;
    user.plan = 'pro';

    await user.save();

    console.log('✅ Credits updated:', oldCredits, '→', user.credits);

    res.json({
      success: true,
      message: "Credit update test completed",
      oldCredits,
      newCredits: user.credits,
      user: {
        email: user.email,
        credits: user.credits,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error("❌ Credit update test error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test credit update"
    });
  }
};

// Route definitions
router.post("/create-payment-intent", authMiddleware, createPaymentIntent);
router.post("/confirm", authMiddleware, confirmPayment);
router.get("/history", authMiddleware, getPaymentHistory);

// Stripe webhook endpoint (no auth middleware needed, needs raw body)
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

// Test endpoints (development only)
if (process.env.NODE_ENV === "development") {
  router.get("/test", testPayment);
  router.get("/debug", authMiddleware, debugUserCredits);
  router.get("/test-credits", testCreditUpdate);
}

export default router;
