import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Sparkles,
  CreditCard,
  ArrowLeft,
  Crown,
  Zap,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "processing" | "success" | "failed"
  >("processing");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");
  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId && !paymentIntentId) {
        setPaymentStatus("failed");
        setIsProcessing(false);
        return;
      }

      if (!user) {
        // Wait a bit for user context to load, but not too long
        setTimeout(() => {
          if (!user) {
            setPaymentStatus("failed");
            setIsProcessing(false);
            navigate("/login");
          }
        }, 1000);
        return;
      }

      try {
        const token = localStorage.getItem("visionai_token");
        if (!token) {
          throw new Error("Authentication required");
        }

        if (paymentIntentId) {
          // For Payment Intent flow (custom checkout)
          // Just refresh user data and show success - webhook handles credit updates
          await refreshUser?.();

          setPaymentDetails({
            creditsAdded: "Credits added",
            newBalance: user?.credits || 0,
          });
          setPaymentStatus("success");

          toast.success("Payment successful! Your credits have been updated.");
        } else if (sessionId) {
          // For Checkout Session flow (legacy)
          const response = await fetch("/api/payments/success", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setPaymentDetails(data);
            setPaymentStatus("success");

            // Refresh user data to get updated credits
            await refreshUser?.();

            toast.success(
              `Successfully added ${data.creditsAdded} credits to your account!`,
            );
          } else {
            throw new Error(data.message || "Payment verification failed");
          }
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        setPaymentStatus("failed");
        toast.error(
          "Failed to process payment. Please contact support if you were charged.",
        );
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [sessionId, user, navigate, refreshUser]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gradient-start to-gradient-end rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
            <p className="text-muted-foreground mb-4">
              Please wait while we verify your payment...
            </p>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gradient-start to-gradient-end rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                This usually takes a few seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">
              Payment Failed
            </h2>
            <p className="text-muted-foreground mb-6">
              We couldn't process your payment. If you were charged, please
              contact our support team.
            </p>
            <div className="space-y-3">
              <Link to="/dashboard">
                <Button className="w-full">Back to Dashboard</Button>
              </Link>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gradient-start to-gradient-end rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              VisionAI
            </span>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Success Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-xl text-muted-foreground">
              Your plan has been upgraded and credits have been added to your
              account.
            </p>
          </div>

          {/* Payment Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Credits Added
                  </label>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-lg font-semibold">
                      {paymentDetails?.creditsAdded?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-lg">
                      {paymentDetails?.newBalance?.toLocaleString() ||
                        user?.credits ||
                        0}{" "}
                      credits
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Transaction ID
                  </label>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {(paymentIntentId || sessionId)?.substring(0, 20)}...
                  </code>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Date
                  </label>
                  <span className="text-sm">
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Start Creating</h4>
                      <p className="text-sm text-muted-foreground">
                        Use your credits to generate high-quality 2K images
                        without watermarks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Share Your Art</h4>
                      <p className="text-sm text-muted-foreground">
                        Share your creations with the community and gain
                        followers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Track Progress</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitor your usage and stats in your dashboard
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Badge className="bg-gradient-to-r from-gradient-start to-gradient-end text-white mb-3">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium Benefits
                  </Badge>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>2K quality images</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>No watermarks</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Fast generation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Community sharing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/generate" className="flex-1">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating
              </Button>
            </Link>
            <Link to="/dashboard" className="flex-1">
              <Button size="lg" variant="outline" className="w-full">
                View Dashboard
              </Button>
            </Link>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              A receipt has been sent to your email address. If you have any
              questions, please{" "}
              <a href="#" className="text-primary hover:underline">
                contact our support team
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
