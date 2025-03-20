import { asyncErrorHandler } from "../../middleware/error.middleware";
import { Order } from "../../models/order/order.model";
import productSoldHistory from "../../models/product/productSoldHistory";


export const getProductStats = asyncErrorHandler(
    async (req, res) => {
        const { startDate, endDate, limit } = req.query;

        try {
            // Convert query parameters to proper types
            const parsedStartDate = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1)); // Default to 1 month ago
            const parsedEndDate = endDate ? new Date(endDate as string) : new Date(); // Default to current date
            const parsedLimit = limit ? parseInt(limit as string) : 5; // Default to 5 results to match UI

            // Validate dates
            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
            }

            // Validate limit
            if (isNaN(parsedLimit) || parsedLimit <= 0) {
                return res.status(400).json({ error: "Limit must be a positive number." });
            }

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
                        from: "products", // Adjust to your actual collection name
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
                        productId: "$productDetails.productModel", // Getting product ID/model
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
                        from: "categories", // Adjust to your actual collection name
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
                // Project the fields you want - fixing the category name access
                {
                    $project: {
                        categoryId: "$_id",
                        categoryName: { $ifNull: ["$categoryDetails.categoryName", "Unknown Category"] }, // Properly access category name
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

            // Aggregate pipeline to get top selling subcategories with names
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
                // Project the fields you want - fixing the subcategory name access
                {
                    $project: {
                        subcategoryId: "$_id",
                        subcategoryName: { $ifNull: ["$subcategoryDetails.subCategoryName", "Unknown Subcategory"] }, // Properly access subcategory name
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

            // Get total orders count in the date range
            const totalOrders = await Order.countDocuments({
                createdAt: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                }
            });

            // Get total revenue from orders in the date range
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
                status: "returned" // Adjust based on your actual status field for returns
            });

            // Calculate percentage changes (for the +8%, +12%, +15% shown in UI)
            // This requires comparing to previous period
            const previousPeriodStart = new Date(parsedStartDate);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 30); // 30 days before start date
            
            const previousPeriodEnd = new Date(parsedStartDate);
            previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1); // 1 day before start date
            
            // Get previous period orders count
            const previousOrders = await Order.countDocuments({
                createdAt: {
                    $gte: previousPeriodStart,
                    $lte: previousPeriodEnd
                }
            });
            
            // Get previous period returns count
            const previousReturns = await Order.countDocuments({
                createdAt: {
                    $gte: previousPeriodStart,
                    $lte: previousPeriodEnd
                },
                status: "returned"
            });
            
            // Get previous period revenue
            const previousRevenueData = await Order.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: previousPeriodStart,
                            $lte: previousPeriodEnd
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$finalAmount" }
                    }
                }
            ]);
            
            // Calculate percentage changes
            const ordersPercentChange = previousOrders > 0 
                ? Math.round(((totalOrders - previousOrders) / previousOrders) * 100) 
                : 0;
                
            const returnsPercentChange = previousReturns > 0 
                ? Math.round(((totalReturns - previousReturns) / previousReturns) * 100) 
                : 0;
                
            const revenuePercentChange = previousRevenueData.length > 0 && previousRevenueData[0].totalRevenue > 0
                ? Math.round(((revenueData[0]?.totalRevenue || 0) - previousRevenueData[0].totalRevenue) / previousRevenueData[0].totalRevenue * 100)
                : 0;

            // Format the response to match the UI
            const formattedResponse = {
                topProducts,
                topCategories: topCategories.map(category => ({
                    name: category.categoryName || 'Unknown Category',
                    totalSales: category.totalQuantitySold
                })),
                topSubcategories: {
                    totalSales: topSubcategories.reduce((sum, item) => sum + item.totalQuantitySold, 0),
                    categories: topSubcategories.map(subcat => ({
                        name: subcat.subcategoryName || 'Unknown Subcategory',
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
                        total: revenueData[0]?.totalRevenue || 0,
                        percentChange: revenuePercentChange
                    }
                }
            };

            res.status(200).json(formattedResponse);

        } catch (error) {
            console.error("Error fetching product stats:", error);
            res.status(500).json({ error: "Failed to fetch product statistics" });
        }
    }
);


// export const getProductStats = asyncErrorHandler(
//     async (req, res) => {
//         const { startDate, endDate, limit } = req.query;

//         try {
//             // Convert query parameters to proper types
//             const parsedStartDate = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1)); // Default to 1 month ago
//             const parsedEndDate = endDate ? new Date(endDate as string) : new Date(); // Default to current date
//             const parsedLimit = limit ? parseInt(limit as string) : 5; // Default to 5 results to match UI

//             // Validate dates
//             if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
//                 return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
//             }

//             // Validate limit
//             if (isNaN(parsedLimit) || parsedLimit <= 0) {
//                 return res.status(400).json({ error: "Limit must be a positive number." });
//             }

//             // Aggregate pipeline to get top selling products with order counts
//             const topProducts = await productSoldHistory.aggregate([
//                 // Filter by date range
//                 {
//                     $match: {
//                         sold_at: {
//                             $gte: parsedStartDate,
//                             $lte: parsedEndDate
//                         }
//                     }
//                 },
//                 // Group by product_id and sum quantities
//                 {
//                     $group: {
//                         _id: "$product_id",
//                         totalQuantitySold: { $sum: "$product_qty_sold" },
//                         title: { $first: "$product_title" },
//                         thumbnail: { $first: "$product_thumbnail" },
//                         totalRevenue: { $sum: "$amount_at_which_prod_sold" },
//                         orderCount: { $sum: 1 } // Count number of orders for each product
//                     }
//                 },
//                 // Lookup to get product details
//                 {
//                     $lookup: {
//                         from: "products", // Adjust to your actual collection name
//                         localField: "_id",
//                         foreignField: "_id",
//                         as: "productDetails"
//                     }
//                 },
//                 // Unwind the product details
//                 {
//                     $unwind: {
//                         path: "$productDetails",
//                         preserveNullAndEmptyArrays: true
//                     }
//                 },
//                 // Project the fields you want
//                 {
//                     $project: {
//                         _id: 1,
//                         title: 1,
//                         thumbnail: 1,
//                         totalQuantitySold: 1,
//                         totalRevenue: 1,
//                         orderCount: 1,
//                         productId: "$productDetails.productModel", // Getting product ID/model
//                     }
//                 },
//                 // Sort by quantity sold in descending order
//                 {
//                     $sort: { totalQuantitySold: -1 }
//                 },
//                 // Limit results
//                 {
//                     $limit: parsedLimit
//                 }
//             ]);

//             // Aggregate pipeline to get top selling categories
//             const topCategories = await productSoldHistory.aggregate([
//                 // Filter by date range
//                 {
//                     $match: {
//                         sold_at: {
//                             $gte: parsedStartDate,
//                             $lte: parsedEndDate
//                         },
//                         category_id: { $ne: null }
//                     }
//                 },
//                 // Group by category_id and sum quantities
//                 {
//                     $group: {
//                         _id: "$category_id",
//                         totalQuantitySold: { $sum: "$product_qty_sold" },
//                         totalRevenue: { $sum: "$amount_at_which_prod_sold" }
//                     }
//                 },
//                 // Lookup to get category details
//                 {
//                     $lookup: {
//                         from: "categories", // Adjust to your actual collection name
//                         localField: "_id",
//                         foreignField: "_id",
//                         as: "categoryDetails"
//                     }
//                 },
//                 // Unwind the category details
//                 {
//                     $unwind: {
//                         path: "$categoryDetails",
//                         preserveNullAndEmptyArrays: true
//                     }
//                 },
//                 // Project the fields you want
//                 {
//                     $project: {
//                         categoryId: "$_id",
//                         categoryName: "$categoryDetails.name", // Getting the category name
//                         totalQuantitySold: 1,
//                         totalRevenue: 1
//                     }
//                 },
//                 // Sort by quantity sold in descending order
//                 {
//                     $sort: { totalQuantitySold: -1 }
//                 },
//                 // Limit results
//                 {
//                     $limit: 4 // Limit to 4 to match the UI
//                 }
//             ]);

//             // Aggregate pipeline to get top selling subcategories with names
//             const topSubcategories = await productSoldHistory.aggregate([
//                 // Filter by date range
//                 {
//                     $match: {
//                         sold_at: {
//                             $gte: parsedStartDate,
//                             $lte: parsedEndDate
//                         },
//                         subcategory_id: { $ne: null }
//                     }
//                 },
//                 // Group by subcategory_id and sum quantities
//                 {
//                     $group: {
//                         _id: "$subcategory_id",
//                         totalQuantitySold: { $sum: "$product_qty_sold" },
//                         totalRevenue: { $sum: "$amount_at_which_prod_sold" }
//                     }
//                 },
//                 // Lookup to get subcategory details
//                 {
//                     $lookup: {
//                         from: "subcategories",
//                         localField: "_id",
//                         foreignField: "_id",
//                         as: "subcategoryDetails"
//                     }
//                 },
//                 // Unwind the subcategory details
//                 {
//                     $unwind: {
//                         path: "$subcategoryDetails",
//                         preserveNullAndEmptyArrays: true
//                     }
//                 },
//                 // Project the fields you want
//                 {
//                     $project: {
//                         subcategoryId: "$_id",
//                         subcategoryName: "$subcategoryDetails.name",
//                         totalQuantitySold: 1,
//                         totalRevenue: 1
//                     }
//                 },
//                 // Sort by quantity sold in descending order
//                 {
//                     $sort: { totalQuantitySold: -1 }
//                 },
//                 // Limit results
//                 {
//                     $limit: 4 // Limit to 4 to match the UI
//                 }
//             ]);

//             // Get total orders count in the date range
//             const totalOrders = await Order.countDocuments({
//                 createdAt: {
//                     $gte: parsedStartDate,
//                     $lte: parsedEndDate
//                 }
//             });

//             // Get total revenue from orders in the date range
//             const revenueData = await Order.aggregate([
//                 {
//                     $match: {
//                         createdAt: {
//                             $gte: parsedStartDate,
//                             $lte: parsedEndDate
//                         }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalRevenue: { $sum: "$finalAmount" },
//                         totalOrders: { $sum: 1 }
//                     }
//                 }
//             ]);

//             // Get total returns count
//             const totalReturns = await Order.countDocuments({
//                 createdAt: {
//                     $gte: parsedStartDate,
//                     $lte: parsedEndDate
//                 },
//                 status: "returned" // Adjust based on your actual status field for returns
//             });

//             // Calculate percentage changes (for the +8%, +12%, +15% shown in UI)
//             // This requires comparing to previous period
//             const previousPeriodStart = new Date(parsedStartDate);
//             previousPeriodStart.setDate(previousPeriodStart.getDate() - 30); // 30 days before start date
            
//             const previousPeriodEnd = new Date(parsedStartDate);
//             previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1); // 1 day before start date
            
//             // Get previous period orders count
//             const previousOrders = await Order.countDocuments({
//                 createdAt: {
//                     $gte: previousPeriodStart,
//                     $lte: previousPeriodEnd
//                 }
//             });
            
//             // Get previous period returns count
//             const previousReturns = await Order.countDocuments({
//                 createdAt: {
//                     $gte: previousPeriodStart,
//                     $lte: previousPeriodEnd
//                 },
//                 status: "returned"
//             });
            
//             // Get previous period revenue
//             const previousRevenueData = await Order.aggregate([
//                 {
//                     $match: {
//                         createdAt: {
//                             $gte: previousPeriodStart,
//                             $lte: previousPeriodEnd
//                         }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalRevenue: { $sum: "$finalAmount" }
//                     }
//                 }
//             ]);
            
//             // Calculate percentage changes
//             const ordersPercentChange = previousOrders > 0 
//                 ? Math.round(((totalOrders - previousOrders) / previousOrders) * 100) 
//                 : 0;
                
//             const returnsPercentChange = previousReturns > 0 
//                 ? Math.round(((totalReturns - previousReturns) / previousReturns) * 100) 
//                 : 0;
                
//             const revenuePercentChange = previousRevenueData.length > 0 && previousRevenueData[0].totalRevenue > 0
//                 ? Math.round(((revenueData[0]?.totalRevenue || 0) - previousRevenueData[0].totalRevenue) / previousRevenueData[0].totalRevenue * 100)
//                 : 0;

//             // Format the response to match the UI
//             const formattedResponse = {
//                 topProducts: topProducts.map(product => ({
//                     title: product.title,
//                     id: product._id || 'Unknown ID',
//                     price: Math.round(product.totalRevenue / product.totalQuantitySold) || 0,
//                     orders: product.orderCount || 0,
//                     thumbnail: product.thumbnail
//                 })),
//                 topCategories: topCategories.map(category => ({
//                     name: category.categoryName || 'Unknown Category',
//                     totalSales: category.totalQuantitySold
//                 })),
//                 topSubcategories: {
//                     totalSales: topSubcategories.reduce((sum, item) => sum + item.totalQuantitySold, 0),
//                     categories: topSubcategories.map(subcat => ({
//                         name: subcat.subcategoryName || 'Unknown Subcategory',
//                         totalSales: subcat.totalQuantitySold
//                     }))
//                 },
//                 statistics: {
//                     orders: {
//                         total: totalOrders,
//                         percentChange: ordersPercentChange
//                     },
//                     returns: {
//                         total: totalReturns,
//                         percentChange: returnsPercentChange
//                     },
//                     revenue: {
//                         total: revenueData[0]?.totalRevenue || 0,
//                         percentChange: revenuePercentChange
//                     }
//                 }
//             };

//             res.status(200).json(formattedResponse);

//         } catch (error) {
//             console.error("Error fetching product stats:", error);
//             res.status(500).json({ error: "Failed to fetch product statistics" });
//         }
//     }
// );















// export const getProductStats = asyncErrorHandler(
//     async (req, res) => {
//         const { startDate, endDate, limit } = req.query;

//         try {
//             // Convert query parameters to proper types
//             const parsedStartDate = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1)); // Default to 1 month ago
//             const parsedEndDate = endDate ? new Date(endDate as string) : new Date(); // Default to current date
//             const parsedLimit = limit ? parseInt(limit as string) : 10; // Default to 10 results

//             // Validate dates
//             if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
//                 return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD format." });
//             }

//             // Validate limit
//             if (isNaN(parsedLimit) || parsedLimit <= 0) {
//                 return res.status(400).json({ error: "Limit must be a positive number." });
//             }

//             // Aggregate pipeline to get top selling products
//             const topProducts = await productSoldHistory.aggregate([
//                 // Filter by date range
//                 {
//                     $match: {
//                         sold_at: {
//                             $gte: parsedStartDate,
//                             $lte: parsedEndDate
//                         }
//                     }
//                 },
//                 // Group by product_id and sum quantities
//                 {
//                     $group: {
//                         _id: "$product_id",
//                         totalQuantitySold: { $sum: "$product_qty_sold" },
//                         title: { $first: "$product_title" },
//                         thumbnail: { $first: "$product_thumbnail" },
//                         totalRevenue: { $sum: "$amount_at_which_prod_sold" }
//                     }
//                 },
//                 // Sort by quantity sold in descending order
//                 {
//                     $sort: { totalQuantitySold: -1 }
//                 },
//                 // Limit results
//                 {
//                     $limit: parsedLimit
//                 }
//             ]);

//             // Aggregate pipeline to get top selling subcategories
//             const topSubcategories = await productSoldHistory.aggregate([
//                 // Filter by date range
//                 {
//                     $match: {
//                         sold_at: {
//                             $gte: parsedStartDate,
//                             $lte: parsedEndDate
//                         },
//                         subcategory_id: { $ne: null } // Exclude null subcategories
//                     }
//                 },
//                 // Group by subcategory_id and sum quantities
//                 {
//                     $group: {
//                         _id: "$subcategory_id",
//                         totalQuantitySold: { $sum: "$product_qty_sold" },
//                         totalRevenue: { $sum: "$amount_at_which_prod_sold" }
//                     }
//                 },
//                 // Lookup to get subcategory details
//                 {
//                     $lookup: {
//                         from: "subcategories", // Replace with your actual subcategory collection name
//                         localField: "_id",
//                         foreignField: "_id",
//                         as: "subcategoryDetails"
//                     }
//                 },
//                 // Unwind the subcategory details
//                 {
//                     $unwind: "$subcategoryDetails"
//                 },
//                 // Project the fields you want
//                 {
//                     $project: {
//                         subcategoryId: "$_id",
//                         subcategoryName: "$subcategoryDetails.name", // Adjust field name as needed
//                         totalQuantitySold: 1,
//                         totalRevenue: 1
//                     }
//                 },
//                 // Sort by quantity sold in descending order
//                 {
//                     $sort: { totalQuantitySold: -1 }
//                 },
//                 // Limit results
//                 {
//                     $limit: parsedLimit
//                 }
//             ]);

//             res.status(200).json({
//                 topProducts,
//                 topSubcategories
//             });

//         } catch (error) {
//             console.error("Error fetching top selling products:", error);
//             res.status(500).json({ error: "Failed to fetch top selling products" });
//         }
//     }
// );