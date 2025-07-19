import { RequestHandler, Router } from "express";
import { User } from "../models/User";
import {
  generateToken,
  validateEmail,
  validatePassword,
  AuthRequest,
} from "../utils/auth";
import connectToDatabase from "../database/connection";
import { authMiddleware } from "../utils/auth";

const router = Router();

// Improved rate limiting with cleanup
interface RateLimitEntry {
  count: number;
  lastReset: number;
  lastAccess: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.lastAccess > CLEANUP_INTERVAL) {
      rateLimitMap.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

const checkRateLimit = (clientIP: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIP);

  if (!entry) {
    rateLimitMap.set(clientIP, { count: 1, lastReset: now, lastAccess: now });
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Update last access
  entry.lastAccess = now;

  // Reset counter if window has expired
  if (now - entry.lastReset > RATE_LIMIT_WINDOW) {
    entry.count = 1;
    entry.lastReset = now;
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Check if limit exceeded
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - entry.count };
};

export const register: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();

    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 50 characters",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name: name.trim(),
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();

    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";

    // Rate limiting check
    const { allowed, remaining } = checkRateLimit(clientIP);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Please try again in ${Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - rateLimitMap.get(clientIP)?.lastReset || 0)) / 1000)} seconds.`,
      });
    }

    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid input format",
      });
    }

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and password cannot be empty",
      });
    }

    if (trimmedEmail.length > 254 || trimmedPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Email or password too long",
      });
    }

    if (!validateEmail(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Find user with timeout protection
    const user = (await Promise.race([
      User.findOne({
        email: trimmedEmail.toLowerCase(),
        isActive: true,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 5000),
      ),
    ])) as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password with error handling
    let isPasswordValid = false;
    try {
      isPasswordValid = await user.comparePassword(trimmedPassword);
    } catch (passwordError) {
      console.error("Password comparison error:", passwordError);
      return res.status(500).json({
        success: false,
        message: "Authentication error. Please try again.",
      });
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Remove password from response
    const userResponse = user.toJSON();

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

export const getProfile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get fresh user data with updated stats
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    await connectToDatabase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { name, preferences } = req.body;

    const updateData: any = {};

    if (name) {
      if (name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 50 characters",
        });
      }
      updateData.name = name.trim();
    }

    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences,
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const refreshToken: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Generate new token
    const token = generateToken(req.user._id.toString(), req.user.email);

    res.json({
      success: true,
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Route definitions
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/refresh", authMiddleware, refreshToken);

export default router;
