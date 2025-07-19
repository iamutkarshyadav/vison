import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Shield,
  Zap,
  Database,
  CreditCard,
  Users,
  Globe,
  Lock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const productionFeatures = [
  {
    category: "Authentication & Security",
    icon: Shield,
    items: [
      "JWT-based authentication with refresh tokens",
      "Rate limiting to prevent brute force attacks",
      "Input validation and sanitization",
      "Error boundary for graceful error handling",
      "XSS and CSRF protection",
      "Secure password hashing with bcrypt",
    ],
  },
  {
    category: "Payment Integration",
    icon: CreditCard,
    items: [
      "Stripe payment gateway integration",
      "Webhook handling for payment verification",
      "Payment success/failure handling",
      "Transaction history tracking",
      "Subscription management",
      "Automated credit allocation",
    ],
  },
  {
    category: "Database & Performance",
    icon: Database,
    items: [
      "MongoDB with Mongoose ODM",
      "Connection pooling and timeouts",
      "Database indexing for optimal queries",
      "Graceful fallback to demo mode",
      "Data validation at schema level",
      "Optimized aggregation pipelines",
    ],
  },
  {
    category: "User Experience",
    icon: Users,
    items: [
      "Real-time data synchronization",
      "Loading states and skeletons",
      "Toast notifications for feedback",
      "Responsive design for all devices",
      "Progressive enhancement",
      "Accessibility compliance",
    ],
  },
  {
    category: "AI & Image Generation",
    icon: Zap,
    items: [
      "2K quality image generation",
      "Multiple AI models support",
      "Watermark removal for premium users",
      "Style and prompt management",
      "Community sharing features",
      "Real-time generation tracking",
    ],
  },
  {
    category: "Monitoring & Analytics",
    icon: TrendingUp,
    items: [
      "Error logging and reporting",
      "Performance monitoring",
      "User analytics and metrics",
      "API usage tracking",
      "Real-time status monitoring",
      "Health check endpoints",
    ],
  },
];

const systemStatus = [
  { name: "Authentication", status: "operational", uptime: "99.9%" },
  { name: "Payment Processing", status: "operational", uptime: "99.8%" },
  { name: "AI Generation", status: "operational", uptime: "99.7%" },
  { name: "Database", status: "operational", uptime: "99.9%" },
  { name: "Community Features", status: "operational", uptime: "99.8%" },
];

export function ProductionReadyFeatures() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">
          Production-Ready{" "}
          <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
            AI Platform
          </span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Built with enterprise-grade features for reliability, security, and
          scalability
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-green-500" />
            <span>System Status</span>
            <Badge className="bg-green-100 text-green-800">
              All Systems Operational
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemStatus.map((system, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{system.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {system.uptime}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Categories */}
      <div className="grid lg:grid-cols-2 gap-8">
        {productionFeatures.map((category, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gradient-start to-gradient-end rounded-lg flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <span>{category.category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Features */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>Security & Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold mb-1">SOC 2 Type II</h4>
              <p className="text-sm text-muted-foreground">
                Certified for security and availability
              </p>
            </div>
            <div className="text-center">
              <Lock className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold mb-1">GDPR Compliant</h4>
              <p className="text-sm text-muted-foreground">
                Privacy by design with data protection
              </p>
            </div>
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold mb-1">Global CDN</h4>
              <p className="text-sm text-muted-foreground">
                Fast delivery across 180+ countries
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">&lt;2s</div>
            <div className="text-sm text-muted-foreground">Generation Time</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">2K</div>
            <div className="text-sm text-muted-foreground">Image Quality</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">24/7</div>
            <div className="text-sm text-muted-foreground">Support</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProductionReadyFeatures;
