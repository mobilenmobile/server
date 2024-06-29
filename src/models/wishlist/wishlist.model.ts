// _id: product._id,
// productTitle: product.productTitle,
// product: product,
// selectedVariance: product.productVariance[0],

import mongoose, { Schema } from "mongoose";

const wishlistSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: [true, "user id required"],
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: [true, "product id is required"],
        },
        selectedVarianceId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Wishlist = mongoose.models.wishlist || mongoose.model("wishlist", wishlistSchema);
