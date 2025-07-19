import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with your actual publishable key
const stripePromise = loadStripe(
  "pk_test_51RhyV6Gg4LPyrkQqy7ha14kBNK6ZmyWUlUIKYwNiGD1VHjpNF9vQiDnrUO4qWsIdg66Tvu2xWqEzYJpuE5Jinadc00UPGknb8y",
);

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  description: string;
  popular?: boolean;
}

export const creditPackages: CreditPackage[] = [
  {
    id: "credits_10",
    name: "Starter Pack",
    credits: 10,
    price: 5.99,
    description: "Perfect for trying out VisionAI",
  },
  {
    id: "credits_50",
    name: "Creator Pack",
    credits: 50,
    price: 24.99,
    originalPrice: 29.95,
    description: "Great for regular creators",
    popular: true,
  },
  {
    id: "credits_100",
    name: "Pro Pack",
    credits: 100,
    price: 44.99,
    originalPrice: 59.95,
    description: "Best value for professionals",
  },
  {
    id: "credits_500",
    name: "Enterprise Pack",
    credits: 500,
    price: 199.99,
    originalPrice: 299.95,
    description: "For teams and agencies",
  },
];

class StripeService {
  async createPaymentSession(packageId: string, token: string) {
    try {
      const response = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(
          errorData.message ||
            `Failed to create payment session (${response.status})`,
        );
      }

      const session = await response.json();
      if (!session.success) {
        throw new Error(session.message || "Payment session creation failed");
      }

      return session;
    } catch (error) {
      console.error("Payment session creation error:", error);
      throw error;
    }
  }

  async redirectToCheckout(sessionId: string) {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Stripe failed to initialize");
    }

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw error;
    }
  }

  async purchaseCredits(packageId: string, token: string) {
    try {
      // Create payment session and redirect to Stripe Checkout
      const session = await this.createPaymentSession(packageId, token);

      if (session.url) {
        // Direct redirect to Stripe Checkout
        window.location.href = session.url;
        return {
          success: true,
          sessionId: session.sessionId,
          url: session.url,
        };
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      throw error instanceof Error
        ? error
        : new Error("Payment failed. Please try again.");
    }
  }

  // Handle successful payment callback
  async handlePaymentSuccess(
    sessionId: string,
    userId: string,
    packageId: string,
  ) {
    try {
      const response = await fetch("/api/payments/success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userId,
          packageId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process payment success");
      }

      return await response.json();
    } catch (error) {
      console.error("Payment success handling error:", error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(userId: string) {
    try {
      const response = await fetch(`/api/payments/history/${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }

      return await response.json();
    } catch (error) {
      console.error("Payment history error:", error);
      return [];
    }
  }
}

export const stripeService = new StripeService();
