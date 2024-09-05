import mongoose, { Schema } from "mongoose";


const skinProductDetails = new Schema({

    _id: {
        type: String
    },
    category: {
        type: String
    },
    brand: {
        type: String
    },
    model: {
        type: String
    },
    uploadImgArr: {
        type: [String]
    }

})

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
        customSkin: {
            type: Boolean,
            default: false,
        },
        isCombo: {
            type: Boolean,
            default: false,
        },
        skinProductDetails: {
            type: skinProductDetails
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