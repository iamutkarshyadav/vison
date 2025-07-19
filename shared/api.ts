/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Community and sharing interfaces
 */
export interface CommunityImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  style: string;
  dimensions: { width: number; height: number };
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  stats: {
    likes: number;
    views: number;
    comments: number;
    downloads: number;
  };
  isLiked?: boolean;
  tags: string[];
}

export interface ImageComment {
  id: string;
  imageId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
}

export interface ShareImageRequest {
  imageId: string;
  prompt: string;
  style: string;
  tags?: string[];
}

export interface ShareImageResponse {
  success: boolean;
  communityImageId?: string;
  message: string;
}

export interface LikeImageRequest {
  imageId: string;
}

export interface LikeImageResponse {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
}

export interface AddCommentRequest {
  imageId: string;
  content: string;
}

export interface AddCommentResponse {
  success: boolean;
  comment?: ImageComment;
  message: string;
}

/**
 * Payment interfaces
 */
export interface CreatePaymentSessionRequest {
  planId: string;
  userId: string;
  amount: number;
  credits: number;
  planName: string;
}

export interface CreatePaymentSessionResponse {
  success: boolean;
  sessionId: string;
  url: string;
  message: string;
}

export interface PaymentSuccessRequest {
  sessionId: string;
  userId: string;
  planId: string;
  credits: number;
}

export interface PaymentSuccessResponse {
  success: boolean;
  creditsAdded: number;
  newBalance: number;
}

/**
 * Trending prompts interface
 */
export interface TrendingPromptsResponse {
  prompts: Array<{
    text: string;
    category: string;
    popularity: number;
    imagePreview?: string;
  }>;
}
