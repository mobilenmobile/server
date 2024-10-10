import mongoose, { Document, Schema } from "mongoose";
import { Category } from "../category/category.model";

interface ICategory {
  _id: string;
  categoryName: string;
}

interface IBrand extends Document {
  brandName: string;
  branKeywords: string[];
  brandImgUrl: string;
  brandLogoUrl: string;
  categories: ICategory['_id'][];
  createdAt: Date;
  models: mongoose.Types.ObjectId[];
}

const brandSchema = new Schema<IBrand>({
  brandName: {
    type: String,
    required: [true, "Please provide brand name"],
    unique: true,  // Ensure brand name is unique
    set: (value: string) => value.trim().toLowerCase() // Always save in lowercase and trim whitespaces
  },
  branKeywords: [
    {
      type: String
    }],
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

// Ensure categories are valid and exist
brandSchema.pre<IBrand>('save', async function (next) {
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

export const Brand = mongoose.models.Brand || mongoose.model<IBrand>("Brand", brandSchema);
