import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    reviewuser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    reviewproduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },
    reviewImgGallery: [],
    reviewRating: {
      type: String,
    },
    reviewDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Review =
  mongoose.models.review || mongoose.model("review", reviewSchema);
