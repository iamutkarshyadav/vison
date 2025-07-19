import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  Star,
  Infinity,
  Shield,
  Clock,
  X,
} from "lucide-react";
import {
  UNIFIED_PRICING_PLANS,
  PricingPlan,
  formatPrice,
  calculateSavings,
} from "@shared/pricing";

interface PricingPlansProps {
  onSelectPlan?: (planId: string) => void;
  currentPlan?: string;
  isLoading?: boolean;
  redirectToCheckout?: boolean;
}

export default function PricingPlans({
  onSelectPlan,
  currentPlan,
  isLoading = false,
  redirectToCheckout = false,
}: PricingPlansProps) {
  const navigate = useNavigate();

  const getIcon = (tier: PricingPlan) => {
    switch (tier.id) {
      case "free":
        return <Sparkles className="w-6 h-6" />;
      case "pro":
        return <Zap className="w-6 h-6" />;
      case "enterprise":
        return <Crown className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getQualityBadge = (quality: string) => {
    const colors = {
      Standard: "bg-gray-100 text-gray-800",
      HD: "bg-blue-100 text-blue-800",
      "2K": "bg-purple-100 text-purple-800",
      "4K": "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    };
    return colors[quality as keyof typeof colors] || colors.Standard;
  };

  const handlePlanSelection = (planId: string) => {
    if (redirectToCheckout && planId !== "free") {
      navigate(`/checkout?plan=${planId}`);
    } else if (onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Choose Your{" "}
          <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
            Perfect Plan
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of AI-generated art with our flexible
          pricing options
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {UNIFIED_PRICING_PLANS.map((tier) => {
          const savings = calculateSavings(tier.originalPrice, tier.price);

          return (
            <Card
              key={tier.id}
              className={`relative transition-all duration-300 hover:shadow-xl ${
                tier.popular
                  ? "border-primary shadow-primary/20 shadow-lg scale-105"
                  : tier.enterprise
                    ? "border-gradient-start shadow-gradient-start/20 shadow-lg"
                    : "hover:border-primary/50"
              } ${
                currentPlan === tier.id
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
            >
              {tier.badge && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0">
                  {tier.badge}
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div
                    className={`p-3 rounded-full ${
                      tier.enterprise
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : tier.popular
                          ? "bg-gradient-to-r from-gradient-start to-gradient-end text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {getIcon(tier)}
                  </div>
                </div>

                <CardTitle className="text-2xl font-bold">
                  {tier.name}
                </CardTitle>

                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-bold">
                      {formatPrice(tier.price)}
                    </span>
                    <div className="text-left">
                      {tier.originalPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(tier.originalPrice)}
                        </div>
                      )}
                      {tier.price > 0 && (
                        <div className="text-sm text-muted-foreground">
                          /{tier.interval}
                        </div>
                      )}
                    </div>
                  </div>
                  {savings > 0 && (
                    <Badge className="bg-green-100 text-green-800 text-sm mt-2">
                      Save {formatPrice(savings)}/month
                    </Badge>
                  )}
                </div>

                <div className="flex justify-center space-x-2 mt-4">
                  <Badge
                    className={`text-xs ${getQualityBadge(tier.imageQuality)}`}
                  >
                    {tier.imageQuality}
                  </Badge>
                  {!tier.watermark && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      No Watermark
                    </Badge>
                  )}
                  {tier.generationSpeed === "Priority" && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Priority
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">
                    {typeof tier.credits === "number"
                      ? `${tier.credits.toLocaleString()} credits`
                      : "Unlimited credits"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {tier.interval}
                  </div>
                </div>

                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                  {tier.limitations?.map((limitation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePlanSelection(tier.id)}
                  disabled={isLoading || currentPlan === tier.id}
                  className={`w-full ${
                    tier.enterprise
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : tier.popular
                        ? "bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
                        : tier.id === "free"
                          ? "bg-muted text-muted-foreground hover:bg-muted/80"
                          : ""
                  } ${
                    currentPlan === tier.id
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  variant={
                    tier.popular || tier.enterprise
                      ? "default"
                      : tier.id === "free"
                        ? "secondary"
                        : "outline"
                  }
                  size="lg"
                >
                  {currentPlan === tier.id
                    ? "Current Plan"
                    : tier.id === "free"
                      ? "Get Started"
                      : tier.enterprise
                        ? "Contact Sales"
                        : "Upgrade Now"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">
            Need a custom solution?
          </h3>
          <p className="text-muted-foreground mb-4">
            Contact us for enterprise pricing and custom integrations
          </p>
          <Button variant="outline">
            <Crown className="w-4 h-4 mr-2" />
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
