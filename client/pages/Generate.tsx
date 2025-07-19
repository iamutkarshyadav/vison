import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Wand2,
  Settings2,
  ArrowLeft,
  Download,
  Share,
  Heart,
  Copy,
  Shuffle,
  Clock,
  Image as ImageIcon,
  Plus,
  X,
  Users,
  Tag,
  AlertTriangle,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { aiService, GeneratedImage } from "@/lib/ai-service";
import { stripeService } from "@/lib/stripe-service";
import { toast } from "sonner";

const aspectRatios = [
  { label: "Square 2K", value: "1:1-2k", width: 2048, height: 2048 },
  { label: "Portrait 2K", value: "2:3", width: 1365, height: 2048 },
  { label: "Landscape 2K", value: "3:2", width: 2048, height: 1365 },
  { label: "Ultra Wide 2K", value: "16:9", width: 2048, height: 1152 },
  { label: "Standard HD", value: "1:1-hd", width: 1024, height: 1024 },
  { label: "Instagram Story", value: "9:16", width: 1080, height: 1920 },
];

const styles = [
  "Photorealistic",
  "Artistic",
  "Fantasy",
  "Sci-Fi",
  "Anime",
  "Cartoon",
  "Abstract",
  "Vintage",
  "Minimalist",
  "Cyberpunk",
];

const promptTemplates = [
  "A majestic {subject} in a {setting} with {lighting}",
  "Photorealistic portrait of {subject} with {style} lighting",
  "Fantasy landscape with {subject} and magical {elements}",
  "Cyberpunk {subject} in neon-lit {setting}",
  "Vintage {style} illustration of {subject}",
  "Abstract {style} representation of {subject}",
];

export default function Generate() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null,
  );
  const [recentGenerations, setRecentGenerations] = useState<GeneratedImage[]>(
    [],
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationTime, setGenerationTime] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareImageData, setShareImageData] = useState<GeneratedImage | null>(
    null,
  );
  const [shareTags, setShareTags] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);

  const { user, updateCredits, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to generate images");
      navigate("/login");
      return;
    }

    // Check if prompt was passed from landing page or community
    if (location.state?.prompt) {
      setPrompt(location.state.prompt);
      toast.info("Prompt loaded from trending selection");
    }

    // Load recent generations from API
    const loadUserImages = async () => {
      try {
        const token = localStorage.getItem("visionai_token");
        if (!token) return;

        const response = await fetch("/api/images/user?limit=12", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.images) {
            setRecentGenerations(data.data.images);
          }
        }
      } catch (error) {
        console.error("Error loading recent generations:", error);
        // Fall back to localStorage if API fails
        const saved = localStorage.getItem("recent_generations");
        if (saved) {
          try {
            setRecentGenerations(JSON.parse(saved));
          } catch (e) {
            console.error("Error parsing saved generations:", e);
          }
        }
      }
    };

    loadUserImages();
  }, [user, location.state, navigate]);

  const handleGenerate = async () => {
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];
    if (!prompt.trim()) {
      validationErrors.push("Please enter a prompt");
    }
    if (!user) {
      validationErrors.push("Please sign in to generate images");
      navigate("/login");
      return;
    }
    if (user.credits < 1) {
      validationErrors.push(
        "Insufficient credits. Please purchase more credits.",
      );
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setIsGenerating(true);
    setGenerationTime(0);

    // Start timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setGenerationTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      // Construct full prompt with style
      let fullPrompt = prompt;
      if (selectedStyle) {
        fullPrompt = `${prompt}, ${selectedStyle.toLowerCase()} style`;
      }

      const generatedImg = await aiService.generateImage({
        prompt: fullPrompt,
        width: aspectRatio.width,
        height: aspectRatio.height,
        seed: seed,
        quality: "2k",
        removeWatermark: true,
      });

      setGeneratedImage(generatedImg);

      // Refresh user data to get updated credits
      await refreshUser();

      // Reload recent generations from API
      const token = localStorage.getItem("visionai_token");
      if (token) {
        try {
          const response = await fetch("/api/images/user?limit=12", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.images) {
              setRecentGenerations(data.data.images);
            }
          }
        } catch (e) {
          console.error("Failed to refresh user images:", e);
        }
      }

      toast.success(
        "High-quality 2K image generated successfully! No watermarks applied.",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate image";
      setErrors([errorMessage]);
      toast.error(errorMessage);
      console.error("Generation error:", error);
    } finally {
      clearInterval(timer);
      setIsGenerating(false);
    }
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard");
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      // Fetch the image as blob to ensure proper download
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `visionai-${generatedImage.id}.jpg`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  const handleUseTemplate = (template: string) => {
    setPrompt(template);
  };

  const handleShareToCommunity = async () => {
    if (!shareImageData) return;

    setIsSharing(true);
    try {
      const tags = shareTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const success = await aiService.shareImageToCommunity(
        shareImageData,
        tags,
      );

      if (success) {
        toast.success(
          "Image shared to community successfully! View it in the Community page.",
        );
        setShareDialogOpen(false);
        setShareTags("");

        // Update the image as shared
        const updatedImage = { ...shareImageData, isSharedToCommunity: true };
        setGeneratedImage(updatedImage);

        // Reload recent generations from API to get updated sharing status
        const token = localStorage.getItem("visionai_token");
        if (token) {
          try {
            const response = await fetch("/api/images/user?limit=12", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.images) {
                setRecentGenerations(data.data.images);
              }
            }
          } catch (e) {
            console.error("Failed to refresh user images:", e);
          }
        }
      } else {
        toast.error("Failed to share image. Please try again.");
      }
    } catch (error) {
      console.error("Share error:", error);

      let errorMessage = "Failed to share image to community";
      if (error instanceof Error) {
        if (error.message.includes("Authentication required")) {
          errorMessage = "Please sign in again to share images";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("not found")) {
          errorMessage = "Image not found. Please try generating a new image.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  const openShareDialog = (image: GeneratedImage) => {
    setShareImageData(image);
    setShareDialogOpen(true);
  };

  const handleBuyCredits = async () => {
    try {
      if (!user) {
        toast.error("Please sign in first");
        navigate("/login");
        return;
      }

      // Redirect to dashboard where they can purchase credits
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to navigate to purchase page");
    }
  };

  if (!user) {
    return null;
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
            <Badge
              variant="secondary"
              className="flex items-center space-x-1 cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              <span>{user.credits} credits</span>
            </Badge>
            <Link to="/dashboard">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5" />
                  <span>Generate Image</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    Describe Your Vision
                  </Label>
                  <div className="relative mt-2">
                    <Textarea
                      id="prompt"
                      placeholder="A majestic dragon soaring through stormy clouds..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleCopyPrompt}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Quick Styles
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {styles.slice(0, 6).map((style) => (
                      <Button
                        key={style}
                        variant={
                          selectedStyle === style ? "default" : "outline"
                        }
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          setSelectedStyle(selectedStyle === style ? "" : style)
                        }
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Aspect Ratio
                  </Label>
                  <Select
                    value={aspectRatio.value}
                    onValueChange={(value) =>
                      setAspectRatio(
                        aspectRatios.find((ar) => ar.value === value) ||
                          aspectRatios[0],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label} ({ratio.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left p-0"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </Button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-4 p-4 border rounded-lg">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Negative Prompt
                        </Label>
                        <Input
                          placeholder="What to avoid in the image..."
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">
                            Seed (Optional)
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRandomSeed}
                          >
                            <Shuffle className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          type="number"
                          placeholder="Random"
                          value={seed || ""}
                          onChange={(e) =>
                            setSeed(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {errors.length > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        Please fix the following issues:
                      </span>
                    </div>
                    <ul className="text-sm text-destructive space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (user && user.credits < 1)}
                  className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating... {generationTime}s
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate (1 credit)
                    </>
                  )}
                </Button>

                {user && user.credits < 1 && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleBuyCredits}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy More Credits
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {promptTemplates.slice(0, 4).map((template, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full text-left justify-start text-xs"
                      onClick={() => handleUseTemplate(template)}
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated Image</span>
                  {generatedImage && (
                    <Badge variant="secondary">
                      {generatedImage.dimensions.width}x
                      {generatedImage.dimensions.height}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImage ? (
                  <>
                    <div className="aspect-square rounded-lg overflow-hidden mb-6 bg-muted">
                      <img
                        src={generatedImage.url}
                        alt={generatedImage.prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Prompt</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          "{generatedImage.prompt}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button onClick={handleDownload} size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          {generatedImage.isSharedToCommunity ? (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" disabled>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Shared
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/community")}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                View in Community
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openShareDialog(generatedImage)}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Share to Community
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Heart className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {generatedImage.style}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            No Watermark
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-gradient-start/20 to-gradient-end/20 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-4">
                      {isGenerating ? (
                        <>
                          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                          <div>
                            <p className="text-lg font-medium">
                              Creating Your Image...
                            </p>
                            <p className="text-muted-foreground">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {generationTime}s elapsed
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                          <div>
                            <p className="text-lg font-medium">
                              Ready to Create
                            </p>
                            <p className="text-muted-foreground">
                              Enter a prompt and click generate to begin
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Generations */}
            {recentGenerations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>Your Recent Creations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {recentGenerations.slice(0, 8).map((image) => (
                      <div
                        key={image.id}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setGeneratedImage(image)}
                      >
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share to Community</DialogTitle>
            <DialogDescription>
              Share your creation with the VisionAI community. Add tags to help
              others discover your work.
            </DialogDescription>
          </DialogHeader>

          {shareImageData && (
            <div className="space-y-4">
              <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden">
                <img
                  src={shareImageData.url}
                  alt={shareImageData.prompt}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Prompt</Label>
                <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                  {shareImageData.prompt}
                </p>
              </div>

              <div>
                <Label htmlFor="tags" className="text-sm font-medium">
                  Tags (optional)
                </Label>
                <Input
                  id="tags"
                  placeholder="art, fantasy, cyberpunk..."
                  value={shareTags}
                  onChange={(e) => setShareTags(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate tags with commas
                </p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShareDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleShareToCommunity}
                  disabled={isSharing}
                  className="flex-1 bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
                >
                  {isSharing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Share Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
