import { Request, Response, NextFunction } from 'express';

import ErrorHandler from '../utils/errorHandler';
import { asyncErrorHandler } from '../middleware/error.middleware';
import { OfferStripe } from '../models/offerStripeModel';


export const createOrUpdateOfferStripe = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { offerAuthUserStripe, offerUnauthUserStripe } = req.body;

  if (
    (!offerAuthUserStripe || !offerAuthUserStripe.length) &&
    (!offerUnauthUserStripe || !offerUnauthUserStripe.length)
  ) {
    return next(new ErrorHandler("offerAuthUserStripe and offerUnauthUserStripe cannot both be empty", 400));
  }

  let offerStripeDoc = await OfferStripe.findOne();

  if (offerStripeDoc) {
    if (offerAuthUserStripe) {
      offerStripeDoc.offerAuthUserStripe = offerAuthUserStripe;
    }
    if (offerUnauthUserStripe) {
      offerStripeDoc.offerUnauthUserStripe = offerUnauthUserStripe;
    }
    await offerStripeDoc.save();
  } else {
    offerStripeDoc = new OfferStripe({ offerAuthUserStripe, offerUnauthUserStripe });
    await offerStripeDoc.save();
  }

  return res.status(200).json({
    success: true,
    message: "OfferStripe updated successfully",
    offerStripe: {
      offerAuthUserStripe: offerStripeDoc.offerAuthUserStripe,
      offerUnauthUserStripe: offerStripeDoc.offerUnauthUserStripe
    }
  });
});


export const getOfferStripe = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    const offerStripeDoc = await OfferStripe.findOne();
  
    if (!offerStripeDoc) {
      return next(new ErrorHandler("OfferStripe data not found", 404));
    }
  
    return res.status(200).json({
      success: true,
      offerStripe: {
        offerAuthUserStripe: offerStripeDoc.offerAuthUserStripe,
        offerUnauthUserStripe: offerStripeDoc.offerUnauthUserStripe
      }
    });
  });
  

export const deleteOfferStripe = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { offerId } = req.params;
  const offer = await OfferStripe.findById(offerId);

  if (!offer) {
    return next(new ErrorHandler("OfferStripe not found", 404));
  }

  await offer.deleteOne();

  return res.status(200).json({
    success: true,
    message: "OfferStripe Deleted Successfully",
  });
});
