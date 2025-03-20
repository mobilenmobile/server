import { Request, Response } from 'express';
import productSoldHistory from '../../models/product/productSoldHistory';
import { Order } from '../../models/order/order.model';
import ProductViewHistory from '../../models/product/productViewHistory';
import { WebsiteVisit } from '../../models/websiteVisit/websiteVisitModel';
// Adjust imports as needed

// Helper function for calculating growth percentages
const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
};

// Helper function to get date ranges based on input or defaults
const getDateRange = (startDate?: string, endDate?: string, dateRange?: string) => {
    let finalStartDate: Date;
    let finalEndDate: Date = new Date();
    
    // If specific dates are provided, use them
    if (startDate && endDate) {
        finalStartDate = new Date(startDate);
        finalEndDate = new Date(endDate);
    } else if (dateRange) {
        // Handle predefined ranges like 'last7days', 'last30days', etc.
        finalStartDate = new Date();
        switch (dateRange) {
            case 'last7days':
                finalStartDate.setDate(finalStartDate.getDate() - 7);
                break;
            case 'last30days':
            default:
                finalStartDate.setDate(finalStartDate.getDate() - 30);
                break;
        }
    } else {
        // Default to last 30 days
        finalStartDate = new Date();
        finalStartDate.setDate(finalStartDate.getDate() - 30);
    }
    
    // Calculate previous period for growth comparisons
    const periodLength = (finalEndDate.getTime() - finalStartDate.getTime());
    const prevEndDate = new Date(finalStartDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setTime(prevStartDate.getTime() - periodLength);
    
    return {
        startDate: finalStartDate,
        endDate: finalEndDate,
        prevStartDate,
        prevEndDate
    };
};

// Unified error handler wrapper
const asyncErrorHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
    return async (req: Request, res: Response) => {
        try {
            await fn(req, res);
        } catch (error) {
            console.error("Error in controller:", error);
            res.status(500).json({ 
                success: false, 
                error: "An error occurred while processing your request" 
            });
        }
    };
};

export const getAnalyticsData = asyncErrorHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, dateRange, limit } = req.query;
    
    // Parse date ranges - handles all three controller's date parsing in one place
    const dateRanges = getDateRange(
        startDate as string,
        endDate as string,
        dateRange as string
    );
    
    const parsedStartDate = dateRanges.startDate;
    const parsedEndDate = dateRanges.endDate;
    const prevStartDate = dateRanges.prevStartDate;
    const prevEndDate = dateRanges.prevEndDate;
    
    // Parse limit parameter
    const parsedLimit = limit ? parseInt(limit as string) : 5;
    
    // Validate parameters
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ 
            success: false, 
            error: "Invalid date format. Please use YYYY-MM-DD format." 
        });
    }
    
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({ 
            success: false, 
            error: "Limit must be a positive number." 
        });
    }
    
    // SECTION 1: PRODUCT SALES STATISTICS
    // Aggregate pipeline to get top selling products with order counts
    const topProducts = await productSoldHistory.aggregate([
        // Filter by date range
        {
            $match: {
                sold_at: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                }
            }
        },
        // Group by product_id and sum quantities
        {
            $group: {
                _id: "$product_id",
                totalQuantitySold: { $sum: "$product_qty_sold" },
                title: { $first: "$product_title" },
                thumbnail: { $first: "$product_thumbnail" },
                sellingPrice: { $sum: "$amount_at_which_prod_sold" },
                orderCount: { $sum: 1 } // Count number of orders for each product
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
        // Unwind the product details
        {
            $unwind: {
                path: "$productDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        // Project the fields you want
        {
            $project: {
                _id: 1,
                title: 1,
                thumbnail: 1,
                totalQuantitySold: 1,
                sellingPrice: 1,
                orderCount: 1,
                productId: "$productDetails.productModel",
            }
        },
        // Sort by quantity sold in descending order
        {
            $sort: { totalQuantitySold: -1 }
        },
        // Limit results
        {
            $limit: parsedLimit
        }
    ]);

    // Aggregate pipeline to get top selling categories
    const topCategories = await productSoldHistory.aggregate([
        // Filter by date range
        {
            $match: {
                sold_at: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                },
                category_id: { $ne: null }
            }
        },
        // Group by category_id and sum quantities
        {
            $group: {
                _id: "$category_id",
                totalQuantitySold: { $sum: "$product_qty_sold" },
                totalRevenue: { $sum: "$amount_at_which_prod_sold" }
            }
        },
        // Lookup to get category details
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "categoryDetails"
            }
        },
        // Unwind the category details
        {
            $unwind: {
                path: "$categoryDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        // Project the fields you want
        {
            $project: {
                categoryId: "$_id",
                categoryName: { $ifNull: ["$categoryDetails.categoryName", "Unknown Category"] },
                totalQuantitySold: 1,
                totalRevenue: 1
            }
        },
        // Sort by quantity sold in descending order
        {
            $sort: { totalQuantitySold: -1 }
        },
        // Limit results
        {
            $limit: 4 // Limit to 4 to match the UI
        }
    ]);

    // Aggregate pipeline to get top selling subcategories
    const topSubcategories = await productSoldHistory.aggregate([
        // Filter by date range
        {
            $match: {
                sold_at: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                },
                subcategory_id: { $ne: null }
            }
        },
        // Group by subcategory_id and sum quantities
        {
            $group: {
                _id: "$subcategory_id",
                totalQuantitySold: { $sum: "$product_qty_sold" },
                totalRevenue: { $sum: "$amount_at_which_prod_sold" }
            }
        },
        // Lookup to get subcategory details
        {
            $lookup: {
                from: "subcategories",
                localField: "_id",
                foreignField: "_id",
                as: "subcategoryDetails"
            }
        },
        // Unwind the subcategory details
        {
            $unwind: {
                path: "$subcategoryDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        // Project the fields you want
        {
            $project: {
                subcategoryId: "$_id",
                subcategoryName: { $ifNull: ["$subcategoryDetails.subCategoryName", "Unknown Subcategory"] },
                totalQuantitySold: 1,
                totalRevenue: 1
            }
        },
        // Sort by quantity sold in descending order
        {
            $sort: { totalQuantitySold: -1 }
        },
        // Limit results
        {
            $limit: 4 // Limit to 4 to match the UI
        }
    ]);

    // Get total orders count and revenue in the date range
    const revenueData = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$finalAmount" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    // Get total returns count
    const totalReturns = await Order.countDocuments({
        createdAt: {
            $gte: parsedStartDate,
            $lte: parsedEndDate
        },
        status: "returned"
    });

    // Get previous period data for comparisons
    const previousRevenueData = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: prevStartDate,
                    $lte: prevEndDate
                }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$finalAmount" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);
    
    // Get previous period returns count
    const previousReturns = await Order.countDocuments({
        createdAt: {
            $gte: prevStartDate,
            $lte: prevEndDate
        },
        status: "returned"
    });
    
    // Extract values from aggregation results
    const totalOrders = revenueData[0]?.totalOrders || 0;
    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const previousOrders = previousRevenueData[0]?.totalOrders || 0;
    const previousRevenue = previousRevenueData[0]?.totalRevenue || 0;
    
    // Calculate percentage changes
    const ordersPercentChange = calculateGrowth(totalOrders, previousOrders);
    const returnsPercentChange = calculateGrowth(totalReturns, previousReturns);
    const revenuePercentChange = calculateGrowth(totalRevenue, previousRevenue);

    // SECTION 2: PRODUCT VIEW STATISTICS
    const topViewedProducts = await ProductViewHistory.aggregate([
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
        // Limit results
        {
            $limit: parsedLimit
        }
    ]);

    // SECTION 3: WEBSITE VISIT ANALYTICS
    // Fetch Active Users (Users with userId)
    const totalActiveUsers = await WebsiteVisit.distinct("userId", {
        userId: { $ne: null },
        createdAt: { $gte: parsedStartDate, $lte: parsedEndDate },
    });

    // Count total visits
    const totalVisits = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: parsedStartDate, $lte: parsedEndDate } } },
        { $group: { _id: null, totalVisits: { $sum: "$visitCount" } } },
    ]);

    // Count visits for anonymous users (userId: null)
    const totalAnonymousVisits = await WebsiteVisit.aggregate([
        { $match: { userId: null, createdAt: { $gte: parsedStartDate, $lte: parsedEndDate } } },
        { $group: { _id: null, totalAnonymousVisits: { $sum: "$visitCount" } } },
    ]);

    // Fetch most visited timeframe
    const mostVisitedTimeframe = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: parsedStartDate, $lte: parsedEndDate } } },
        { $group: { _id: "$timeFrame", totalVisits: { $sum: "$visitCount" } } },
        { $sort: { totalVisits: -1 } },
        { $limit: 1 },
    ]);

    // Fetch Previous Period Website Visit Data
    const prevTotalActiveUsers = await WebsiteVisit.distinct("userId", {
        userId: { $ne: null },
        createdAt: { $gte: prevStartDate, $lte: prevEndDate },
    });

    const prevTotalVisits = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, totalVisits: { $sum: "$visitCount" } } },
    ]);

    const prevTotalAnonymousVisits = await WebsiteVisit.aggregate([
        { $match: { userId: null, createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, totalAnonymousVisits: { $sum: "$visitCount" } } },
    ]);

    const prevMostVisitedTimeframe = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: "$timeFrame", totalVisits: { $sum: "$visitCount" } } },
        { $sort: { totalVisits: -1 } },
        { $limit: 1 },
    ]);

    // Extract counts from Website Visit aggregation results
    const totalVisitsCount = totalVisits[0]?.totalVisits || 0;
    const totalAnonymousVisitsCount = totalAnonymousVisits[0]?.totalAnonymousVisits || 0;
    const prevTotalVisitsCount = prevTotalVisits[0]?.totalVisits || 0;
    const prevTotalAnonymousVisitsCount = prevTotalAnonymousVisits[0]?.totalAnonymousVisits || 0;

    // Calculate Website Visit Growth Percentages
    const activeUsersGrowth = calculateGrowth(totalActiveUsers.length, prevTotalActiveUsers.length);
    const totalVisitorsGrowth = calculateGrowth(totalVisitsCount, prevTotalVisitsCount);
    const anonymousVisitsGrowth = calculateGrowth(totalAnonymousVisitsCount, prevTotalAnonymousVisitsCount);
    const mostVisitedTimeframeGrowth = calculateGrowth(
        mostVisitedTimeframe[0]?.totalVisits || 0,
        prevMostVisitedTimeframe[0]?.totalVisits || 0
    );

    // Compile final response with all analytics data
    const analyticsData = {
        success: true,
        dateRange: {
            startDate: parsedStartDate,
            endDate: parsedEndDate
        },
        // Product Sales Data
        sales: {
            topProducts,
            topCategories: topCategories.map(category => ({
                name: category.categoryName,
                totalSales: category.totalQuantitySold
            })),
            topSubcategories: {
                totalSales: topSubcategories.reduce((sum, item) => sum + item.totalQuantitySold, 0),
                categories: topSubcategories.map(subcat => ({
                    name: subcat.subcategoryName,
                    totalSales: subcat.totalQuantitySold
                }))
            },
            statistics: {
                orders: {
                    total: totalOrders,
                    percentChange: ordersPercentChange
                },
                returns: {
                    total: totalReturns,
                    percentChange: returnsPercentChange
                },
                revenue: {
                    total: totalRevenue,
                    percentChange: revenuePercentChange
                }
            }
        },
        // Product Views Data
        productViews: {
            topViewedProducts
        },
        // Website Visits Data
        websiteVisits: {
            totalActiveUsers: totalActiveUsers.length,
            activeUsersGrowth,
            totalVisits: totalVisitsCount,
            totalVisitorsGrowth,
            totalAnonymousVisits: totalAnonymousVisitsCount,
            anonymousVisitsGrowth,
            mostVisitedTimeframe: mostVisitedTimeframe[0]?._id || "No data",
            mostVisitedTimeframeGrowth
        }
    };

    res.status(200).json(analyticsData);
});