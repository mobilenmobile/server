import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Offer } from "../models/offer/offer.model";
import {
  NewOfferRequestbody,
  SearchOfferQuery,
} from "../types/types";
import ErrorHandler from "../utils/errorHandler";


//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.addNewOffer
// 2.updateOffer
// 3.searchAllOffer
// 4.deleteOffer

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------------


//-------------------api to create new offer-----------------------------------------
export const addNewOffer = asyncErrorHandler(
  async (req: Request<{}, {}, NewOfferRequestbody>, res, next) => {

    const { offerCouponCode, offerCouponDiscount, offerExpiry } = req.body;

    if (!offerCouponCode || !offerCouponDiscount || !offerExpiry) {
      return next(new ErrorHandler("please provide all fields", 400));
    }

    const offer = await Offer.create({
      offerCouponCode,
      offerCouponDiscount,
      offerExpiry,
    });

    return res.status(201).json({
      success: true,
      message:"Offer created successfully",
      offer,
    });
  }

);

//----------------api to update existing offer--------------------------------------------
export const updateOffer = asyncErrorHandler(
  async (req: Request<{}, {}, NewOfferRequestbody>, res, next) => {
    const id = (req.params as { id: string }).id;

    const { offerCouponCode, offerCouponDiscount, offerExpiry } = req.body;

    const offer = await Offer.findById(id);

    if (!offer) {
      return next(new ErrorHandler("offer not found  ", 404));
    }
    if (offerCouponCode) offer.offerCouponCode = offerCouponCode
    if (offerCouponDiscount) offer.offerCouponDiscount = offerCouponDiscount
    if (offerExpiry) offer.offerExpiry = offerExpiry

    await offer.save()

    return res.status(201).json({
      success: true,
      message: "Offer updated successfully",
      offer,
    });
  }

);

//------------------api to list all the available offers-------------------------------
export const searchAllOffer = asyncErrorHandler(
  async (req: Request<{}, {}, SearchOfferQuery>, res, next) => {

    // const { offercode, offerdescription } = req.query;
    // const baseQuery: offerBaseQuery = {};

    // if (offercode) {
    //   if (typeof offercode !== "string") {
    //     return;
    //   }
    //   baseQuery.offerCode = {
    //     $regex: offercode,
    //     $options: "i",
    //   };
    // }

    // if (offerdescription) {
    //   if (typeof offerdescription !== "string") {
    //     return;
    //   }
    //   baseQuery.offerDescription = {
    //     $regex: offerdescription,
    //     $options: "i",
    //   };
    // }
    // Get current date
    const currentDate = new Date();
    const offer = await Offer.find();
    console.log(offer)
    if (!offer) {
      return next(new ErrorHandler("Offer not found", 404));
    }

    return res.status(200).json({ 
      success: true, 
      message: "Offer found successfully",
      offer 
    });
  }
);

//-------------------api to delete offer-----------------------------------------------

export const deleteOffer = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const offer = await Offer.findById(id);
  if (!offer) {
    return next(new ErrorHandler("offer not found", 404));
  }
  await offer.deleteOne();
  return res.status(200).json({
    success: true,
    message: "offer Deleted Successfully",
  });
});