import { RequestHandler, Router } from "express";
import { Image } from "../models/Image";
import { User } from "../models/User";
import { AuthRequest, authMiddleware, optionalAuthMiddleware } from "../utils/auth";
import { sanitizePrompt, imageGenerationSchema } from "../utils/validation";
import connectToDatabase from "../database/connection";
import mongoose from "mongoose";

const router = Router();

export interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  style: string;
  width: number;
  height: number;
  seed?: number;
  model?: string;
  aspectRatio: string;
}

export interface GenerateImageResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    prompt: string;
    style: string;
    dimensions: { width: number; height: number };
    timestamp: Date;
    isSharedToCommunity: boolean;
  };
  message: string;
}

export const generateImage: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate and sanitize input
    const validationResult = imageGenerationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: validationResult.error.errors
      });
    }

    const {
      prompt,
      negativePrompt,
      style,
      width,
      height,
      seed,
      model = "flux",
      aspectRatio,
    } = validationResult.data;

    // Sanitize prompt
    const cleanPrompt = sanitizePrompt(prompt);
    const cleanNegativePrompt = negativePrompt ? sanitizePrompt(negativePrompt) : undefined;

    // Check user credits
    if (req.user.credits < 1) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits. Please purchase more credits.",
      });
    }

    const startTime = Date.now();

    // Generate image URL (using Pollinations AI with 2K quality)
    const encodedPrompt = encodeURIComponent(cleanPrompt);

    // Use higher quality settings for 2K images
    const finalWidth = Math.max(width, 1024); // Minimum 1K
    const finalHeight = Math.max(height, 1024);

    // Build URL with parameters for high quality without watermarks
    const url = new URL(
      "https://image.pollinations.ai/prompt/" + encodedPrompt,
    );
    url.searchParams.set("width", finalWidth.toString());
    url.searchParams.set("height", finalHeight.toString());
    url.searchParams.set("model", model);
    url.searchParams.set("enhance", "true");
    url.searchParams.set("nologo", "true"); // Remove watermarks
    url.searchParams.set("quality", "high"); // High quality setting
    url.searchParams.set("upscale", "true"); // Enable upscaling
    url.searchParams.set("refine", "true"); // Enable refinement

    if (seed) {
      url.searchParams.set("seed", seed.toString());
    } else {
      // Generate random seed for uniqueness
      url.searchParams.set(
        "seed",
        Math.floor(Math.random() * 1000000).toString(),
      );
    }

    const generationTime = Date.now() - startTime;

    // Create image record in database
    const image = new Image({
      url: url.toString(),
      prompt: cleanPrompt,
      negativePrompt: cleanNegativePrompt,
      style,
      dimensions: { width, height },
      seed: seed || parseInt(url.searchParams.get("seed") || "0"),
      model,
      generationParams: {
        aspectRatio,
        enhanceQuality: true,
        noWatermark: true,
      },
      creator: req.user._id,
      metadata: {
        generationTime,
        cost: 1, // 1 credit per generation
        mimeType: "image/jpeg",
      },
    });

    await image.save();

    // Deduct credit from user and update stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        credits: -1,
        "stats.imagesGenerated": 1,
        "stats.creditsUsed": 1,
      },
    });

    const response: GenerateImageResponse = {
      success: true,
      data: {
        id: image._id.toString(),
        url: image.url,
        prompt: image.prompt,
        style: image.style,
        dimensions: image.dimensions,
        timestamp: image.createdAt,
        isSharedToCommunity: image.isSharedToCommunity,
      },
      message: "Image generated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Image generation error:", error);

    // Handle specific error types
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid image data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const getUserImages: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { limit = 20, offset = 0, sharedOnly = false } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const offsetNum = parseInt(offset as string) || 0;

    const query: any = {
      creator: req.user._id,
      isActive: true,
    };

    if (sharedOnly === "true") {
      query.isSharedToCommunity = true;
    }

    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .lean();

    const total = await Image.countDocuments(query);

    const formattedImages = images.map((image: any) => ({
      id: image._id.toString(),
      url: image.url,
      prompt: image.prompt,
      style: image.style,
      dimensions: image.dimensions,
      timestamp: image.createdAt,
      isSharedToCommunity: image.isSharedToCommunity,
      communityImageId: image.isSharedToCommunity ? image._id.toString() : null,
    }));

    res.json({
      success: true,
      data: {
        images: formattedImages,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("Get user images error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user images",
    });
  }
};

export const getImageDetails: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    await connectToDatabase();

    const { imageId } = req.params;

    if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid image ID required",
      });
    }

    const image = await Image.findOne({
      _id: imageId,
      isActive: true,
    }).populate("creator", "name avatar");

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Check if user can access this image
    const isOwner =
      req.user && image.creator._id.toString() === req.user._id.toString();
    const isPublic = image.isSharedToCommunity;

    if (!isOwner && !isPublic) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Increment view count if viewing someone else's image
    if (!isOwner && isPublic) {
      image.stats.views += 1;
      await image.save();
    }

    res.json({
      success: true,
      data: {
        id: image._id.toString(),
        url: image.url,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        style: image.style,
        dimensions: image.dimensions,
        seed: image.seed,
        model: image.model,
        generationParams: image.generationParams,
        creator: {
          id: (image.creator as any)._id.toString(),
          name: (image.creator as any).name,
          avatar: (image.creator as any).avatar,
        },
        isSharedToCommunity: image.isSharedToCommunity,
        communityData: image.communityData,
        stats: image.stats,
        metadata: image.metadata,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get image details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch image details",
    });
  }
};

export const deleteImage: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { imageId } = req.params;

    if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid image ID required",
      });
    }

    const image = await Image.findOne({
      _id: imageId,
      creator: req.user._id,
      isActive: true,
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found or not owned by user",
      });
    }

    // Soft delete
    image.isActive = false;
    await image.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
};

export const getTrendingPrompts: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();

    // Get trending prompts based on popular community images
    const trendingImages = await Image.aggregate([
      {
        $match: {
          isSharedToCommunity: true,
          isActive: true,
          "stats.likes": { $gte: 3 },
        },
      },
      {
        $group: {
          _id: "$style",
          prompts: {
            $push: {
              prompt: "$prompt",
              likes: "$stats.likes",
              views: "$stats.views",
            },
          },
          totalLikes: { $sum: "$stats.likes" },
        },
      },
      {
        $sort: { totalLikes: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Extract trending prompts
    const trendingPrompts: Array<{
      text: string;
      category: string;
      popularity: number;
      imagePreview?: string;
    }> = [];

    trendingImages.forEach((styleGroup) => {
      const sortedPrompts = styleGroup.prompts.sort(
        (a: any, b: any) => b.likes + b.views * 0.1 - (a.likes + a.views * 0.1),
      );

      sortedPrompts.slice(0, 3).forEach((item: any) => {
        // Extract main subject from prompt for trending display
        const mainSubject = item.prompt
          .split(",")[0]
          .trim()
          .replace(/^(a |an |the )/i, "")
          .toLowerCase();

        if (mainSubject.length > 5 && mainSubject.length < 50) {
          trendingPrompts.push({
            text: mainSubject,
            category: styleGroup._id,
            popularity: item.likes + item.views * 0.1,
          });
        }
      });
    });

    // Sort by popularity and limit to top 12
    const finalTrending = trendingPrompts
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);

    // Add some default prompts if we don't have enough trending ones
    const defaultPrompts = [
      {
        text: "Cyberpunk samurai in neon Tokyo",
        category: "Sci-Fi",
        popularity: 100,
      },
      {
        text: "Magical forest with glowing creatures",
        category: "Fantasy",
        popularity: 95,
      },
      {
        text: "Abstract futuristic architecture",
        category: "Abstract",
        popularity: 90,
      },
      {
        text: "Vintage botanical watercolor",
        category: "Vintage",
        popularity: 85,
      },
      { text: "Wise wizard portrait", category: "Fantasy", popularity: 80 },
      { text: "Alien planet landscape", category: "Sci-Fi", popularity: 75 },
      { text: "Cute anime character", category: "Anime", popularity: 70 },
      { text: "Steampunk dragon", category: "Fantasy", popularity: 65 },
    ];

    if (finalTrending.length < 8) {
      const needed = 8 - finalTrending.length;
      finalTrending.push(...defaultPrompts.slice(0, needed));
    }

    res.json({
      success: true,
      data: {
        prompts: finalTrending,
      },
    });
  } catch (error) {
    console.error("Get trending prompts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending prompts",
    });
  }
};

// Route definitions
router.post("/generate", authMiddleware, generateImage);
router.get("/user", authMiddleware, getUserImages);
router.get("/:imageId", optionalAuthMiddleware, getImageDetails);
router.delete("/:imageId", authMiddleware, deleteImage);
router.get("/trending/prompts", getTrendingPrompts);

export default router;
