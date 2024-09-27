import mongoose, { Schema } from "mongoose";


export interface CouponDocument extends Document {
  offerExpiry: Date;
  offerCouponDiscount: number;
  // Other fields
}


export const OfferSchema = new Schema(
  {
    offerIsActive: {
      type: Boolean,
      default: true
    },
    offerStartDate: {
      type: String,
      default: Date.now()
    },
    offerEndDate: {
      type: String,
      required: true
    },


    offerCouponCode: {
      type: String,
      required: true

    },
    offerDiscountCategory: [
      {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }
    ],
    offerDiscountState: [
      {
        type: String
      }
    ],
    offerLimit: {
      minLimit: {
        type: String,
        required: true
      },
      maxLimit: {
        type: String,
        required: true
      }
    },
    offerCouponType: {
      enum: ["freeshipping", "percentage", "fixedamount"],
      type: String,
      required: true

    },
    offerDiscountValue: {
      type: String,
      required: true

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
