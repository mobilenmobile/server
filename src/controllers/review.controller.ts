import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Address } from "../models/address/address.model.js";
import { Review } from "../models/review/review.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";


export const newReview = asyncErrorHandler(

    async (req: Request, res, next) => {
        console.log(req.body)
        const id = (req.params as { id: string }).id;

        if (!id) {
            return next(new ErrorHandler("no id present", 400));
        }

        const {
            reviewImgGallery,
            reviewRating,
            reviewDescription
        } = req.body;

        console.log(req.body)

        if (!reviewDescription || !reviewImgGallery || !reviewRating) {
            return next(new ErrorHandler("Please Enter all Fields", 400));
        }
        if (!req.user._id) {
            return next(new ErrorHandler("unauthenticated", 400));
        }

        const newAddress = await Review.create({
            reviewUser: req.user._id,
            reviewProduct: id,
            reviewImgGallery: JSON.parse(reviewImgGallery),
            reviewRating,
            reviewDescription
        });
        return res.status(201).json({
            success: true,
            message: "Review created successfully",
            newAddress,
        });
    }
);


export const updateReview = asyncErrorHandler(
    async (req: Request, res, next) => {

        const id = (req.params as { id: string }).id;

        if (!id) {
            return next(new ErrorHandler("no id present", 400));
        }
        const {
            reviewProduct,
            reviewImgGallery,
            reviewRating,
            reviewDescription
        } = req.body;

        console.log("req-body-", req.body);

        const review = await Review.findById(id);

        if (!review) {
            return next(new ErrorHandler("No Review Found", 404));
        }

        if (reviewProduct) review.reviewProduct = reviewProduct
        if (reviewRating) review.reviewRating = reviewRating
        if (reviewDescription) review.reviewDescription = reviewDescription
        if (reviewImgGallery) review.reviewImgGallery = JSON.parse(reviewImgGallery)

        const updatedReview = await review.save();

        return res.status(200).json({
            success: true,
            message: "Review Updated Successfully",
            updatedReview,
        });
    }
);

export const allReviews = asyncErrorHandler(async (req, res, next) => {

    const id = (req.params as { id: string }).id;

    if (!id) {
        return next(new ErrorHandler("incorrect product id", 400));
    }
    const allReviews = await Review.find({ reviewProduct: id })
    if (!req.user._id) {
        return next(new ErrorHandler("unauthenticated", 400));
    }

    return res.status(200).json({
        success: true,
        allReviews,
    });
});


export const deleteReview = asyncErrorHandler(async (req, res, next) => {

    const { id } = req.params;
    const review = await Address.findById(id);

    if (!review) {
        return next(new ErrorHandler("review not found", 404));
    }

    await review.deleteOne();
    return res.status(200).json({
        success: true,
        message: "Review Deleted Successfully",
    });

});