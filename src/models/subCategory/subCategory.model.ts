import mongoose, { Schema } from "mongoose";

const subCategorySchema = new Schema({
  subCategoryName: {
    type: String,
    required: [true, "Please provide subCategory name"],
    unique: true,
  },
  subCategoryDescription: {
    type: String,
   
  },
});

export const subCategory =
  mongoose.models.subCategory || mongoose.model("subCategory", subCategorySchema);
