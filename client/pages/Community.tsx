import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Heart,
  Share,
  Download,
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  Star,
  Eye,
  MessageCircle,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { aiService } from "@/lib/ai-service";
import { toast } from "sonner";

const filters = [
  "All",
  "Trending",
  "Recent",
  "Top Rated",
  "Fantasy",
  "Realistic",
  "Abstract",
  "Sci-Fi",
];

export default function Community() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showcaseImages, setShowcaseImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [trendingPrompts, setTrendingPrompts] = useState<string[]>([]);
  const [imageComments, setImageComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load community images from API
  useEffect(() => {
    const loadCommunityImages = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          filter: activeFilter.toLowerCase(),
          search: searchTerm,
          limit: "20",
          offset: "0",
          sortBy: "recent", // Always show recent first to see newly shared images
        });

        const response = await fetch(`/api/community/images?${params}`);
        const data = await response.json();

        if (data.success && data.data.images) {
          let images = data.data.images;

          // Load user likes status if user is logged in
          if (user) {
            try {
              const token = localStorage.getItem("visionai_token");
              const imageIds = images.map((img: any) => img.id);

              const likesResponse = await fetch("/api/community/user-likes", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ imageIds }),
              });

              if (likesResponse.ok) {
                const likesData = await likesResponse.json();
                if (likesData.success) {
                  const likedImageIds = likesData.data.likedImageIds;
                  images = images.map((img: any) => ({
                    ...img,
                    isLiked: likedImageIds.includes(img.id),
                  }));
                }
              }
            } catch (error) {
              console.error("Failed to load like status:", error);
            }
          }

          setShowcaseImages(images);
        } else {
          console.error("Failed to load community images:", data.message);
          setShowcaseImages([]);
        }
      } catch (error) {
        console.error("Failed to load community images:", error);
        setShowcaseImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunityImages();
  }, [activeFilter, searchTerm]);

  // Load trending prompts from API
  useEffect(() => {
    const loadTrendingPrompts = async () => {
      try {
        const response = await fetch("/api/trending/prompts");
        const data = await response.json();

        if (data.success && data.data.prompts) {
          setTrendingPrompts(data.data.prompts.map((p: any) => p.text));
        } else {
          setTrendingPrompts([]);
        }
      } catch (error) {
        console.error("Failed to load trending prompts:", error);
        setTrendingPrompts([]);
      }
    };

    loadTrendingPrompts();
  }, []);

  const filteredImages = showcaseImages.filter((image) => {
    const matchesSearch = image.prompt
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Trending" && Math.random() > 0.5) ||
      (activeFilter === "Recent" &&
        new Date(image.timestamp) > new Date(Date.now() - 86400000 * 3)) ||
      (activeFilter === "Top Rated" && Math.random() > 0.3) ||
      image.style.toLowerCase().includes(activeFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  const handleImageClick = async (image: any) => {
    setSelectedImage({
      ...image,
      stats: {
        likes: image.stats?.likes || 0,
        views: image.stats?.views || 0,
        comments: image.stats?.comments || 0,
        downloads: image.stats?.downloads || 0,
      },
      isLiked: image.isLiked || false,
    });
    setImageDialogOpen(true);

    // Load comments for this image
    await loadImageComments(image.id);
  };

  const loadImageComments = async (imageId: string) => {
    setLoadingComments(true);
    setImageComments([]);

    try {
      const response = await fetch(`/api/community/comments/${imageId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setImageComments(data.data.comments || []);
        }
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!selectedImage || !user) {
      toast.error("Please sign in to like images");
      return;
    }

    setIsLiking(true);
    try {
      const result = await aiService.toggleImageLike(selectedImage.id);
      if (result.success) {
        // Update selected image
        const updatedSelectedImage = {
          ...selectedImage,
          isLiked: result.isLiked,
          stats: {
            ...selectedImage.stats,
            likes: result.likeCount,
          },
        };
        setSelectedImage(updatedSelectedImage);

        // Update image in the showcase list
        setShowcaseImages((prevImages) =>
          prevImages.map((img) =>
            img.id === selectedImage.id
              ? {
                  ...img,
                  isLiked: result.isLiked,
                  stats: { ...img.stats, likes: result.likeCount },
                }
              : img,
          ),
        );

        toast.success(result.isLiked ? "Image liked!" : "Like removed");
      }
    } catch (error) {
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!selectedImage || !user || !commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (commentText.trim().length > 500) {
      toast.error("Comment is too long (max 500 characters)");
      return;
    }

    setIsCommenting(true);
    try {
      const success = await aiService.addComment(
        selectedImage.id,
        commentText.trim(),
      );
      if (success) {
        setCommentText("");
        setSelectedImage({
          ...selectedImage,
          stats: {
            ...selectedImage.stats,
            comments: selectedImage.stats.comments + 1,
          },
        });
        // Reload comments to show the new one
        await loadImageComments(selectedImage.id);
        toast.success("Comment added successfully!");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add comment";

      if (errorMessage.includes("Authentication required")) {
        toast.error("Please sign in to comment");
        navigate("/login");
      } else if (errorMessage.includes("not found")) {
        toast.error("Image not found in community");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCommenting(false);
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

  const handleDownload = async () => {
    if (!selectedImage) return;

    try {
      // Fetch the image as blob to ensure proper download
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `visionai-community-${selectedImage.id}.jpg`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Image downloaded successfully!");

      // Update download count
      setSelectedImage((prev) =>
        prev
          ? {
              ...prev,
              stats: { ...prev.stats, downloads: prev.stats.downloads + 1 },
            }
          : null,
      );
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

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
            {user ? (
              <>
                <Link to="/dashboard">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
                  >
                    Join Community
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-br from-background to-gradient-start/5">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-gradient-start to-gradient-end text-white border-0">
            <TrendingUp className="w-3 h-3 mr-1" />
            Community Showcase
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover Amazing{" "}
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              AI Creations
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore thousands of stunning AI-generated images created by our
            global community of artists and creators.
          </p>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 px-4 border-b border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className="whitespace-nowrap"
                >
                  {filter}
                </Button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Prompts */}
      <section className="py-8 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">
              Try These{" "}
              <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                Trending Prompts
              </span>
            </h3>
            <p className="text-muted-foreground">
              Popular prompts from our community this week
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {trendingPrompts.slice(0, 8).map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleTrendingPromptClick(prompt)}
              >
                {prompt}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image, index) => (
              <Card
                key={image.id}
                className="group overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleImageClick(image)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(image);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            toast.error("Please sign in to like images");
                            return;
                          }
                          // Handle quick like
                        }}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.share) {
                            navigator.share({
                              title: "Amazing AI Art",
                              text: image.prompt,
                              url: image.url,
                            });
                          } else {
                            navigator.clipboard.writeText(image.url);
                            toast.success("Image URL copied to clipboard");
                          }
                        }}
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const response = await fetch(image.url);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `visionai-${image.id}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            toast.success("Image downloaded");
                          } catch (error) {
                            toast.error("Failed to download image");
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Creator Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="secondary"
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        {image.style}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Creation Date */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(image.timestamp).toLocaleDateString()}
                      </span>
                      {image.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-muted-foreground">
                            {image.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Prompt */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      "{image.prompt}"
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{image.stats?.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{image.stats?.views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{image.stats?.comments || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{image.stats?.downloads || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No images found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          )}

          {/* Load More */}
          {filteredImages.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Images
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Image Detail Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>Community Creation</DialogTitle>
                <DialogDescription>
                  {selectedImage.creator?.name &&
                    `by ${selectedImage.creator.name}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="aspect-square w-full rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Prompt</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    "{selectedImage.prompt}"
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Heart
                        className={`w-4 h-4 ${selectedImage.isLiked ? "fill-red-500 text-red-500" : ""}`}
                      />
                      <span>{selectedImage.stats.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedImage.stats.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{selectedImage.stats.comments}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="w-4 h-4" />
                      <span>{selectedImage.stats.downloads}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{selectedImage.style}</Badge>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    disabled={isLiking || !user}
                    className={
                      selectedImage.isLiked ? "text-red-500 border-red-500" : ""
                    }
                  >
                    {isLiking ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Heart
                        className={`w-4 h-4 mr-2 ${selectedImage.isLiked ? "fill-current" : ""}`}
                      />
                    )}
                    {selectedImage.isLiked ? "Liked" : "Like"}
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleTrendingPromptClick(selectedImage.prompt)
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Try This Prompt
                  </Button>
                </div>

                {user && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Add a comment</h5>
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        onClick={handleComment}
                        disabled={isCommenting || !commentText.trim()}
                        size="sm"
                      >
                        {isCommenting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Post"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Sign in to like and comment on images
                    </p>
                    <Button size="sm" onClick={() => navigate("/login")}>
                      Sign In
                    </Button>
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-4">
                    Comments ({selectedImage?.stats?.comments || 0})
                  </h5>

                  {loadingComments ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading comments...
                      </span>
                    </div>
                  ) : imageComments.length > 0 ? (
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {imageComments.map((comment, index) => (
                        <div
                          key={comment.id || index}
                          className="flex space-x-3"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback>
                              {comment.userName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium">
                                {comment.userName || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  comment.timestamp,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
