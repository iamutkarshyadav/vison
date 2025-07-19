import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment extends Document {
  _id: string;
  content: string;
  image: Types.ObjectId;
  author: Types.ObjectId;
  parentComment?: Types.ObjectId; // For nested comments/replies
  likes: number;
  likedBy: Types.ObjectId[];
  isActive: boolean;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    image: {
      type: Schema.Types.ObjectId,
      ref: "Image",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
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

// Indexes
commentSchema.index({ image: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isActive: 1, likes: -1 });

export const Comment =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);
