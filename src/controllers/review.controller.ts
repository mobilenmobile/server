import mongoose from "mongoose";
import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Product } from "../models/product/product.model.js";
import { Review } from "../models/review/review.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";


//------------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.newReview
// 2.updateReview
// 3.allReviews
// 4.getSingleProductReview
// 5.deleteReview

// ---------------functions------------------

// 1.updateProductRating
// 2.handleReviewChange

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------------



//-------------------------api to create new review-----------------------------------
export const newReview = asyncErrorHandler(

    async (req: Request, res, next) => {

        console.log(req.body)

        const productId = (req.params as { id: string }).id;
        if (!productId) {
            return next(new ErrorHandler("no id present", 400));
        }

        const product = await Product.findById(productId);
        if (!product) {
            return next(new ErrorHandler("Product not found  ", 404));
        }

        const {
            reviewImgGallery,
            reviewRating,
            reviewDescription
        } = req.body;


        // if (!reviewDescription) {
        //     return next(new ErrorHandler("Please Enter description", 400));
        // }

        if (!req.user._id) {

            return next(new ErrorHandler("unauthenticated", 400));
        }
        console.log(req?.user?._id)
        console.log(product?._id)
        let review = await Review.findOne({ reviewUser: req.user._id, reviewProduct: product._id });

        console.log(review, "i found the review")
        if (review) {
            if (reviewRating) review.reviewRating = reviewRating
            if (reviewDescription) review.reviewDescription = reviewDescription
            if (reviewImgGallery) review.reviewImgGallery = JSON.parse(reviewImgGallery)
            await review.save()
        }

        if (!review) {
            console.log("hey review new block of code")
            console.log(reviewImgGallery, "review img gallery")
            review = await Review.create({
                reviewUser: req.user._id,
                reviewProduct: productId,
                reviewImgGallery: JSON.parse(reviewImgGallery),
                reviewRating,
                reviewDescription
            });
            console.log(review, "review")

        }
        await handleReviewChange(review._id, productId, review.reviewRating)
        return res.status(201).json({
            success: true,
            message: "Review added successfully",
            review,
        });
    }
);


//--------------------------api to update review-------------------------------------------
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

        const review = await Review.findById(id);

        if (!review) {
            return next(new ErrorHandler("No Review Found", 404));
        }

        if (reviewProduct) review.reviewProduct = reviewProduct
        if (reviewRating) review.reviewRating = reviewRating
        if (reviewDescription) review.reviewDescription = reviewDescription
        if (JSON.parse(reviewImgGallery).length > 0) review.reviewImgGallery = JSON.parse(reviewImgGallery)

        const updatedReview = await review.save();
        await handleReviewChange(review._id, review.reviewProduct, review.reviewRating)

        return res.status(200).json({
            success: true,
            message: "Review Updated Successfully",
            updatedReview,
        });

    }
);


//-------------------------api to get all reviews-------------------------------------------

export const allReviews = asyncErrorHandler(async (req, res, next) => {
    const id = (req.params as { id: string }).id;
    
    if (!id) {
        return next(new ErrorHandler("Incorrect product ID", 400));
    }
    
    // Pipeline to get aggregated statistics
    const aggregationPipeline = [
        {
            $match: {
                reviewProduct: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reviewUser',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $group: {
                _id: null,
                totalRatings: { $sum: { $cond: [{ $gte: ['$reviewRating', 1] }, 1, 0] } },
                averageRating: { $avg: '$reviewRating' },
                reviewsCount: { $sum: { $cond: [{ $gt: [{ $strLenCP: '$reviewDescription' }, 0] }, 1, 0] } },
                fiveStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 5] }, 1, 0] } },
                fourStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 4] }, 1, 0] } },
                threeStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 3] }, 1, 0] } },
                twoStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 2] }, 1, 0] } },
                oneStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 1] }, 1, 0] } },
                imageUrls: { $push: '$reviewImgGallery' }
            }
        },
        {
            $project: {
                _id: 0,
                totalRatings: 1,
                averageRating: { $round: ['$averageRating', 0] },
                reviewsCount: 1,
                fiveStarCount: 1,
                fourStarCount: 1,
                threeStarCount: 1,
                twoStarCount: 1,
                oneStarCount: 1,
                imageUrls: { $reduce: { input: '$imageUrls', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } }
            }
        }
    ];
    
    // Pipeline to get all detailed reviews
    const detailedReviewsPipeline = [
        {
            $match: {
                reviewProduct: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: 'users',
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
                _id: 1,
                reviewProduct: 1,
                reviewImgGallery: 1,
                reviewRating: 1,
                reviewDescription: 1,
                updatedAt: 1,
                'user.name': 1,
                'user.email': 1
            }
        }
    ];
    
    // Execute the aggregation pipelines
    const [stats] = await Review.aggregate(aggregationPipeline);
    const detailedReviews = await Review.aggregate(detailedReviewsPipeline);
    
    if (!stats) {
        return res.status(200).json({
            success: true,
            message: "No reviews found",
            totalRatings: 0,
            averageRating: 0,
            reviewsCount: 0,
            fiveStarCount: 0,
            fourStarCount: 0,
            threeStarCount: 0,
            twoStarCount: 0,
            oneStarCount: 0,
            imageUrls: [],
            allReviews: []
        });
    }
    
    return res.status(200).json({
        success: true,
        message: "Reviews fetched successfully",
        ...stats,
        allReviews: detailedReviews
    });
});

// export const allReviews = asyncErrorHandler(async (req, res, next) => {
//     const id = (req.params as { id: string }).id;

//     if (!id) {
//         return next(new ErrorHandler("Incorrect product ID", 400));
//     }

//     // Pipeline to get aggregated statistics
//     const aggregationPipeline = [
//         {
//             $match: {
//                 reviewProduct: new mongoose.Types.ObjectId(id) // Match reviews where reviewProduct equals paramsId
//             }
//         },
//         {
//             $lookup: {
//                 from: 'users', // Collection name for users
//                 localField: 'reviewUser',
//                 foreignField: '_id',
//                 as: 'user'
//             }
//         },
//         {
//             $unwind: '$user'
//         },
//         {
//             $group: {
//                 _id: null,
//                 totalRatings: { $sum: { $cond: [{ $gte: ['$reviewRating', 1] }, 1, 0] } },
//                 averageRating: { $avg: '$reviewRating' },
//                 reviewsCount: { $sum: { $cond: [{ $gt: [{ $strLenCP: '$reviewDescription' }, 0] }, 1, 0] } },
//                 fiveStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 5] }, 1, 0] } },
//                 fourStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 4] }, 1, 0] } },
//                 threeStarCount: { $sum: { $cond: [{ $eq: ['$reviewRating', 3] }, 1, 0] } },
//                 imageUrls: { $push: '$reviewImgGallery' }
//             }
//         },
//         {
//             $project: {
//                 _id: 0,
//                 totalRatings: 1,
//                 averageRating: { $round: ['$averageRating', 0] }, // Round the number
//                 reviewsCount: 1,
//                 fiveStarCount: 1,
//                 fourStarCount: 1,
//                 threeStarCount: 1,
//                 imageUrls: { $reduce: { input: '$imageUrls', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } }
//             }
//         }
//     ];

//     // Pipeline to get all detailed reviews
//     const detailedReviewsPipeline = [
//         {
//             $match: {
//                 reviewProduct: new mongoose.Types.ObjectId(id) // Match reviews where reviewProduct equals paramsId
//             }
//         },
//         {
//             $lookup: {
//                 from: 'users', // Collection name for users
//                 localField: 'reviewUser',
//                 foreignField: '_id',
//                 as: 'user'
//             }
//         },
//         {
//             $unwind: '$user'
//         },
//         {
//             $project: {
//                 _id: 1,
//                 reviewProduct: 1,
//                 reviewImgGallery: 1,
//                 reviewRating: 1,
//                 reviewDescription: 1,
//                 updatedAt: 1,
//                 'user.name': 1,
//                 'user.email': 1
//             }
//         }
//     ];

//     // Execute the aggregation pipelines
//     const [stats] = await Review.aggregate(aggregationPipeline);
//     const detailedReviews = await Review.aggregate(detailedReviewsPipeline);

//     if (!stats) {
//         return res.status(200).json({
//             success: true,
//             message: "No reviews found",
//             totalRatings: 0,
//             averageRating: 0,
//             reviewsCount: 0,
//             fiveStarCount: 0,
//             fourStarCount: 0,
//             threeStarCount: 0,
//             imageUrls: [],
//             allReviews: []
//         });
//     }

//     return res.status(200).json({
//         success: true,
//         message: "Reviews fetched successfully",
//         ...stats,
//         allReviews: detailedReviews
//     });
// });

// export const allReviews = asyncErrorHandler(async (req, res, next) => {

//     const id = (req.params as { id: string }).id;

//     if (!id) {
//         return next(new ErrorHandler("incorrect product id", 400));
//     }
//     // const  = await Review.find({ reviewProduct: id }).populate('reviewUser')
//     const allReviews = await Review.aggregate([
//         {
//             $match: {
//                 reviewProduct: new mongoose.Types.ObjectId(id)// Match reviews where reviewProduct equals paramsId
//             }
//         },
//         {
//             $lookup: {
//                 from: 'users', // Collection name for users
//                 localField: 'reviewUser',
//                 foreignField: '_id',
//                 as: 'user'
//             }
//         },
//         {
//             $unwind: '$user'
//         },
//         {
//             $project: {
//                 reviewProduct: 1,
//                 reviewImgGallery: 1,
//                 reviewRating: 1,
//                 reviewDescription: 1,
//                 updatedAt: 1,
//                 'user.name': 1,
//                 'user.email': 1
//             }
//         }
//     ]);

//     // console.log("Aggregated Reviews with User Details:", aggregatedReviews);
//     // if (!req.user._id) {
//     //     return next(new ErrorHandler("unauthenticated", 400));
//     // }
//     // Initialize variables for calculating averages and counts
//     let totalRatings = 0;
//     let ratingCount = 0;
//     let reviewsCount = 0;
//     let fiveStarCount = 0;
//     let fourStarCount = 0;
//     let threeStarCount = 0;
//     let imageUrls: any[] = [];

//     // Loop through each review
//     allReviews.forEach(review => {
//         // Extract image URLs
//         imageUrls = imageUrls.concat(review.reviewImgGallery);
//         console.log(review.reviewRating,ratingCount)
//         // Calculate average rating
//         ratingCount += review.reviewRating !== null  && review.reviewRating;

//         totalRatings += review.reviewRating > 0 ? 1 : 0;
//         reviewsCount += review.reviewDescription.length > 0 ? 1 : 0;

//         // Count ratings
//         switch (review.reviewRating) {
//             case 5:
//                 fiveStarCount++;
//                 break;
//             case 4:
//                 fourStarCount++;
//                 break;
//             case 3:
//                 threeStarCount++;
//                 break;
//             // Add cases for other ratings if needed
//             default:
//                 break;
//         }
//     });

//     console.log("rating count -----------------------------.......", ratingCount)
//     // Calculate average rating
//     const averageRating = ratingCount / allReviews.length;

//     // Output the results
//     console.log("Image URLs:", imageUrls);
//     console.log("Average Rating:", averageRating);
//     console.log("Number of 5-star ratings:", fiveStarCount);
//     console.log("Number of 4-star ratings:", fourStarCount);
//     console.log("Number of 3-star ratings:", threeStarCount);

//     return res.status(200).json({
//         success: true,
//         message: "reviews fetched successfully",
//         totalRatings,
//         averageRating: Math.round(averageRating),
//         reviewsCount,
//         fiveStarCount,
//         fourStarCount,
//         threeStarCount,
//         imageUrls,
//         allReviews,
//     });
// });


//----------------------api to get user reviews------------------------------------------------
export const getSingleProductReview = asyncErrorHandler(async (req, res, next) => {

    const id = (req.params as { id: string }).id;

    if (!id) {
        return next(new ErrorHandler("incorrect product id", 400));
    }

    const product = await Product.findById(id);

    if (!product) {
        return next(new ErrorHandler("product not found", 404));
    }


    const review = await Review.findOne({ reviewProduct: id, reviewUser: req.user._id })

    if (!review) {
        return next(new ErrorHandler("no reviews found", 202));
    }

    return res.status(200).json({
        success: true,
        message: "successfully fetched review",
        review
    });
});

//----------------------api to delete review----------------------------------------------------
export const deleteReview = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const review = await Review.findById(id);

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


//---------- Function to calculate and update product rating based on reviews-----------------------
async function updateProductRating(productId: string) {
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
            }, {
                $project: {
                    averageRating: { $round: ['$averageRating', 0] }, // Round the number  
                    count: 1
                }
            }
        ]);

        if (result.length > 0) {
            const { averageRating, count } = result[0];
            // Update product rating in Product collection
            const product = await Product.findById(productId);
            await Product.findByIdAndUpdate(productId, {
                productRating: Math.round(averageRating),
                productNumReviews: count
            });


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
        // const review = await Review.findByIdAndUpdate(reviewId, { rating: rating }, { new: true });

        // Update the product rating based on the reviews
        await updateProductRating(productId);

    } catch (err) {
        console.error('Error handling review change:', err);
    }
}

// Call handleReviewChange function with appropriate parameters
// Example usage:
// handleReviewChange(reviewId, productId, rating);

