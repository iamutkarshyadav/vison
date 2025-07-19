import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sparkles,
  Zap,
  Users,
  Star,
  ArrowRight,
  Play,
  Palette,
  Wand2,
  Image,
  Crown,
  Globe,
  Heart,
  ChevronRight,
  Download,
  Share,
  TrendingUp,
  Award,
  Infinity,
  Shield,
  MessageCircle,
  CheckCircle,
  Cpu,
  Camera,
  Brush,
  Rocket,
  Target,
  BarChart3,
  Check,
  X,
  CreditCard,
  Clock,
  UserPlus,
  Eye,
  Lightbulb,
  Layers,
  Gauge,
  Lock,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const stats = [
  {
    icon: Users,
    label: "Active Creators",
    value: "2.8M+",
    color: "text-blue-500",
    description: "Artists worldwide",
  },
  {
    icon: Image,
    label: "Images Generated",
    value: "127M+",
    color: "text-purple-500",
    description: "High-quality creations",
  },
  {
    icon: Star,
    label: "Community Rating",
    value: "4.9/5",
    color: "text-yellow-500",
    description: "User satisfaction",
  },
  {
    icon: TrendingUp,
    label: "Growth Rate",
    value: "200%",
    color: "text-green-500",
    description: "Monthly growth",
  },
];

const features = [
  {
    icon: Wand2,
    title: "Next-Gen AI Models",
    description:
      "Access to GPT-4 Vision, DALL-E 3, Midjourney, and Stable Diffusion XL for unmatched variety and quality.",
    highlight: "4+ AI Models",
    gradient: "from-purple-500 via-pink-500 to-red-500",
    benefits: ["FLUX Pro Access", "DALL-E 3 Integration", "Custom Training"],
  },
  {
    icon: Gauge,
    title: "Lightning Fast Generation",
    description:
      "Generate 2K images in under 3 seconds with our optimized infrastructure and priority processing.",
    highlight: "< 3 Seconds",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    benefits: ["Priority Queue", "Edge Computing", "Instant Results"],
  },
  {
    icon: Layers,
    title: "Professional Tools",
    description:
      "Complete suite including upscaling, background removal, style transfer, and batch processing.",
    highlight: "15+ Tools",
    gradient: "from-green-500 via-emerald-500 to-cyan-500",
    benefits: ["AI Upscaling", "Background Removal", "Style Transfer"],
  },
  {
    icon: Users,
    title: "Thriving Community",
    description:
      "Connect with creators, share your work, get feedback, and discover trending styles in our active community.",
    highlight: "Live Community",
    gradient: "from-orange-500 via-red-500 to-pink-500",
    benefits: ["Follow Artists", "Share & Discover", "Get Feedback"],
  },
];

const showcaseImages = [
  {
    id: "1",
    url: "https://image.pollinations.ai/prompt/Ultra%20realistic%20portrait%20of%20a%20cyberpunk%20warrior%20with%20neon%20blue%20hair%20and%20glowing%20tattoos?width=1024&height=1024&model=flux&nologo=true&enhance=true",
    prompt:
      "Ultra realistic portrait of a cyberpunk warrior with neon blue hair and glowing tattoos",
    style: "Cyberpunk",
    likes: 2847,
    views: 18934,
    creator: "Alex Chen",
    quality: "4K",
  },
  {
    id: "2",
    url: "https://image.pollinations.ai/prompt/Majestic%20dragon%20soaring%20through%20clouds%20above%20an%20ancient%20castle%20at%20golden%20hour?width=1024&height=1024&model=flux&nologo=true&enhance=true",
    prompt:
      "Majestic dragon soaring through clouds above an ancient castle at golden hour",
    style: "Fantasy",
    likes: 1923,
    views: 12745,
    creator: "Maria Rodriguez",
    quality: "4K",
  },
  {
    id: "3",
    url: "https://image.pollinations.ai/prompt/Abstract%20geometric%20composition%20with%20vibrant%20holographic%20gradients%20and%20crystalline%20structures?width=1024&height=1024&model=flux&nologo=true&enhance=true",
    prompt:
      "Abstract geometric composition with vibrant holographic gradients and crystalline structures",
    style: "Abstract",
    likes: 1567,
    views: 9821,
    creator: "David Kim",
    quality: "4K",
  },
  {
    id: "4",
    url: "https://image.pollinations.ai/prompt/Photorealistic%20portrait%20of%20an%20elegant%20woman%20with%20intricate%20golden%20jewelry%20in%20renaissance%20style?width=1024&height=1024&model=flux&nologo=true&enhance=true",
    prompt:
      "Photorealistic portrait of an elegant woman with intricate golden jewelry in renaissance style",
    style: "Portrait",
    likes: 2134,
    views: 15892,
    creator: "Sophie Laurent",
    quality: "4K",
  },
];

const trendingPrompts = [
  "Cyberpunk samurai warrior in neon Tokyo",
  "Magical forest with glowing mushrooms",
  "Steampunk airship over Victorian London",
  "Abstract cosmic mandala with sacred geometry",
  "Photorealistic portrait of a fierce Viking",
  "Dreamy pastel sunset over crystal mountains",
  "Gothic cathedral with ethereal light rays",
  "Bioluminescent underwater city",
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Digital Artist & Content Creator",
    company: "Behance Top 1%",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    content:
      "VisionAI has completely transformed my creative workflow. The 4K quality and speed are unmatched. I've generated over 500 images for client projects.",
    rating: 5,
    verified: true,
  },
  {
    name: "Marcus Rodriguez",
    role: "Marketing Director",
    company: "TechFlow Inc.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
    content:
      "Our team saves 20+ hours per week using VisionAI for marketing visuals. The quality is so good our clients think they're photos!",
    rating: 5,
    verified: true,
  },
  {
    name: "Emily Watson",
    role: "Freelance Designer",
    company: "150+ Happy Clients",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    content:
      "The variety of styles and instant generation makes it perfect for rapid prototyping. My clients love the concepts I create with VisionAI.",
    rating: 5,
    verified: true,
  },
];

import {
  UNIFIED_PRICING_PLANS,
  formatPrice,
  calculateSavings,
} from "@shared/pricing";

const capabilities = [
  { icon: Cpu, title: "AI-Powered", desc: "Latest neural networks" },
  { icon: Camera, title: "4K Quality", desc: "Ultra-high resolution" },
  { icon: Brush, title: "15+ Styles", desc: "Artistic variety" },
  { icon: Rocket, title: "3s Generation", desc: "Lightning fast" },
  { icon: Target, title: "Precision Control", desc: "Fine-tune details" },
  { icon: BarChart3, title: "Analytics", desc: "Track performance" },
  { icon: RefreshCw, title: "Batch Process", desc: "Multiple images" },
  { icon: Smartphone, title: "Mobile Ready", desc: "Any device" },
];

export default function Index() {
  const [currentShowcase, setCurrentShowcase] = useState(0);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShowcase((prev) => (prev + 1) % showcaseImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickGenerate = async () => {
    if (!quickPrompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }

    if (!user) {
      toast.error("Please sign in to generate images");
      navigate("/login");
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate("/generate", { state: { prompt: quickPrompt } });
    } catch (error) {
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTrendingPromptClick = (prompt: string) => {
    try {
      navigate("/generate", { state: { prompt } });
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Failed to navigate to generator");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gradient-start to-gradient-end rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              VisionAI
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-10">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#showcase"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Showcase
            </a>
            <Link
              to="/community"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Community
            </Link>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Badge
                    variant="secondary"
                    className="hidden sm:flex items-center space-x-1 cursor-pointer hover:bg-secondary/80 px-4 py-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{user.credits} credits</span>
                  </Badge>
                </Link>
                <Link to="/dashboard">
                  <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="h-10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 h-10 px-6"
                  >
                    Try Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-background via-background/98 to-gradient-start/5 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto relative">
          <div className="text-center max-w-6xl mx-auto mb-20">
            <Badge className="mb-8 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0 text-sm px-6 py-3 animate-pulse shadow-lg">
              <Crown className="w-4 h-4 mr-2" />
              #1 AI Art Platform - Trusted by 2.8M+ Creators
            </Badge>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] mb-8">
              Create{" "}
              <span className="bg-gradient-to-r from-gradient-start via-purple-accent to-gradient-end bg-clip-text text-transparent animate-gradient-x">
                Extraordinary
              </span>
              <br />
              Art with AI
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-4xl mx-auto">
              Transform your imagination into stunning 4K visuals in seconds.
              Join millions of creators using the world's most advanced AI art
              platform.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Zap className="w-3 h-3 mr-1" />
                3s Generation
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Camera className="w-3 h-3 mr-1" />
                4K Quality
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Shield className="w-3 h-3 mr-1" />
                No Watermarks
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Users className="w-3 h-3 mr-1" />
                2.8M+ Community
              </Badge>
            </div>

            {/* Quick Generate */}
            <div className="max-w-3xl mx-auto mb-16">
              <Card className="bg-background/80 backdrop-blur-md border-2 border-primary/20 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex gap-4 mb-6">
                    <Input
                      placeholder="Describe your vision... e.g., 'Cyberpunk samurai in neon Tokyo'"
                      value={quickPrompt}
                      onChange={(e) => setQuickPrompt(e.target.value)}
                      className="text-lg h-16 bg-background/50 border-border/50 px-6 text-center"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleQuickGenerate()
                      }
                    />
                    <Button
                      onClick={handleQuickGenerate}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 h-16 px-10 text-lg shadow-lg"
                    >
                      {isGenerating ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Wand2 className="w-6 h-6 mr-3" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {trendingPrompts.slice(0, 4).map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => setQuickPrompt(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Link to="/generate">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 text-xl px-16 h-16 shadow-xl"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Start Creating Free
                </Button>
              </Link>
              <Link to="/community">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-xl px-12 h-16 border-2 hover:bg-primary hover:text-primary-foreground"
                >
                  <Users className="w-6 h-6 mr-3" />
                  Explore Community
                </Button>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="bg-background/60 backdrop-blur-sm border-border/50 hover:bg-background/80 transition-all group"
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <div
                        className={`p-4 rounded-2xl bg-gradient-to-r from-gradient-start/20 to-gradient-end/20 ${stat.color}`}
                      >
                        <stat.icon className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-foreground mb-1">
                      {stat.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Strip */}
      <section className="py-12 px-4 bg-muted/30 border-y border-border">
        <div className="container mx-auto">
          <div className="overflow-x-auto">
            <div className="flex md:grid md:grid-cols-8 gap-6 md:gap-4 min-w-max md:min-w-0">
              {capabilities.map((cap, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 min-w-fit md:min-w-0 text-center md:flex-col md:space-x-0 md:space-y-3 p-4 rounded-xl hover:bg-background/60 transition-all"
                >
                  <div className="p-2 bg-gradient-to-r from-gradient-start/10 to-gradient-end/10 rounded-lg">
                    <cap.icon className="w-6 h-6 text-primary flex-shrink-0" />
                  </div>
                  <div className="md:text-center">
                    <div className="text-sm font-semibold">{cap.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {cap.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Showcase Section */}
      <section id="showcase" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0 px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Live Community Showcase
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              See What's{" "}
              <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                Trending Now
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real 4K images generated by our community in the last 24 hours.
              Join the creative revolution happening right now.
            </p>
          </div>

          {/* Featured Image */}
          <div className="mb-16">
            <Card className="mx-auto max-w-4xl overflow-hidden border-2 border-primary/20 shadow-2xl">
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={showcaseImages[currentShowcase].url}
                    alt={showcaseImages[currentShowcase].prompt}
                    className="w-full h-full object-cover transition-all duration-1000"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-white/10 backdrop-blur-sm text-white border-white/20 px-3 py-1">
                        {showcaseImages[currentShowcase].style}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1">
                        <Crown className="w-3 h-3 mr-1" />
                        {showcaseImages[currentShowcase].quality}
                      </Badge>
                    </div>
                    <p className="text-xl font-semibold mb-4 line-clamp-2">
                      "{showcaseImages[currentShowcase].prompt}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-5 h-5" />
                          <span>
                            {showcaseImages[
                              currentShowcase
                            ].likes.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="w-5 h-5" />
                          <span>
                            {showcaseImages[
                              currentShowcase
                            ].views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {showcaseImages[currentShowcase].creator.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          by {showcaseImages[currentShowcase].creator}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Showcase Navigation */}
            <div className="flex justify-center space-x-3 mt-8">
              {showcaseImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentShowcase
                      ? "bg-primary w-12"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                  onClick={() => setCurrentShowcase(index)}
                />
              ))}
            </div>
          </div>

          {/* Showcase Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {showcaseImages.slice(1, 4).map((image, index) => (
              <Card
                key={image.id}
                className="group overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
                onClick={() =>
                  setCurrentShowcase(
                    showcaseImages.findIndex((img) => img.id === image.id),
                  )
                }
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="backdrop-blur-sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="backdrop-blur-sm"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="backdrop-blur-sm"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {image.style}
                      </Badge>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">
                          {image.likes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      "{image.prompt}"
                    </p>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {image.creator.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {image.creator}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link to="/community">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-12 border-2 hover:bg-primary hover:text-primary-foreground"
              >
                View Full Gallery
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0 px-4 py-2">
              <Infinity className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                Create & Succeed
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              Professional-grade tools and features trusted by creators,
              artists, and brands worldwide
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-10 border-2 border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 group relative overflow-hidden"
              >
                {/* Animated Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                <div className="flex items-start space-x-8 relative">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl`}
                  >
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-6">
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      <Badge
                        variant="secondary"
                        className="text-sm font-semibold"
                      >
                        {feature.highlight}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                      {feature.description}
                    </p>
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <div
                          key={benefitIndex}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Community Testimonials */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0 px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              Creator Success Stories
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                Creative Professionals
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of creators who've transformed their workflows with
              VisionAI
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="p-8 border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg relative overflow-hidden group"
              >
                <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-50 transition-opacity">
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>
                      {testimonial.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-lg">
                        {testimonial.name}
                      </div>
                      {testimonial.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-primary">
                      {testimonial.company}
                    </div>
                  </div>
                </div>

                <blockquote className="text-muted-foreground italic text-lg leading-relaxed">
                  "{testimonial.content}"
                </blockquote>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0 px-4 py-2">
              <CreditCard className="w-4 h-4 mr-2" />
              Simple, Transparent Pricing
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free, upgrade anytime. All plans include our powerful AI
              models and community features.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {UNIFIED_PRICING_PLANS.map((plan, index) => {
              const savings = calculateSavings(plan.originalPrice, plan.price);

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    plan.popular
                      ? "border-2 border-primary shadow-2xl shadow-primary/20 scale-105"
                      : "border border-border hover:border-primary/30 hover:shadow-xl"
                  }`}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0 px-4 py-1">
                      {plan.badge}
                    </Badge>
                  )}

                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <span className="text-5xl font-bold">
                          {formatPrice(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <div className="text-left">
                            {plan.originalPrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                {formatPrice(plan.originalPrice)}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              /{plan.interval}
                            </div>
                          </div>
                        )}
                      </div>

                      {savings > 0 && (
                        <Badge className="bg-green-100 text-green-800 text-sm">
                          Save {formatPrice(savings)}/month
                        </Badge>
                      )}
                    </div>

                    <div className="text-center mb-8">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {typeof plan.credits === "number"
                          ? `${plan.credits.toLocaleString()} credits`
                          : plan.credits + " credits"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.imageQuality} quality images
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start space-x-3"
                        >
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      {plan.limitations?.map((limitation, limitIndex) => (
                        <div
                          key={limitIndex}
                          className="flex items-start space-x-3"
                        >
                          <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {limitation}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full h-12 text-lg ${
                        plan.popular
                          ? "bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
                          : plan.id === "free"
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : ""
                      }`}
                      variant={
                        plan.popular
                          ? "default"
                          : plan.id === "free"
                            ? "secondary"
                            : "outline"
                      }
                      onClick={() => {
                        if (plan.id === "free") {
                          navigate("/register");
                        } else if (plan.id === "enterprise") {
                          // Contact sales action
                          window.open("mailto:sales@visionai.com", "_blank");
                        } else {
                          navigate(`/checkout?plan=${plan.id}`);
                        }
                      }}
                    >
                      {plan.id === "free"
                        ? "Get Started"
                        : plan.id === "enterprise"
                          ? "Contact Sales"
                          : "Upgrade Now"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-6">
              All plans include 14-day money-back guarantee • No setup fees •
              Cancel anytime
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Prompts */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Try These{" "}
              <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                Trending Prompts
              </span>
            </h3>
            <p className="text-muted-foreground text-lg">
              Popular prompts from our community this week
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {trendingPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 text-sm px-6 py-3"
                onClick={() => handleTrendingPromptClick(prompt)}
              >
                {prompt}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-gradient-start/10 to-gradient-end/10 relative">
        <div className="container mx-auto text-center relative">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-gradient-start to-gradient-end rounded-3xl flex items-center justify-center shadow-2xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Ready to Create Your{" "}
              <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                Masterpiece?
              </span>
            </h2>

            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              Join over 2.8 million creators worldwide. Start with 20 free
              credits. No credit card required. Generate your first 4K image in
              seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 text-xl px-16 h-16 shadow-2xl"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Start Creating Free
                </Button>
              </Link>
              <Link to="/community">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-xl px-12 h-16 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageCircle className="w-6 h-6 mr-3" />
                  Join Community
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-medium">SOC 2 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-purple-500" />
                <span className="font-medium">180+ Countries</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="font-medium">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-border py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-6 gap-12 mb-16">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gradient-start to-gradient-end rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                  VisionAI
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg pr-8">
                The world's most advanced AI image generation platform. Trusted
                by millions of creators, artists, and businesses to bring their
                ideas to life with unprecedented quality and speed.
              </p>
              <div className="flex space-x-4">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  2.8M+ Users
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  127M+ Images
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  4.9★ Rating
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Platform</h4>
              <div className="space-y-4 text-muted-foreground">
                <Link
                  to="/generate"
                  className="block hover:text-foreground transition-colors font-medium"
                >
                  AI Generator
                </Link>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Image Upscaler
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Background Remover
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Style Transfer
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  API Access
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Community</h4>
              <div className="space-y-4 text-muted-foreground">
                <Link
                  to="/community"
                  className="block hover:text-foreground transition-colors font-medium"
                >
                  Showcase Gallery
                </Link>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Discord Server
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Creator Hub
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Tutorials
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Creator Program
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Resources</h4>
              <div className="space-y-4 text-muted-foreground">
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Prompt Guide
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Best Practices
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Video Tutorials
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Blog
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Support</h4>
              <div className="space-y-4 text-muted-foreground">
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Help Center
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Contact Support
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  System Status
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="block hover:text-foreground transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-12">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
              <p className="text-muted-foreground text-lg">
                &copy; 2025 VisionAI. Made by Utkarsh Yadav.
              </p>

              <div className="flex flex-wrap justify-center gap-6">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Shield className="w-3 h-3 mr-1" />
                  SOC 2 Type II
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Globe className="w-3 h-3 mr-1" />
                  180+ Countries
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Clock className="w-3 h-3 mr-1" />
                  99.9% Uptime
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  4.9/5 Rating
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
