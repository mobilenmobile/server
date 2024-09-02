import mongoose, { Schema } from "mongoose";

const brandSchema = new Schema({
  brandName: {
    type: String,
    required: [true, "Please provide brand name"],
  },
  brandImgUrl: {
    type: String,
    // required: [true, "Please provide category name"],
    // unique: true,
    default: ''
  },
  brandLogoUrl: {
    type: String,
    // required: [true, "Please provide category name"],
    // unique: true,
    default: ''
  },
  category: { required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  models: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Model' }]
});

// Compound unique index on category and name
brandSchema.index({ brandName: 1, category: 1 }, { unique: true });

export const Brand =
  mongoose.models.brand || mongoose.model("Brand", brandSchema);
