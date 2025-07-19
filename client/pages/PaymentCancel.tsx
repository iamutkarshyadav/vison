import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  XCircle,
  Sparkles,
  ArrowLeft,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
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

      {/* Cancel Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Cancel Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Payment Cancelled
            </h1>
            <p className="text-xl text-muted-foreground">
              Your payment was cancelled. No charges were made to your account.
            </p>
          </div>

          {/* Cancel Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>What Happened?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800">
                  <strong>Payment Cancelled:</strong> You chose to cancel the
                  payment process before completion. No charges have been made
                  to your payment method.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Plan
                  </label>
                  <Badge variant="secondary" className="text-lg">
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Credits
                  </label>
                  <div className="text-lg font-semibold">
                    {user.credits} credits
                  </div>
                </div>
              </div>

              {sessionId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Session ID
                  </label>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {sessionId.substring(0, 20)}...
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5" />
                <span>Need Help?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Common Reasons for Payment Cancellation:
                  </h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Changed your mind about the purchase</li>
                    <li>• Want to compare different plans</li>
                    <li>• Payment method issues</li>
                    <li>• Browser or connection problems</li>
                  </ul>
                </div>

                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    If you experienced technical issues or need assistance with
                    payment, our support team is here to help.
                  </p>
                  <Button variant="outline">Contact Support</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/dashboard" className="flex-1">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Try Again
              </Button>
            </Link>
            <Link to="/generate" className="flex-1">
              <Button size="lg" variant="outline" className="w-full">
                <Sparkles className="w-5 h-5 mr-2" />
                Continue with Free Plan
              </Button>
            </Link>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              You can upgrade your plan at any time from your dashboard. If you
              have questions about our pricing,{" "}
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
