import mongoose, { Schema } from "mongoose";

const brandSchema = new Schema({
  brandName: {
    type: String,
    required: [true, "Please provide category name"],
    unique: true,
  },
  brandImgUrl: {
    type: String,
    required: [true, "Please provide category name"],
    unique: true,
  },
  brandLogoUrl: {
    type: String,
    required: [true, "Please provide category name"],
    unique: true,
  },
});

export const Brand =
  mongoose.models.brand || mongoose.model("Brand", brandSchema);
