import { Request, Response } from "express";

import mongoose from "mongoose";
import { asyncErrorHandler } from "../../middleware/error.middleware";
import ProductViewHistory from "../../models/product/productViewHistory";


export const trackProductView = asyncErrorHandler(async (req: Request, res: Response) => {
    const { product_id, user_id, category_id, subcategory_id } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(product_id) || !mongoose.Types.ObjectId.isValid(category_id)) {
        return res.status(400).json({ success: false, message: "Invalid product_id or category_id" });
    }

    // Define filter (group by product, category, and optionally user)
    const filter: any = { product_id, category_id, user_id: user_id || null };

    // Define update operations
    const update: any = {
        $inc: { total_views: 1 }, // Increment view count
        $set: { last_viewed_at: new Date() }, // Update last viewed time
        $setOnInsert: { first_viewed_at: new Date() } // Set first viewed only if new
    };

    // Add subcategory if provided
    if (subcategory_id && mongoose.Types.ObjectId.isValid(subcategory_id)) {
        update.$setOnInsert.subcategory_id = subcategory_id;
    }

    // Update existing record or create a new one
    const productView = await ProductViewHistory.findOneAndUpdate(filter, update, {
        upsert: true,
        new: true
    });

    res.json({
        success: true,
        message: "Product view recorded",
        data: productView
    });
});


export const getProductViewStats = asyncErrorHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    // Parse date range (default to last 30 days if not provided)
    const parsedStartDate = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate as string) : new Date();

    
    
    const viewStats = await ProductViewHistory.aggregate([
        // Filter by date range
        {
            $match: {
                last_viewed_at: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                }
            }
        },
        // Group by product_id and sum total views
        {
            $group: {
                _id: "$product_id",
                totalViews: { $sum: "$total_views" }
            }
        },
        // Lookup to get product details
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        {
            $unwind: {
                path: "$productDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        // Project the first variance details only (avoids duplicate entries)
        {
            $addFields: {
                firstVariance: {
                    $arrayElemAt: ["$productDetails.productVariance", 0]
                }
            }
        },
        // Project final output
        {
            $project: {
                productName: "$productDetails.productTitle",
                price: "$firstVariance.sellingprice",
                thumbnail: "$firstVariance.thumbnail",
                totalViews: 1
            }
        },
        // Sort by total views (descending)
        {
            $sort: { totalViews: -1 }
        },
        // Limit results (optional, e.g., top 5 viewed products)
        {
            $limit: 5
        }
    ]);
    
    
    res.status(200).json({
        success: true,
        data: viewStats
    });
});
