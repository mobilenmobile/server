import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    productTitle: {
      type: String,
      required: [true, "product name is required"],
    },
    productModel: {
      type: String,
      required: [true, "product model is required"],
    },
    productBoxPrice: {
      type: String,
      required: [true, "product box price is required"],
    },
    productSellingPrice: {
      type: String,
    },
    productBadge: {
      type: String,
    },
    productOfferProvided: {
      type: String,
    },
    productDescription: {
      type: String,
    },
    productUniqueId: {
      type: String,
      required: [true, "Provide product unique id"],
      unique: true,
    },

    productCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "product category is required"],
    },

    productBrand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "product brand is required"],
    },
    productStock: {
      type: String,
      required: [true, "product stock is required"],
    },
    productColor: {
      type: String,
      required: [true, "product colors is required."],
    },

    productImages: {
      type: [String],
      required: [true, "product images is required."],
    },
    productDiscountPercentage: {
      type: String,
    },
    productRAM: {
      type: [String],
    },
    productStorage: {
      type: [String],
    },
    productHeadsetType: {
      type: String,
    },
    productSkinPattern: {
      type: String,
    },
    productThumbnail: {
      type: String,
      required: [true, "product thumbnail is required."],
    },
  },
  {
    timestamps: true,
  }
);

const Product =
  mongoose.models.product || mongoose.model("product", productSchema);

export { Product };
