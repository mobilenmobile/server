import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema({
  categoryName: {
    type: String,
    required: [true, "Please provide category name"],
    unique: true,
  },
  categoryImgUrl: {
    type: String,
  },
  categoryDescription: {
    type: String,
    // required: [true, "Please provide category images"],
  },
  brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }]
});

export const Category =
  mongoose.models.category || mongoose.model("Category", CategorySchema);

