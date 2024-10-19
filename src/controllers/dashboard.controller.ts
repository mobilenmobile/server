import moment from "moment";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Order } from "../models/order/order.model";
import { Product } from "../models/product/product.model";
import ErrorHandler from "../utils/errorHandler";

//--------------------------------api to get inventory data---------------------------------------
export const getInventoryData = asyncErrorHandler(async (req, res, next) => {
    // 1. Get total product count
    const totalInventoryCount = await Product.countDocuments();

    // 2. Fetch products where any variant has less than 5 quantity
    const lowStockProducts = await Product.find({
        'productVariance.quantity': { $lt: 5 },
    }).select('productTitle productVariance'); // Selecting only relevant fields for better performance

    // Format the low stock products to include remaining quantity
    const formattedLowStockProducts = lowStockProducts.map((product) => {
        return {
            productTitle: product.productTitle,
            remainingQuantities: product.productVariance
                .filter((variant: any) => variant.quantity < 5)
                .map((variant: any) => ({
                    color: variant.color,
                    remainingQuantity: variant.quantity,
                })),
        };
    });

    // 3. Return the inventory data in the desired JSON format
    return res.status(200).json({
        success: true,
        totalInventory: totalInventoryCount,
        products: formattedLowStockProducts,
    });
});


//--------------------------------api to get monthly order stats---------------------------------------
export const getMonthlyOrderStats = asyncErrorHandler(async (req, res, next) => {
    // Aggregation pipeline
    const result = await Order.aggregate([
        // Stage 1: Project necessary fields and extract the month from `createdAt`
        {
            $project: {
                month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, // Extract month and year in "YYYY-MM" format
                orderItems: 1,
                orderStatusState: 1,
                finalAmount: 1,
                discount: 1,
                deliveryCharges: 1,
            },
        },
        // Stage 2: Group by month and calculate the stats
        {
            $group: {
                _id: "$month", // Group by month
                deliveredProducts: {
                    $sum: {
                        $cond: [{ $eq: ["$orderStatusState", "delivered"] }, { $size: "$orderItems" }, 0],
                    },
                },
                canceledProducts: {
                    $sum: {
                        $cond: [{ $eq: ["$orderStatusState", "cancelled"] }, { $size: "$orderItems" }, 0],
                    },
                },
                totalPlacedOrders: {
                    $sum: {
                        $cond: [{ $eq: ["$orderStatusState", "placed"] }, 1, 0], // Count orders with 'placed' status
                    },
                },
                totalSales: {
                    $sum: {
                        $cond: [{ $eq: ["$orderStatusState", "delivered"] }, "$finalAmount", 0],
                    },
                },
                totalProfit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$orderStatusState", "delivered"] },
                            { $subtract: ["$finalAmount", { $add: ["$discount", "$deliveryCharges"] }] }, // totalSales - (discount + deliveryCharges)
                            0,
                        ],
                    },
                },
            },
        },
        // Stage 3: Sort the results by month (optional)
        {
            $sort: { _id: 1 }, // Sort by month in ascending order
        },
    ]);

    // Return the formatted response
    return res.status(200).json({
        success: true,
        monthlyStats: result.map((entry) => ({
            month: moment(entry._id, "YYYY-MM").format("MMMM-YYYY"),
            deliveredProducts: entry.deliveredProducts,
            canceledProducts: entry.canceledProducts,
            totalPlacedOrders: entry.totalPlacedOrders,
            totalSales: entry.totalSales,
            totalProfit: entry.totalProfit,
        })),
    });
});


