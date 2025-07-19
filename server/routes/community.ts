import { RequestHandler, Router } from "express";
import {
  ShareImageRequest,
  ShareImageResponse,
  LikeImageRequest,
  LikeImageResponse,
  AddCommentRequest,
  AddCommentResponse,
} from "@shared/api";
import { Image } from "../models/Image";
import { Comment } from "../models/Comment";
import { Like } from "../models/Like";
import { User } from "../models/User";
import { authMiddleware, optionalAuthMiddleware } from "../utils/auth";
import connectToDatabase from "../database/connection";
import mongoose from "mongoose";

const router = Router();

export const shareImage: RequestHandler = async (req: any, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { imageId, prompt, style, tags = [] } = req.body as ShareImageRequest;

    if (!imageId || !prompt || !style) {
      return res.status(400).json({
        success: false,
        message: "Missing required image data",
      });
    }

    // Find the image in user's generated images
    const image = await Image.findOne({
      _id: imageId,
      creator: req.user._id,
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found or not owned by user",
      });
    }

    if (image.isSharedToCommunity) {
      return res.status(400).json({
        success: false,
        message: "Image is already shared to community",
      });
    }

    // Update image to share to community
    image.isSharedToCommunity = true;
    image.communityData = {
      sharedAt: new Date(),
      tags: tags.slice(0, 10), // Limit to 10 tags
      featured: false,
    };

    await image.save();

    const response: ShareImageResponse = {
      success: true,
      communityImageId: image._id.toString(),
      message: "Image shared to community successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Image sharing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to share image to community",
    });
  }
};

export const toggleLike: RequestHandler = async (req: any, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { imageId } = req.body as LikeImageRequest;

    if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid image ID required",
      });
    }

    // Check if image exists and is shared to community
    const image = await Image.findOne({
      _id: imageId,
      isSharedToCommunity: true,
      isActive: true,
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found in community",
      });
    }

    // Check if user already liked this image
    const existingLike = await Like.findOne({
      user: req.user._id,
      image: imageId,
    });

    let isLiked: boolean;
    let likeCount: number;

    if (existingLike) {
      // Unlike the image
      await Like.deleteOne({ _id: existingLike._id });
      image.stats.likes = Math.max(0, image.stats.likes - 1);
      isLiked = false;
    } else {
      // Like the image
      await Like.create({
        user: req.user._id,
        image: imageId,
      });
      image.stats.likes += 1;
      isLiked = true;

      // Update creator's community likes count
      await User.findByIdAndUpdate(image.creator, {
        $inc: { "stats.communityLikes": 1 },
      });
    }

    await image.save();
    likeCount = image.stats.likes;

    const response: LikeImageResponse = {
      success: true,
      isLiked,
      likeCount,
    };

    res.json(response);
  } catch (error) {
    console.error("Like toggle error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
    });
  }
};

export const addComment: RequestHandler = async (req: any, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { imageId, content } = req.body as AddCommentRequest;

    if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid image ID required",
      });
    }

    if (!content?.trim() || content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment content must be between 1 and 500 characters",
      });
    }

    // Check if image exists and is shared to community
    const image = await Image.findOne({
      _id: imageId,
      isSharedToCommunity: true,
      isActive: true,
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found in community",
      });
    }

    // Create comment
    const comment = await Comment.create({
      content: content.trim(),
      image: imageId,
      author: req.user._id,
    });

    // Update image comment count
    image.stats.comments += 1;
    await image.save();

    // Populate comment with author data
    await comment.populate("author", "name avatar");

    const response: AddCommentResponse = {
      success: true,
      comment: {
        id: comment._id.toString(),
        imageId: comment.image.toString(),
        userId: comment.author._id.toString(),
        userName: (comment.author as any).name,
        userAvatar: (comment.author as any).avatar,
        content: comment.content,
        timestamp: comment.createdAt,
        likes: comment.likes,
        isLiked: false,
      },
      message: "Comment added successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};

export const getCommunityImages: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();

    const {
      filter = "all",
      search = "",
      limit = 20,
      offset = 0,
      sortBy = "recent",
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const offsetNum = parseInt(offset as string) || 0;

    // Build query
    const query: any = {
      isSharedToCommunity: true,
      isActive: true,
    };

    // Apply search filter
    if (search) {
      const searchTerm = search as string;
      query.$or = [
        { prompt: { $regex: searchTerm, $options: "i" } },
        { "communityData.tags": { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Apply category filter
    if (filter !== "all") {
      switch (filter) {
        case "trending":
          query["stats.likes"] = { $gte: 5 };
          break;
        case "recent":
          query["communityData.sharedAt"] = {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          };
          break;
        case "top_rated":
          query["stats.likes"] = { $gte: 10 };
          break;
        default:
          query.style = { $regex: filter as string, $options: "i" };
      }
    }

    // Build sort
    let sortOptions: any = {};
    switch (sortBy) {
      case "recent":
        sortOptions = { "communityData.sharedAt": -1 };
        break;
      case "popular":
        sortOptions = { "stats.likes": -1, "stats.views": -1 };
        break;
      case "trending":
        // Trending algorithm: likes + views with time decay
        sortOptions = { "stats.likes": -1, "communityData.sharedAt": -1 };
        break;
      default:
        sortOptions = { "communityData.sharedAt": -1 };
    }

    const images = await Image.find(query)
      .populate("creator", "name avatar")
      .sort(sortOptions)
      .skip(offsetNum)
      .limit(limitNum)
      .lean();

    const total = await Image.countDocuments(query);

    // Format images for frontend
    const formattedImages = images.map((image: any) => ({
      id: image._id.toString(),
      url: image.url,
      prompt: image.prompt,
      timestamp: image.communityData?.sharedAt || image.createdAt,
      style: image.style,
      dimensions: image.dimensions,
      creator: {
        id: image.creator._id.toString(),
        name: image.creator.name,
        avatar: image.creator.avatar,
      },
      stats: image.stats,
      tags: image.communityData?.tags || [],
      isLiked: false, // Will be determined per user in frontend
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
    console.error("Get community images error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch community images",
    });
  }
};

export const getImageComments: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();

    const { imageId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid image ID required",
      });
    }

    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const offsetNum = parseInt(offset as string) || 0;

    const comments = await Comment.find({
      image: imageId,
      isActive: true,
    })
      .populate("author", "name avatar")
      .sort({ createdAt: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .lean();

    const total = await Comment.countDocuments({
      image: imageId,
      isActive: true,
    });

    const formattedComments = comments.map((comment: any) => ({
      id: comment._id.toString(),
      imageId: comment.image.toString(),
      userId: comment.author._id.toString(),
      userName: comment.author.name,
      userAvatar: comment.author.avatar,
      content: comment.content,
      timestamp: comment.createdAt,
      likes: comment.likes,
      isLiked: false, // Will be determined per user in frontend
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
    }));

    res.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
};

// Get user's liked images to determine like status
export const getUserLikes: RequestHandler = async (req: any, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { imageIds } = req.body;

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: "Image IDs array required",
      });
    }

    const likes = await Like.find({
      user: req.user._id,
      image: { $in: imageIds },
    }).select("image");

    const likedImageIds = likes.map((like) => like.image.toString());

    res.json({
      success: true,
      data: {
        likedImageIds,
      },
    });
  } catch (error) {
    console.error("Get user likes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user likes",
    });
  }
};

// Route definitions
router.post("/share", authMiddleware, shareImage);
router.post("/like", authMiddleware, toggleLike);
router.post("/comment", authMiddleware, addComment);
router.get("/images", optionalAuthMiddleware, getCommunityImages);
router.get("/comments/:imageId", getImageComments);
router.post("/user-likes", authMiddleware, getUserLikes);

export default router;
