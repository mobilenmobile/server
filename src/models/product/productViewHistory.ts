import mongoose, { Schema, Document } from "mongoose";

// Interface for TypeScript type safety
export interface IProductViewHistory extends Document {
    product_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId | null; // Track logged-in users
    category_id: mongoose.Types.ObjectId;
    subcategory_id: mongoose.Types.ObjectId | null;
    total_views: number;
    first_viewed_at: Date;
    last_viewed_at: Date;
}

// Schema definition
const ProductViewHistorySchema = new Schema<IProductViewHistory>(
    {
        product_id: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null, // If user is not logged in, store as null
            index: true, // Helps in tracking user-based views
        },
        category_id: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true, // Helps speed up category-based queries
        },
        subcategory_id: {
            type: Schema.Types.ObjectId,
            ref: "SubCategory",
            default: null,
            index: true, // Helps speed up subcategory-based queries
        },
        total_views: {
            type: Number,
            required: true,
            default: 0,
            min: 0, // Ensures views are non-negative
        },
        first_viewed_at: {
            type: Date,
            required: true,
            default: Date.now,
        },
        last_viewed_at: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Model export
const ProductViewHistory = mongoose.model<IProductViewHistory>("ProductViewHistory", ProductViewHistorySchema);
export default ProductViewHistory;
