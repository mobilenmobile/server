import mongoose, { Schema, Document } from "mongoose";
import { Brand } from "../brand/brand.model";  // Import Brand model
import { Category } from "../category/category.model";  // Import Category model

interface IModel extends Document {
  modelName: string;
  category: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  createdAt: Date;
}

const modelSchema = new Schema<IModel>({
  modelName: {
    type: String,
    required: true,
    trim: true,
    set: (value: string) => value.trim().toLowerCase() // Trim and lowercase modelName
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to validate brand and category existence
modelSchema.pre<IModel>('save', async function (next) {
  // Check if the referenced brand exists
  const brandExists = await Brand.findById(this.brand);
  if (!brandExists) {
    throw new Error(`Brand not found: ${this.brand}`);
  }

  // Check if the referenced category exists
  const categoryExists = await Category.findById(this.category);
  if (!categoryExists) {
    throw new Error(`Category not found: ${this.category}`);
  }

  next();
});

export const Model = mongoose.models.Model || mongoose.model<IModel>("Model", modelSchema);
