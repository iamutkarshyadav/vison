import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function PaymentDebug() {
  const [searchParams] = useSearchParams();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user } = useAuth();

  useEffect(() => {
    // Collect debug information
    const info = {
      sessionId: searchParams.get("session_id"),
      paymentStatus: searchParams.get("payment"),
      currentUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      user: user
        ? {
            id: user.id,
            email: user.email,
            plan: user.plan,
            credits: user.credits,
          }
        : null,
      environment: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
      },
      localStorage: {
        hasToken: !!localStorage.getItem("visionai_token"),
        hasUser: !!localStorage.getItem("visionai_user"),
        demoMode: !!localStorage.getItem("visionai_demo_mode"),
      },
    };

    setDebugInfo(info);
  }, [searchParams, user]);

  const testAPIConnections = async () => {
    const results = {
      authAPI: { status: "unknown", response: null },
      paymentsAPI: { status: "unknown", response: null },
      stripeConfig: { status: "unknown", response: null },
    };

    try {
      // Test auth API
      const authResponse = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("visionai_token")}`,
        },
      });
      results.authAPI = {
        status: authResponse.ok ? "success" : "error",
        response: await authResponse.json(),
      };
    } catch (error) {
      results.authAPI = { status: "error", response: error };
    }

    try {
      // Test payments API
      const paymentsResponse = await fetch("/api/payments/test");
      results.paymentsAPI = {
        status: paymentsResponse.ok ? "success" : "error",
        response: await paymentsResponse.json(),
      };
    } catch (error) {
      results.paymentsAPI = { status: "error", response: error };
    }

    try {
      // Test general API
      const pingResponse = await fetch("/api/ping");
      results.stripeConfig = {
        status: pingResponse.ok ? "success" : "error",
        response: await pingResponse.json(),
      };
    } catch (error) {
      results.stripeConfig = { status: "error", response: error };
    }

    setDebugInfo((prev) => ({ ...prev, apiTests: results }));
  };

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
              VisionAI Debug
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Payment Debug Information
            </h1>
            <p className="text-muted-foreground">
              This page helps diagnose payment flow issues
            </p>
          </div>

          {/* Current Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Current Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Session ID</label>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    {debugInfo.sessionId || "None"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Status</label>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    {debugInfo.paymentStatus || "None"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">User Status</label>
                  <Badge variant={user ? "default" : "secondary"}>
                    {user ? "Authenticated" : "Not Authenticated"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Environment</label>
                  <p className="text-sm">
                    {debugInfo.environment?.hostname || "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          {user && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Plan</label>
                    <Badge>{user.plan}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Credits</label>
                    <p className="text-sm font-bold">{user.credits}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Token Status</label>
                    <Badge
                      variant={
                        debugInfo.localStorage?.hasToken
                          ? "default"
                          : "secondary"
                      }
                    >
                      {debugInfo.localStorage?.hasToken ? "Present" : "Missing"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Tests */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>API Connection Tests</span>
                <Button onClick={testAPIConnections} size="sm">
                  Run Tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.apiTests ? (
                <div className="space-y-4">
                  {Object.entries(debugInfo.apiTests).map(
                    ([key, result]: [string, any]) => (
                      <div
                        key={key}
                        className="flex items-center space-x-3 p-3 border rounded"
                      >
                        {result.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : result.status === "error" ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{key}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {result.status}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Click "Run Tests" to check API connections
                </p>
              )}
            </CardContent>
          </Card>

          {/* Debug Data */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Debug Data (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/dashboard" className="flex-1">
              <Button size="lg" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Refresh Page
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(debugInfo, null, 2),
                );
                alert("Debug info copied to clipboard!");
              }}
              className="flex-1"
            >
              Copy Debug Info
            </Button>
          </div>

          {/* Help Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">
                    Payment gets stuck or redirects incorrectly
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Check if you're using HTTPS (required for payments)
                    </li>
                    <li>• Verify your authentication token is valid</li>
                    <li>• Clear browser cache and cookies</li>
                    <li>• Try a different browser or incognito mode</li>
                  </ul>
                </div>

                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">Comments not working</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Make sure you're signed in</li>
                    <li>• Check your authentication token</li>
                    <li>• Verify the image exists in the community</li>
                    <li>• Try refreshing the page</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
