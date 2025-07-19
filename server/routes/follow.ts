import { RequestHandler, Router } from "express";
import { Follow } from "../models/Follow";
import { User } from "../models/User";
import { AuthRequest, authMiddleware } from "../utils/auth";
import connectToDatabase from "../database/connection";
import mongoose from "mongoose";

const router = Router();

export const toggleFollow: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID required",
      });
    }

    // Convert to ObjectId
    const followingId = new mongoose.Types.ObjectId(userId);
    const followerId = req.user._id;

    // Prevent self-following
    if (followerId.equals(followingId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    let isFollowing = false;
    let followerCount = 0;

    if (existingFollow) {
      // Toggle the follow status
      existingFollow.isActive = !existingFollow.isActive;
      await existingFollow.save();
      isFollowing = existingFollow.isActive;
    } else {
      // Create new follow relationship
      await Follow.create({
        follower: followerId,
        following: followingId,
        isActive: true,
      });
      isFollowing = true;
    }

    // Get updated follower count
    followerCount = await Follow.countDocuments({
      following: followingId,
      isActive: true,
    });

    // Update user stats
    await User.findByIdAndUpdate(followingId, {
      "stats.followers": followerCount,
    });

    res.json({
      success: true,
      isFollowing,
      followerCount,
      message: isFollowing
        ? "User followed successfully"
        : "User unfollowed successfully",
    });
  } catch (error) {
    console.error("Toggle follow error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update follow status",
    });
  }
};

export const getFollowers: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID required",
      });
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const offsetNum = parseInt(offset as string) || 0;

    const followers = await Follow.find({
      following: userId,
      isActive: true,
    })
      .populate("follower", "name avatar email joinedAt stats")
      .sort({ createdAt: -1 })
      .skip(offsetNum)
      .limit(limitNum);

    const total = await Follow.countDocuments({
      following: userId,
      isActive: true,
    });

    const formattedFollowers = followers.map((follow) => ({
      id: (follow.follower as any)._id,
      name: (follow.follower as any).name,
      avatar: (follow.follower as any).avatar,
      email: (follow.follower as any).email,
      joinedAt: (follow.follower as any).joinedAt,
      stats: (follow.follower as any).stats,
      followedAt: follow.createdAt,
    }));

    res.json({
      success: true,
      data: {
        followers: formattedFollowers,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch followers",
    });
  }
};

export const getFollowing: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID required",
      });
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const offsetNum = parseInt(offset as string) || 0;

    const following = await Follow.find({
      follower: userId,
      isActive: true,
    })
      .populate("following", "name avatar email joinedAt stats")
      .sort({ createdAt: -1 })
      .skip(offsetNum)
      .limit(limitNum);

    const total = await Follow.countDocuments({
      follower: userId,
      isActive: true,
    });

    const formattedFollowing = following.map((follow) => ({
      id: (follow.following as any)._id,
      name: (follow.following as any).name,
      avatar: (follow.following as any).avatar,
      email: (follow.following as any).email,
      joinedAt: (follow.following as any).joinedAt,
      stats: (follow.following as any).stats,
      followedAt: follow.createdAt,
    }));

    res.json({
      success: true,
      data: {
        following: formattedFollowing,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch following",
    });
  }
};

export const getFollowStatus: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: "User IDs array required",
      });
    }

    // Validate all user IDs
    const validUserIds = userIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (validUserIds.length === 0) {
      return res.json({
        success: true,
        data: { followStatus: {} },
      });
    }

    // Get follow status for all users
    const follows = await Follow.find({
      follower: req.user._id,
      following: { $in: validUserIds },
      isActive: true,
    });

    const followStatus: { [key: string]: boolean } = {};
    validUserIds.forEach((userId) => {
      followStatus[userId] = follows.some((follow) =>
        follow.following.equals(userId),
      );
    });

    res.json({
      success: true,
      data: { followStatus },
    });
  } catch (error) {
    console.error("Get follow status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get follow status",
    });
  }
};

// Route definitions
router.post("/toggle", authMiddleware, toggleFollow);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.post("/status", authMiddleware, getFollowStatus);

export default router;
