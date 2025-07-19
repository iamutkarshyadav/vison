import { z } from "zod";

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address").max(254);
export const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long");
export const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long");
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Sanitize input strings
export const sanitizeString = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
};

// Sanitize prompt for image generation
export const sanitizePrompt = (prompt: string): string => {
    return prompt
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
};

// Validate and sanitize image generation request
export const imageGenerationSchema = z.object({
    prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt too long"),
    negativePrompt: z.string().max(500, "Negative prompt too long").optional(),
    style: z.enum([
        "Photorealistic",
        "Artistic",
        "Fantasy",
        "Sci-Fi",
        "Anime",
        "Cartoon",
        "Abstract",
        "Vintage",
        "Minimalist",
        "Cyberpunk"
    ]),
    width: z.number().min(256).max(4096),
    height: z.number().min(256).max(4096),
    seed: z.number().optional(),
    model: z.string().default("flux"),
    aspectRatio: z.string()
});

// Validate user registration
export const userRegistrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema
});

// Validate user login
export const userLoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required")
});

// Validate payment session creation
export const paymentSessionSchema = z.object({
    packageId: z.string().min(1, "Package ID is required")
});

// Validate comment creation
export const commentSchema = z.object({
    imageId: objectIdSchema,
    content: z.string().min(1, "Comment content is required").max(500, "Comment too long")
});

// Validate like toggle
export const likeToggleSchema = z.object({
    imageId: objectIdSchema
});

// Validate image sharing
export const imageSharingSchema = z.object({
    imageId: objectIdSchema,
    prompt: z.string().min(1, "Prompt is required"),
    style: z.string().min(1, "Style is required"),
    tags: z.array(z.string().max(50)).max(10).optional()
});

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
    LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 15 minutes, 5 attempts
    REGISTER: { windowMs: 60 * 60 * 1000, max: 3 }, // 1 hour, 3 attempts
    IMAGE_GENERATION: { windowMs: 60 * 1000, max: 10 }, // 1 minute, 10 generations
    API_GENERAL: { windowMs: 15 * 60 * 1000, max: 100 } // 15 minutes, 100 requests
} as const;

// Validation middleware
export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
    return (req: any, res: any, next: any) => {
        try {
            const validatedData = schema.parse(req.body);
            req.validatedData = validatedData;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
}; 