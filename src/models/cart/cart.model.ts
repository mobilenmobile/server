import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: [true, "user id is required"],
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: [true, "product id is required"],
        },
        selectedVarianceId: {
            type: String,
        },
        quantity: {
            type: Number,
            default: 1,
            max: 10,
            min: 1
        }
    },
    {
        timestamps: true,
    }
);

export const cart = mongoose.models.cart || mongoose.model("cart", cartSchema);