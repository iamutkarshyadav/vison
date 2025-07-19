import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Database } from "lucide-react";

export default function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [checkEnabled, setCheckEnabled] = useState(true);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const checkDemoMode = async () => {
      if (!checkEnabled) return;

      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch("/api/ping", {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        if (!data.database?.connected) {
          setIsDemoMode(true);
          setIsVisible(true);
        } else {
          setIsDemoMode(false);
          setIsVisible(false);
        }

        // Reset retry count on success
        retryCount = 0;
      } catch (error) {
        retryCount++;

        if (retryCount <= maxRetries) {
          // Silently fail for first few attempts
          if (retryCount === maxRetries) {
            console.warn(
              "Server status check failed, disabling demo banner checks",
            );
            setCheckEnabled(false);
            setIsVisible(false);
          }
        }
      }
    };

    // Only do initial check, don't set up interval to avoid spam
    checkDemoMode();

    // Optional: Check only once more after 10 seconds, then disable
    const timeoutId = setTimeout(() => {
      if (checkEnabled) {
        checkDemoMode();
      }
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setCheckEnabled(false);
    // Remember user's choice
    localStorage.setItem("visionai_demo_banner_dismissed", "true");
  };

  // Check if user previously dismissed
  const wasDismissed =
    localStorage.getItem("visionai_demo_banner_dismissed") === "true";

  if (!isVisible || !isDemoMode || wasDismissed) {
    return null;
  }

  return (
    <Alert className="bg-orange-50 border-orange-200 text-orange-800 mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-4 w-4" />
          <span>
            <strong>Demo Mode:</strong> Database unavailable. Using demo data.
            Full functionality requires MongoDB connection.
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-orange-600 hover:text-orange-800"
          title="Dismiss permanently"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
