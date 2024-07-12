import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    reviewUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },
    reviewImgGallery: [String],
    reviewRating: {
      type: Number,
    },
    reviewDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.models.review || mongoose.model("Review", reviewSchema);
