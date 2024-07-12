import mongoose, { Mongoose } from "mongoose";
import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Address } from "../models/address/address.model.js";
import { Product } from "../models/product/product.model.js";
import { Review } from "../models/review/review.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";


//api to create new review
export const newReview = asyncErrorHandler(

    async (req: Request, res, next) => {

        console.log(req.body)

        const id = (req.params as { id: string }).id;

        if (!id) {
            return next(new ErrorHandler("no id present", 400));
        }

        const product = await Product.findById(id);

        if (!product) {
            return next(new ErrorHandler("Product not found  ", 404));
        }

        const {
            productId,
            reviewImgGallery,
            reviewRating,
            reviewDescription
        } = req.body;



        console.log(req.body)

        // if (!reviewDescription) {
        //     return next(new ErrorHandler("Please Enter description", 400));
        // }

        if (!req.user._id) {
            return next(new ErrorHandler("unauthenticated", 400));
        }
        let review = await Review.findOne({ user: req.user._id, _id: id, productId: productId });

        console.log("----------existingitem---------", review)

        if (review) {
            if (reviewRating) review.reviewRating = reviewRating
            if (reviewDescription) review.reviewDescription = reviewRating
            if (reviewImgGallery) review.reviewImgGallery = JSON.parse(reviewImgGallery)
            await review.save()
        }

        if (!review) {
            review = await Review.create({
                reviewUser: req.user._id,
                reviewProduct: id,
                reviewImgGallery: JSON.parse(reviewImgGallery),
                reviewRating,
                reviewDescription
            });
        }
        await handleReviewChange(review._id, id, review.reviewRating)
        return res.status(201).json({
            success: true,
            message: "Review added successfully",
            review,
        });
    }
);


//api to update review
export const updateReview = asyncErrorHandler(
    async (req: Request, res, next) => {

        const id = (req.params as { id: string }).id;

        if (!id) {
            return next(new ErrorHandler("no id present", 400));
        }
        const {
            productId,
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
        if (JSON.parse(reviewImgGallery).length > 0) review.reviewImgGallery = JSON.parse(reviewImgGallery)

        const updatedReview = await review.save();
        console.log("product id is :-", id)
        await handleReviewChange(review._id, id, review.reviewRating)

        return res.status(200).json({
            success: true,
            message: "Review Updated Successfully",
            updatedReview,
        });

    }
);


//api to get all reviews
export const allReviews = asyncErrorHandler(async (req, res, next) => {

    const id = (req.params as { id: string }).id;

    if (!id) {
        return next(new ErrorHandler("incorrect product id", 400));
    }
    // const  = await Review.find({ reviewProduct: id }).populate('reviewUser')
    const allReviews = await Review.aggregate([
        {
            $match: {
                reviewProduct: new mongoose.Types.ObjectId(id)// Match reviews where reviewProduct equals paramsId
            }
        },
        {
            $lookup: {
                from: 'users', // Collection name for users
                localField: 'reviewUser',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                reviewProduct: 1,
                reviewImgGallery: 1,
                reviewRating: 1,
                reviewDescription: 1,
                updatedAt: 1,
                'user.name': 1,
                'user.email': 1
            }
        }
    ]);

    // console.log("Aggregated Reviews with User Details:", aggregatedReviews);
    // if (!req.user._id) {
    //     return next(new ErrorHandler("unauthenticated", 400));
    // }
    // Initialize variables for calculating averages and counts
    let totalRatings = 0;
    let ratingCount = 0;
    let reviewsCount = 0;
    let fiveStarCount = 0;
    let fourStarCount = 0;
    let threeStarCount = 0;
    let imageUrls: any[] = [];

    // Loop through each review
    allReviews.forEach(review => {
        // Extract image URLs
        imageUrls = imageUrls.concat(review.reviewImgGallery);

        // Calculate average rating
        ratingCount += review.reviewRating;
        totalRatings += review.reviewRating > 0 ? 1 : 0;
        reviewsCount += review.reviewDescription.length > 0 ? 1 : 0;

        // Count ratings
        switch (review.reviewRating) {
            case 5:
                fiveStarCount++;
                break;
            case 4:
                fourStarCount++;
                break;
            case 3:
                threeStarCount++;
                break;
            // Add cases for other ratings if needed
            default:
                break;
        }
    });

    // Calculate average rating
    const averageRating = ratingCount / allReviews.length;

    // Output the results
    console.log("Image URLs:", imageUrls);
    console.log("Average Rating:", averageRating);
    console.log("Number of 5-star ratings:", fiveStarCount);
    console.log("Number of 4-star ratings:", fourStarCount);
    console.log("Number of 3-star ratings:", threeStarCount);

    return res.status(200).json({
        success: true,
        totalRatings,
        averageRating,
        reviewsCount,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        imageUrls,
        allReviews,
    });
});


//api to delete review
export const deleteReview = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const review = await Address.findById(id);

    if (!review) {
        return next(new ErrorHandler("review not found", 404));
    }

    await review.deleteOne();
    await updateProductRating(review.productId);
    return res.status(200).json({
        success: true,
        message: "Review Deleted Successfully",
    });

});


// Function to calculate and update product rating based on reviews
async function updateProductRating(productId: string) {
    console.log("productid=> ", productId)
    const reviews = await Review.find({ reviewProduct: productId });

    try {
        const result = await Review.aggregate([
            {
                $match: { reviewProduct: new mongoose.Types.ObjectId(productId) }
            },

            {
                $group: {
                    _id: '$reviewProduct',
                    averageRating: { $avg: '$reviewRating' },
                    count: { $sum: 1 }
                }
            }

        ]);

        console.log("result==> ", result)
        if (result.length > 0) {
            const { averageRating, count } = result[0];
            console.log("avg and count ", averageRating, count)
            // Update product rating in Product collection
            const product = await Product.findById(productId);
            await Product.findByIdAndUpdate(productId, {
                productRating: averageRating,
                productNumReviews: count
            });

            console.log("product rating changed", product)

        } else {
            // If no reviews found, reset product rating
            await Product.findByIdAndUpdate(productId, {
                productRating: 0,
                productNumReviews: 0
            });
        }
    } catch (err) {
        console.error('Error updating product rating:', err);
    }
}






// Example usage: Call this function whenever a new review is added, updated, or deleted
// Assuming you have reviewId, productId, and rating available when a review is modified
async function handleReviewChange(reviewId: string, productId: string, rating: number) {
    try {
        // Update or create the review
        const review = await Review.findByIdAndUpdate(reviewId, { rating: rating }, { new: true });

        // Update the product rating based on the reviews
        console.log("-------reviewId------productId----------rating-----", reviewId, productId, rating)
        await updateProductRating(productId);

        console.log('Review updated successfully from handlereviewchange');
    } catch (err) {
        console.error('Error handling review change:', err);
    }
}

// Call handleReviewChange function with appropriate parameters
// Example usage:
// handleReviewChange(reviewId, productId, rating);

