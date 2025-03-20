import mongoose, { Schema } from "mongoose";

const subCategorySchema = new Schema({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "product category is required"],
  },
  subCategoryName: {
    type: String,
    required: [true, "Please provide subCategory name"],
    unique: true,
  },
});

export const subCategory =
  mongoose.models.subCategory || mongoose.model("subCategory", subCategorySchema);
