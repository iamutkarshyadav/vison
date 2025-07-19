import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILike extends Document {
  _id: string;
  user: Types.ObjectId;
  image: Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Compound unique index to prevent duplicate likes
likeSchema.index({ user: 1, image: 1 }, { unique: true });

export const Like =
  mongoose.models.Like || mongoose.model<ILike>("Like", likeSchema);
