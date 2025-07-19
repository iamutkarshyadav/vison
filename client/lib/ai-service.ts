import { retryWithBackoff, getNetworkErrorMessage } from "./network-utils";

export interface GenerationParams {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  model?: string;
  quality?: "standard" | "hd" | "2k";
  removeWatermark?: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  style: string;
  dimensions: {
    width: number;
    height: number;
  };
  isSharedToCommunity?: boolean;
  communityImageId?: string;
}

class AIImageService {
  private baseUrl = "https://image.pollinations.ai/prompt";

  async generateImage(params: GenerationParams): Promise<GeneratedImage> {
    const {
      prompt,
      width = 2048, // Default to 2K quality
      height = 2048,
      seed,
      model = "flux",
      quality = "2k",
      removeWatermark = true,
    } = params;

    try {
      // Try regular API endpoint first with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("visionai_token")}`,
        },
        body: JSON.stringify({
          prompt,
          style: this.inferStyle(prompt),
          width,
          height,
          seed,
          model,
          aspectRatio: this.calculateAspectRatio(width, height),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If database is unavailable, try demo endpoint
      if (response.status === 503) {
        const demoController = new AbortController();
        const demoTimeoutId = setTimeout(() => demoController.abort(), 30000);

        response = await fetch("/api/images/generate-demo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            style: this.inferStyle(prompt),
            width,
            height,
            seed,
            model,
            aspectRatio: this.calculateAspectRatio(width, height),
          }),
          signal: demoController.signal,
        });

        clearTimeout(demoTimeoutId);
      }

      // Handle error responses
      if (!response.ok) {
        let errorMessage = "Failed to generate image";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If response can't be parsed as JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response format from server");
      }

      if (!result.success) {
        throw new Error(result.message || "Image generation failed");
      }

      // Return the generated image data
      return {
        id: result.data.id,
        url: result.data.url,
        prompt: result.data.prompt,
        timestamp: new Date(result.data.timestamp),
        style: result.data.style,
        dimensions: result.data.dimensions,
        isSharedToCommunity: result.data.isSharedToCommunity,
      };
    } catch (error) {
      console.error("Image generation error:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request timed out. Please try again.");
        }
        throw error;
      }

      throw new Error("Unknown error occurred during image generation");
    }
  }

  private calculateAspectRatio(width: number, height: number): string {
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return "1:1";
    if (Math.abs(ratio - 1.5) < 0.1) return "3:2";
    if (Math.abs(ratio - 0.67) < 0.1) return "2:3";
    if (Math.abs(ratio - 1.78) < 0.1) return "16:9";
    return "1:1";
  }

  private inferStyle(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    if (
      lowerPrompt.includes("photorealistic") ||
      lowerPrompt.includes("realistic") ||
      lowerPrompt.includes("photograph")
    ) {
      return "Photorealistic"; // Fixed: was "Realistic"
    } else if (lowerPrompt.includes("anime") || lowerPrompt.includes("manga")) {
      return "Anime";
    } else if (
      lowerPrompt.includes("cartoon") ||
      lowerPrompt.includes("animated")
    ) {
      return "Cartoon";
    } else if (
      lowerPrompt.includes("abstract") ||
      lowerPrompt.includes("geometric")
    ) {
      return "Abstract";
    } else if (
      lowerPrompt.includes("cyberpunk") ||
      lowerPrompt.includes("futuristic") ||
      lowerPrompt.includes("sci-fi")
    ) {
      return "Sci-Fi";
    } else if (
      lowerPrompt.includes("fantasy") ||
      lowerPrompt.includes("magical") ||
      lowerPrompt.includes("dragon")
    ) {
      return "Fantasy";
    } else if (
      lowerPrompt.includes("vintage") ||
      lowerPrompt.includes("retro") ||
      lowerPrompt.includes("classic")
    ) {
      return "Vintage";
    } else if (
      lowerPrompt.includes("minimalist") ||
      lowerPrompt.includes("simple")
    ) {
      return "Minimalist";
    } else if (lowerPrompt.includes("cyberpunk")) {
      return "Cyberpunk";
    } else {
      return "Artistic";
    }
  }

  // Get pre-generated showcase images
  getShowcaseImages(): GeneratedImage[] {
    const showcasePrompts = [
      "A majestic cyberpunk samurai warrior standing in neon-lit Tokyo street at night with glowing katana",
      "Ethereal fantasy forest with glowing mushrooms and magical creatures, moonlight filtering through ancient trees",
      "Abstract geometric architecture with impossible structures floating in colorful void space",
      "Vintage botanical illustration of exotic flowers with scientific annotations, watercolor style",
      "Photorealistic portrait of a wise old wizard with flowing beard and mystical glowing eyes",
      "Futuristic spaceship hovering over alien planet with purple sky and twin moons",
      "Cute anime girl with colorful hair sitting in flower field, studio ghibli style",
      "Steampunk mechanical dragon with brass gears and steam, flying over Victorian city",
      "Minimalist mountain landscape at sunrise with reflection in calm lake, pastel colors",
      "Digital art of underwater city with coral reefs and swimming dolphins, bioluminescent",
    ];

    return showcasePrompts.map((prompt, index) => ({
      id: `showcase_${index}`,
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&model=flux&enhance=true&seed=${index * 12345}`,
      prompt,
      timestamp: new Date(Date.now() - index * 86400000), // Spread over last 10 days
      style: this.inferStyle(prompt),
      dimensions: { width: 512, height: 512 },
    }));
  }

  // Get trending prompts
  getTrendingPrompts(): string[] {
    return [
      "Cyberpunk samurai in neon Tokyo",
      "Magical forest with glowing creatures",
      "Abstract futuristic architecture",
      "Vintage botanical watercolor",
      "Wise wizard portrait",
      "Alien planet landscape",
      "Cute anime character",
      "Steampunk dragon",
      "Minimalist mountain sunset",
      "Underwater crystal city",
    ];
  }

  // Simulate user stats (in real app, this would come from backend)
  getUserStats() {
    // Return default stats - should be replaced by real API data
    return {
      imagesGenerated: 0,
      creditsUsed: 0,
      communityLikes: 0,
      followers: 0,
    };
  }

  // Share generated image to community
  async shareImageToCommunity(
    image: GeneratedImage,
    tags: string[] = [],
  ): Promise<boolean> {
    const makeRequest = async (): Promise<boolean> => {
      const token = localStorage.getItem("visionai_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch("/api/community/share", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageId: image.id,
            prompt: image.prompt,
            style: image.style,
            tags,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = "Failed to share image";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If we can't parse error response, use status-based message
            if (response.status === 401) {
              errorMessage = "Authentication required";
            } else if (response.status === 404) {
              errorMessage = "Image not found";
            } else if (response.status >= 500) {
              errorMessage = "Server error. Please try again later.";
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result.success;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    try {
      return await retryWithBackoff(makeRequest, 2, 1000);
    } catch (error) {
      console.error("Error sharing image:", error);

      // Use network utility for better error messages
      const errorMessage = getNetworkErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  // Like/unlike community image
  async toggleImageLike(
    imageId: string,
  ): Promise<{ success: boolean; isLiked: boolean; likeCount: number }> {
    try {
      const token = localStorage.getItem("visionai_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/community/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to toggle like");
      }

      return await response.json();
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  // Add comment to community image
  async addComment(imageId: string, content: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("visionai_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/community/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageId, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add comment");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }
}

export const aiService = new AIImageService();
