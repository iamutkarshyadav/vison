// Application constants
export const APP_CONSTANTS = {
    // Database
    DB_NAME: process.env.DB_NAME || "visionai",
    DB_TIMEOUT: 5000,
    DB_MAX_POOL_SIZE: 10,
    DB_SOCKET_TIMEOUT: 45000,

    // Authentication
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 128,
    EMAIL_MAX_LENGTH: 254,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,

    // Rate Limiting
    RATE_LIMIT: {
        LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        LOGIN_MAX_ATTEMPTS: 5,
        REGISTER_WINDOW_MS: 60 * 60 * 1000, // 1 hour
        REGISTER_MAX_ATTEMPTS: 3,
        IMAGE_GENERATION_WINDOW_MS: 60 * 1000, // 1 minute
        IMAGE_GENERATION_MAX_ATTEMPTS: 10,
        API_GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        API_GENERAL_MAX_ATTEMPTS: 100,
        CLEANUP_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
    },

    // Image Generation
    IMAGE: {
        MIN_WIDTH: 256,
        MAX_WIDTH: 4096,
        MIN_HEIGHT: 256,
        MAX_HEIGHT: 4096,
        MAX_PROMPT_LENGTH: 1000,
        MAX_NEGATIVE_PROMPT_LENGTH: 500,
        CREDIT_COST: 1,
        DEFAULT_MODEL: "flux",
    },

    // Community
    COMMUNITY: {
        MAX_TAGS: 10,
        MAX_TAG_LENGTH: 50,
        MAX_COMMENT_LENGTH: 500,
        MAX_DESCRIPTION_LENGTH: 200,
    },

    // Pagination
    PAGINATION: {
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 50,
        DEFAULT_OFFSET: 0,
    },

    // File Upload
    UPLOAD: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
    },

    // Security
    SECURITY: {
        BCRYPT_SALT_ROUNDS: 12,
        SESSION_EXPIRY_HOURS: 24,
    },

    // User
    USER: {
        DEFAULT_CREDITS: 20,
        DEFAULT_PLAN: "free" as const,
    },
} as const;

// Environment-specific constants
export const ENV_CONSTANTS = {
    IS_PRODUCTION: process.env.NODE_ENV === "production",
    IS_DEVELOPMENT: process.env.NODE_ENV === "development",
    IS_TEST: process.env.NODE_ENV === "test",

    // URLs
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:8080",
    FALLBACK_CLIENT_URL: process.env.FALLBACK_CLIENT_URL || "http://localhost:8080",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [],

    // Database
    MONGODB_URI: process.env.MONGODB_URI || "",

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || "",

    // Server
    PORT: process.env.PORT || 3000,
} as const;

// Error messages
export const ERROR_MESSAGES = {
    // Authentication
    AUTH: {
        INVALID_CREDENTIALS: "Invalid email or password",
        TOKEN_REQUIRED: "Access denied. No token provided.",
        TOKEN_INVALID: "Invalid token.",
        USER_NOT_FOUND: "User not found",
        USER_INACTIVE: "User account is inactive",
        EMAIL_EXISTS: "User with this email already exists",
        WEAK_PASSWORD: "Password must be at least 6 characters long",
        INVALID_EMAIL: "Please provide a valid email address",
    },

    // Database
    DATABASE: {
        CONNECTION_FAILED: "Database connection failed",
        NOT_AVAILABLE: "Database not available. Running in demo mode.",
        TIMEOUT: "Database operation timed out",
    },

    // Image Generation
    IMAGE: {
        INSUFFICIENT_CREDITS: "Insufficient credits. Please purchase more credits.",
        GENERATION_FAILED: "Failed to generate image",
        INVALID_PROMPT: "Prompt is required and must be less than 1000 characters",
        INVALID_DIMENSIONS: "Invalid image dimensions",
    },

    // Payment
    PAYMENT: {
        STRIPE_NOT_CONFIGURED: "Stripe is not configured",
        SESSION_CREATION_FAILED: "Failed to create payment session",
        PAYMENT_NOT_FOUND: "Payment not found",
        PAYMENT_NOT_COMPLETED: "Payment not completed",
    },

    // Community
    COMMUNITY: {
        IMAGE_NOT_FOUND: "Image not found in community",
        ALREADY_SHARED: "Image is already shared to community",
        COMMENT_TOO_LONG: "Comment content must be between 1 and 500 characters",
    },

    // General
    GENERAL: {
        VALIDATION_FAILED: "Validation failed",
        INTERNAL_ERROR: "Internal server error",
        NOT_FOUND: "Resource not found",
        UNAUTHORIZED: "Unauthorized access",
        FORBIDDEN: "Access forbidden",
        RATE_LIMITED: "Too many requests. Please try again later.",
    },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
    AUTH: {
        LOGIN_SUCCESS: "Login successful",
        REGISTER_SUCCESS: "User registered successfully",
        PROFILE_UPDATED: "Profile updated successfully",
    },
    IMAGE: {
        GENERATED: "Image generated successfully",
        DELETED: "Image deleted successfully",
    },
    COMMUNITY: {
        SHARED: "Image shared to community successfully",
        COMMENT_ADDED: "Comment added successfully",
    },
    PAYMENT: {
        SESSION_CREATED: "Payment session created successfully",
        PROCESSED: "Payment processed successfully",
    },
} as const; 