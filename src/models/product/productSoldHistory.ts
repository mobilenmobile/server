import mongoose, { Document, Schema } from "mongoose";

// Define TypeScript interface for Sold Control
export interface IProductSoldHistory extends Document {
    order_id: mongoose.Types.ObjectId;
    product_id: mongoose.Types.ObjectId;
    variant_id: string;
    user_id: mongoose.Types.ObjectId;
    coupon_used_id: string;
    coin_used: number;
    amount_at_which_prod_listed:number;
    amount_at_which_prod_sold: number;
    discount_applied: number;
    payment_method: "online" | "COD";
    category_id: mongoose.Types.ObjectId;
    subcategory_id: mongoose.Types.ObjectId | null;
    sold_at: Date;
}

// Define Mongoose Schema for Sold Control
const ProductSoldHistorySchema = new Schema<IProductSoldHistory>(
    {
        order_id: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true, // Helps track sales per order
        },
        product_id: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        variant_id: {
            type: String,
            default: ""
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, // Helps in tracking user purchases
        },
        coupon_used_id: {
            type: String,
            index: true, // Optimized for counting coupon usage
        },
        coin_used: {
            type: Number,
            default: 0,
            min: 0, // Ensures coin usage is non-negative
        },
        amount_at_which_prod_sold: {
            type: Number,
            required: true,
            min: 0, // Sale price should not be negative
        },
        discount_applied: {
            type: Number,
            default: 0,
            min: 0, // Ensures discount is non-negative
        },
        payment_method: {
            type: String,
            enum: ["Card", "UPI", "COD", "Wallet", "Net Banking"],
            required: true,
        },
        category_id: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },
        subcategory_id: {
            type: Schema.Types.ObjectId,
            ref: "SubCategory",
            default: null,
            index: true,
        },
        sold_at: {
            type: Date,
            required: true,
            default: Date.now,
            index: true, // Optimized for date-based sales tracking
        },
    },
    { timestamps: true }
);

// Export the model
export default mongoose.model<IProductSoldHistory>("ProductSoldHistory", ProductSoldHistorySchema);
