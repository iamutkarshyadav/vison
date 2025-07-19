import mongoose, { Document, Schema } from "mongoose";

export interface IFollow extends Document {
  follower: mongoose.Types.ObjectId; // User who is following
  following: mongoose.Types.ObjectId; // User being followed
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const followSchema = new Schema<IFollow>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (this: IFollow, value: mongoose.Types.ObjectId) {
          return !this.following || !value.equals(this.following);
        },
        message: "Users cannot follow themselves"
      }
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (this: IFollow, value: mongoose.Types.ObjectId) {
          return !this.follower || !value.equals(this.follower);
        },
        message: "Users cannot follow themselves"
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate follows and improve query performance
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for getting followers of a user
followSchema.index({ following: 1, isActive: 1 });

// Index for getting users a user is following
followSchema.index({ follower: 1, isActive: 1 });

// Remove the pre-save hook since we have schema-level validation
// followSchema.pre("save", function (next) {
//   if (this.follower.equals(this.following)) {
//     const error = new Error("Users cannot follow themselves");
//     return next(error);
//   }
//   next();
// });

// Static method to get follower count
followSchema.statics.getFollowerCount = function (
  userId: mongoose.Types.ObjectId,
) {
  return this.countDocuments({
    following: userId,
    isActive: true,
  });
};

// Static method to get following count
followSchema.statics.getFollowingCount = function (
  userId: mongoose.Types.ObjectId,
) {
  return this.countDocuments({
    follower: userId,
    isActive: true,
  });
};

// Static method to check if user A follows user B
followSchema.statics.isFollowing = function (
  followerId: mongoose.Types.ObjectId,
  followingId: mongoose.Types.ObjectId,
) {
  return this.exists({
    follower: followerId,
    following: followingId,
    isActive: true,
  });
};

export const Follow = mongoose.model<IFollow>("Follow", followSchema);
