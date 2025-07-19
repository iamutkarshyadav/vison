import mongoose, { Schema, Document, Types } from "mongoose";

export interface IImage extends Document {
  _id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  dimensions: {
    width: number;
    height: number;
  };
  seed?: number;
  model: string;
  generationParams: {
    aspectRatio: string;
    enhanceQuality: boolean;
    noWatermark: boolean;
  };
  creator: Types.ObjectId;
  isSharedToCommunity: boolean;
  communityData?: {
    sharedAt: Date;
    tags: string[];
    description?: string;
    featured: boolean;
  };
  stats: {
    likes: number;
    views: number;
    comments: number;
    downloads: number;
    shares: number;
  };
  metadata: {
    fileSize?: number;
    mimeType: string;
    generationTime: number;
    cost: number; // Credits used
  };
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    url: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    negativePrompt: {
      type: String,
      maxlength: 500,
    },
    style: {
      type: String,
      required: true,
      enum: [
        "Photorealistic",
        "Artistic",
        "Fantasy",
        "Sci-Fi",
        "Anime",
        "Cartoon",
        "Abstract",
        "Vintage",
        "Minimalist",
        "Cyberpunk",
      ],
    },
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    seed: {
      type: Number,
    },
    model: {
      type: String,
      default: "flux",
    },
    generationParams: {
      aspectRatio: { type: String, required: true },
      enhanceQuality: { type: Boolean, default: true },
      noWatermark: { type: Boolean, default: true },
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isSharedToCommunity: {
      type: Boolean,
      default: false,
      index: true,
    },
    communityData: {
      sharedAt: { type: Date },
      tags: [{ type: String, maxlength: 50 }],
      description: { type: String, maxlength: 200 },
      featured: { type: Boolean, default: false },
    },
    stats: {
      likes: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    metadata: {
      fileSize: { type: Number },
      mimeType: { type: String, default: "image/jpeg" },
      generationTime: { type: Number, required: true },
      cost: { type: Number, required: true, default: 1 },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for performance
imageSchema.index({ creator: 1, createdAt: -1 });
imageSchema.index({ isSharedToCommunity: 1, "communityData.sharedAt": -1 });
imageSchema.index({ "stats.likes": -1 });
imageSchema.index({ "communityData.tags": 1 });
imageSchema.index({ style: 1 });
imageSchema.index({ prompt: "text" });

// Compound indexes
imageSchema.index({ isSharedToCommunity: 1, isActive: 1, "stats.likes": -1 });
imageSchema.index({ creator: 1, isActive: 1, createdAt: -1 });

export const Image =
  mongoose.models.Image || mongoose.model<IImage>("Image", imageSchema);
