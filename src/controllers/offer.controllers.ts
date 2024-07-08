import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Offer } from "../models/offer/offer.model";
import {
  NewOfferRequestbody,
  SearchOfferQuery,
  offerBaseQuery,
} from "../types/types";
import ErrorHandler from "../utils/errorHandler";


//api to create new offer
export const addNewOffer = asyncErrorHandler(
  async (req: Request<{}, {}, NewOfferRequestbody>, res, next) => {

    const { offerCouponCode, offerCouponDiscount, offerExpiry } = req.body;

    if (!offerCouponCode || !offerCouponDiscount || !offerExpiry) {
      return res.status(400).json({ error: "Please provide offer details." });
    }

    const offer = await Offer.create({
      offerCouponCode,
      offerCouponDiscount,
      offerExpiry,
    });

    return res.status(201).json({
      success: true,
      offer,
    });
  }

);



//api to update existing offer
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
      offer,
    });
  }

);

//api to list all the available offers
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
      return res.status(404).json("no offer found.");
    }

    return res.status(200).json({ success: true, offer });
  }
);



//api to delete offer
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