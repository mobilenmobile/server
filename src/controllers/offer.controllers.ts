import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Offer } from "../models/offer/offer.model";
import {
  NewOfferRequestbody,
  SearchOfferQuery,
  offerBaseQuery,
} from "../types/types";

export const addNewOffer = asyncErrorHandler(
  async (req: Request<{}, {}, NewOfferRequestbody>, res, next) => {
    const { offerCouponCode,  offerCouponDiscount, offerExpiry } = req.body;

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

export const searchAllOffer = asyncErrorHandler(
  async (req: Request<{}, {}, SearchOfferQuery>, res, next) => {
    const { offercode, offerdescription } = req.query;

    const baseQuery: offerBaseQuery = {};

    if (offercode) {
      if (typeof offercode !== "string") {
        return;
      }
      baseQuery.offerCode = {
        $regex: offercode,
        $options: "i",
      };
    }

    if (offerdescription) {
      if (typeof offerdescription !== "string") {
        return;
      }
      baseQuery.offerDescription = {
        $regex: offerdescription,
        $options: "i",
      };
    }
    const offer = await Offer.find(baseQuery);

    if (!offer) {
      return res.status(404).json("no offer found.");
    }

    return res.status(200).json({ success: true, offer });
  }
);
