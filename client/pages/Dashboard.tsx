import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LoadingSpinner,
  PageLoadingSpinner,
} from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Zap,
  Image,
  Users,
  Settings,
  CreditCard,
  Star,
  ArrowLeft,
  Download,
  Share,
  Heart,
  TrendingUp,
  Calendar,
  Award,
  Crown,
  LogOut,
  Plus,
  Eye,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { aiService, GeneratedImage } from "@/lib/ai-service";
import { stripeService, creditPackages } from "@/lib/stripe-service";
import PricingPlans from "@/components/ui/pricing-plans";
import { toast } from "sonner";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("creations");
  const [recentGenerations, setRecentGenerations] = useState<GeneratedImage[]>(
    [],
  );
  const [stats, setStats] = useState({
    imagesGenerated: 0,
    creditsUsed: 0,
    communityLikes: 0,
    followers: 0,
  });
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const { user, logout, updateCredits } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Load user's actual images from API
    const loadUserData = async () => {
      setIsLoadingData(true);
      setDataError(null);

      try {
        const token = localStorage.getItem("visionai_token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Load user's images with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const imagesResponse = await fetch("/api/images/user?limit=12", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json();
            if (imagesData.success && imagesData.data.images) {
              setRecentGenerations(imagesData.data.images);
            }
          } else if (imagesResponse.status === 401) {
            throw new Error("Session expired. Please sign in again.");
          } else {
            throw new Error("Failed to load your images");
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            throw new Error("Request timed out. Please try again.");
          }
          throw fetchError;
        }

        // Update stats with real data
        setStats({
          imagesGenerated: user.stats?.imagesGenerated || 0,
          creditsUsed: user.stats?.creditsUsed || 0,
          communityLikes: user.stats?.communityLikes || 0,
          followers: user.stats?.followers || 0,
        });
      } catch (error) {
        console.error("Error loading user data:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data";
        setDataError(errorMessage);

        if (errorMessage.includes("Session expired")) {
          toast.error("Session expired. Please sign in again.");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();

    // Check for payment status in URL
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "cancelled") {
      toast.info("Payment was cancelled. You can try again anytime.");
      // Remove the query parameter from URL
      window.history.replaceState({}, "", "/dashboard");
    } else if (paymentStatus === "success") {
      toast.success("Payment successful! Your account has been upgraded.");
      // Remove the query parameter from URL
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [user, navigate, searchParams]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleDownloadImage = (image: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `visionai-${image.id}.jpg`;
    link.click();
    toast.success("Image downloaded");
  };

  const handlePurchaseCredits = async (planId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase");
      return;
    }

    const token = localStorage.getItem("visionai_token");
    if (!token) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

    if (planId === "free") {
      toast.info("You're already on the free plan");
      return;
    }

    if (planId === user.plan) {
      toast.info("You're already on this plan");
      return;
    }

    setIsPurchasing(true);
    setSelectedPackage(planId);

    try {
      console.log(
        "Creating payment session for plan:",
        planId,
        "user:",
        user.email,
      );

      // Use the stripe service for payment
      await stripeService.purchaseCredits(planId, token);

      // If we reach here, it means the redirect didn't happen
      toast.info("Redirecting to payment...");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Purchase failed";
      console.error("Purchase error details:", error);

      // Show more helpful error messages
      if (errorMessage.includes("Authentication required")) {
        toast.error("Please sign in again to purchase credits");
      } else if (errorMessage.includes("Invalid plan")) {
        toast.error("Selected plan is not available");
      } else {
        toast.error(`Payment error: ${errorMessage}`);
      }
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const progressToNextLevel = ((stats.imagesGenerated % 100) / 100) * 100;
  const currentLevel = Math.floor(stats.imagesGenerated / 100) + 1;

  if (!user) {
    return null;
  }

  if (isLoadingData) {
    return <PageLoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gradient-start to-gradient-end rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                VisionAI
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>{user.credits} credits</span>
            </Badge>
            <Link to="/generate">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <span>Welcome back, {user.name}</span>
                {user.plan === "pro" && (
                  <Crown className="w-6 h-6 text-yellow-500" />
                )}
              </h1>
              <p className="text-muted-foreground">
                {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan •
                Member since{" "}
                {new Date(user.joinedAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  Level {currentLevel}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Progress value={progressToNextLevel} className="w-20" />
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(progressToNextLevel)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button
                    variant={activeTab === "creations" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("creations")}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    My Creations
                  </Button>
                  <Button
                    variant={activeTab === "favorites" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("favorites")}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Favorites
                  </Button>
                  <Button
                    variant={activeTab === "billing" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("billing")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </Button>
                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <hr className="my-2" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "creations" && (
              <>
                {/* Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground flex items-center">
                        <Image className="w-4 h-4 mr-1" />
                        Images Generated
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.imagesGenerated.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        Credits Remaining
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        {user.credits}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        Community Likes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.communityLikes.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Followers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.followers}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Creations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Recent Creations</span>
                      {recentGenerations.length > 0 && (
                        <Badge variant="secondary">
                          {recentGenerations.length} images
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentGenerations.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentGenerations.map((image) => (
                          <Card
                            key={image.id}
                            className="overflow-hidden group hover:shadow-lg transition-shadow"
                          >
                            <div className="aspect-square relative">
                              <img
                                src={image.url}
                                alt={image.prompt}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDownloadImage(image)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="secondary">
                                  <Share className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="secondary">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {image.style}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    image.timestamp,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                "{image.prompt}"
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                          No creations yet
                        </p>
                        <p className="text-sm mb-4">
                          Start generating amazing AI art to see your creations
                          here
                        </p>
                        <Link to="/generate">
                          <Button>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Your First Image
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "favorites" && (
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No favorites yet</p>
                    <p className="text-sm">
                      Heart images you love to save them here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "billing" && (
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Current Plan</span>
                      <Badge
                        variant={user.plan === "free" ? "secondary" : "default"}
                      >
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {user.credits}
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Credits remaining
                      </p>
                      {user.plan === "free" && (
                        <p className="text-sm text-orange-600 mb-4">
                          ⚠️ Upgrade for 2K quality images without watermarks
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-2xl font-bold mb-6">Upgrade Your Plan</h3>
                  <PricingPlans
                    currentPlan={user.plan}
                    isLoading={isPurchasing}
                    redirectToCheckout={true}
                  />
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-muted-foreground">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Member Since
                      </label>
                      <p className="text-muted-foreground">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline">Edit Profile</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Preference settings coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
