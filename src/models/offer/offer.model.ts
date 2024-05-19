import mongoose, { Schema } from "mongoose";

const OfferSchema = new Schema(
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
  },
  {
    timestamps: true,
  }
);

export const Offer =
  mongoose.models.offer || mongoose.model("offer", OfferSchema);
