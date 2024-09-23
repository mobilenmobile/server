import mongoose, { Schema } from "mongoose";
import { Category } from "../category/category.model";

const brandSchema = new Schema({
  brandName: {
    type: String,
    required: [true, "Please provide brand name"],
  },
  brandImgUrl: {
    type: String,
    default: ''
  },
  brandLogoUrl: {
    type: String,
    default: ''
  },
  categories: [{
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  models: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model'
  }]
});

brandSchema.pre('save', async function (next) {
  if (this.isNew) {
    const categories = this.categories;
    this.categories = await Promise.all(categories.map(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error(`Category not found: ${categoryId}`);
      }
      return categoryId;
    }));
  }
  next();
});

export const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);