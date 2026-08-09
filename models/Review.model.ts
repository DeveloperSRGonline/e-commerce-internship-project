import mongoose, { Schema, Document, Model, Types } from "mongoose";
import "@/models/Product.model";
import "@/models/User.model";

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  {
    // Only track createdAt — reviews are never edited, so updatedAt is not needed
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes per database-schema.md § 5 & actionable.md § 1.9.2
ReviewSchema.index({ productId: 1, createdAt: -1 });
// Unique compound index: one user can only review a product once
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
