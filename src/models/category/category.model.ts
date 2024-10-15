import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema({
  categoryName: {
    type: String,
    required: [true, "Please provide category name"],
    unique: true,
  },
  redeemedCoin: {
    type: String,
    default: "0"
  },
  categoryKeywords: [
    {
      type: String
    }],
  categoryImgUrl: {
    type: String,
  },
  categoryDescription: {
    type: String,
    // required: [true, "Please provide category images"],
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }]
});

export const Category =
  mongoose.models.category || mongoose.model("Category", CategorySchema);

