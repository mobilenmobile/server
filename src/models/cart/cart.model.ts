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


const deviceDetailsSchema = new Schema(
    {
        category: {
            type: String,
            required: true
        },
        brand: {
            type: String,
            required: true
        },
        model: {
            type: String,
            required: true
        }
    },
    { _id: false } // ✅ Prevents MongoDB from generating an _id for this subdocument
);

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
        selectedFreeProducts: {
            type: [Object],
            default: []
        },
        skinProductDetails: {
            type: skinProductDetails
        },
        deviceDetails: {
            type: deviceDetailsSchema, // ✅ Ensures `deviceDetails` follows the structured format without `_id`
        },
        quantity: {
            type: Number,
            default: 1,
            max: 10,
            min: 1
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
    }
);

export const cart = mongoose.models.cart || mongoose.model("cart", cartSchema);