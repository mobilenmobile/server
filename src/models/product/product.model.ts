import mongoose, { Schema } from "mongoose";


const productSchema = new Schema(
  {
    productTitle: {
      type: String,
    },
    productCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "product category is required"],
    },

    productBrand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "product brand is required"],
    },

    productModel: {
      type: String,
      required: [true, "product model is required"],
    },
    productOffer: {
      type: Object,
    },
    productDescription: {
      type: String,
    },
    productSkinPattern: {
      type: String,
    },
    productHeadsetType: {
      type: String,
    },
    productVariance: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const Product =
  mongoose.models.product || mongoose.model("product", productSchema);

export { Product };
