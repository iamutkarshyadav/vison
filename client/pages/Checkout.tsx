import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  ArrowLeft,
  CreditCard,
  Shield,
  Lock,
  Check,
  Crown,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

// Initialize Stripe
const stripePromise = loadStripe("pk_test_51RhyV6Gg4LPyrkQqy7ha14kBNK6ZmyWUlUIKYwNiGD1VHjpNF9vQiDnrUO4qWsIdg66Tvu2xWqEzYJpuE5Jinadc00UPGknb8y");

// Plan configuration
const PLANS = {
  pro: {
    id: "pro",
    name: "Professional",
    price: 29.99,
    credits: 1000,
    description: "1000 credits per month",
    features: [
      "2K quality images",
      "No watermarks",
      "Fast generation",
      "Priority support",
      "Commercial license"
    ],
    gradient: "from-purple-600 to-blue-600",
    popular: true
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 99.99,
    credits: "unlimited",
    description: "Unlimited credits",
    features: [
      "4K quality images",
      "Unlimited credits",
      "API access",
      "Dedicated support",
      "Custom integrations"
    ],
    gradient: "from-amber-500 to-orange-600"
  }
};

// Card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      backgroundColor: 'transparent',
      '::placeholder': {
        color: '#9CA3AF',
      },
      border: 'none',
      padding: '0',
    },
    invalid: {
      color: '#EF4444',
    },
    complete: {
      color: '#10B981',
    },
  },
  hidePostalCode: true,
};

function CheckoutForm({ plan, clientSecret }: { plan: any; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Payment system not ready. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card information is required.");
      setLoading(false);
      return;
    }

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (paymentError) {
        let errorMessage = paymentError.message || "Payment failed";

        // Handle specific Stripe errors
        if (paymentError.code === 'card_declined') {
          errorMessage = "Your card was declined. Please try a different card.";
        } else if (paymentError.code === 'insufficient_funds') {
          errorMessage = "Insufficient funds. Please try a different card.";
        } else if (paymentError.code === 'expired_card') {
          errorMessage = "Your card has expired. Please use a different card.";
        } else if (paymentError.code === 'incorrect_cvc') {
          errorMessage = "Incorrect CVC. Please check your card details.";
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setSuccess(true);

        // Call fallback confirmation endpoint to ensure credits are added
        try {
          const token = localStorage.getItem("visionai_token");
          const confirmResponse = await fetch("/api/payments/confirm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          });

          if (confirmResponse.ok) {
            const confirmData = await confirmResponse.json();
            console.log("✅ Payment confirmed:", confirmData);
            toast.success(`Payment successful! ${confirmData.creditsAdded} credits added to your account.`);
          } else {
            console.warn("⚠️ Fallback confirmation failed, but payment was successful");
            toast.success("Payment successful! Credits should be added shortly.");
          }
        } catch (confirmError) {
          console.warn("⚠️ Fallback confirmation error:", confirmError);
          toast.success("Payment successful! Credits should be added shortly.");
        }

        await refreshUser();

        // Redirect to success page after a short delay
        setTimeout(() => {
          navigate("/payment/success?payment_intent=" + paymentIntent.id);
        }, 2000);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
        <p className="text-green-600">Your account has been upgraded. Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-md p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your payment is secured by Stripe's industry-leading security
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Complete Payment - ${plan.price}
          </>
        )}
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          <Shield className="w-3 h-3 inline mr-1" />
          Your payment is secured by Stripe
        </p>
      </div>
    </form>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<any>(null);

  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const planId = searchParams.get("plan");

  useEffect(() => {
    // Don't proceed if still loading auth
    if (isLoading) return;

    // Check authentication
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if plan is provided
    if (!planId) {
      navigate("/dashboard");
      return;
    }

    // Validate plan
    const selectedPlan = PLANS[planId as keyof typeof PLANS];
    if (!selectedPlan) {
      toast.error("Invalid plan selected");
      navigate("/dashboard");
      return;
    }

    setPlan(selectedPlan);

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("visionai_token");
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch("/api/payments/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId: selectedPlan.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }

        const data = await response.json();

        if (!data.clientSecret) {
          throw new Error("Payment intent created but client secret is missing");
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Error creating payment intent:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [user, planId, navigate, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{isLoading ? "Loading..." : "Setting up payment..."}</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Payment Setup Failed</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Loading plan details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gradient-start to-gradient-end rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              VisionAI
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Your Purchase
            </h1>
            <p className="text-muted-foreground text-lg">
              Upgrade to {plan.name} and unlock the full power of AI creation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <span>Order Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan Details */}
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center`}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        {plan.popular && (
                          <Badge className="bg-gradient-to-r from-gradient-start to-gradient-end text-white">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">What's included:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Price */}
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${plan.price}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Badge */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">Secure Payment</h4>
                      <p className="text-sm text-green-700">
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientSecret ? (
                    <Elements stripe={stripePromise}>
                      <CheckoutForm plan={plan} clientSecret={clientSecret} />
                    </Elements>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                      <p>Preparing payment form...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
