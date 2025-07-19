import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  credits: number;
  plan: "free" | "pro" | "premium";
  joinedAt: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  isActive: boolean;
  preferences: {
    emailNotifications: boolean;
    communityVisible: boolean;
    defaultStyle: string;
  };
  stats: {
    imagesGenerated: number;
    creditsUsed: number;
    communityLikes: number;
    followers: number;
    following: number;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: function () {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.email}`;
      },
    },
    credits: {
      type: Number,
      default: 20, // New users get 20 free credits
      min: 0,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      communityVisible: { type: Boolean, default: true },
      defaultStyle: { type: String, default: "Artistic" },
    },
    stats: {
      imagesGenerated: { type: Number, default: 0 },
      creditsUsed: { type: Number, default: 0 },
      communityLikes: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Additional indexes for performance (email index is already created by unique: true)
userSchema.index({ createdAt: -1 });
userSchema.index({ "stats.imagesGenerated": -1 });

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
