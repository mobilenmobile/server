import mongoose, { Schema } from "mongoose";


export interface CouponDocument extends Document {
  offerExpiry: Date;
  offerCouponDiscount: number;
  // Other fields
}


 export const OfferSchema = new Schema(
  {
    offerCouponCode: {
      type: String,
    },
    offerCouponDiscount: {
      type: String,
    },
    offerExpiry: {
      type: String,
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

export const Offer =
  mongoose.models.offer || mongoose.model("offer", OfferSchema);
