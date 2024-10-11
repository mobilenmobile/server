import mongoose, { Schema, Document } from 'mongoose';

export interface OfferStripeDocument extends Document {
  offerAuthUserStripe: string[];
  offerUnauthUserStripe: string[];
}

const OfferStripeSchema = new Schema({
  offerAuthUserStripe: {
    type: [String],
    required: true,
    default: []
  },
  offerUnauthUserStripe: {
    type: [String],
    required: true,
    default: []
  }
}, {
  timestamps: true
});

export const OfferStripe = mongoose.models.OfferStripe || mongoose.model<OfferStripeDocument>('OfferStripe', OfferStripeSchema);
