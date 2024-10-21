import moment from "moment";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Order } from "../models/order/order.model";
import { Product } from "../models/product/product.model";
import ErrorHandler from "../utils/errorHandler";
import { Category } from "../models/category/category.model";

//--------------------------------api to get inventory data---------------------------------------



export const getInventoryData = asyncErrorHandler(async (req, res, next) => {
    // Define the categories you want to filter
    const categories = ['smartphone', 'accessories', 'skin'];

    // 1. Get total product count where quantity is greater than 0
    const totalInventoryCount = await Product.countDocuments({
        'productVariance.quantity': { $gt: 0 }, // Count products with quantity > 0
    });

    // 2. Fetch all products (not just low stock) for each category
    const inventoryByCategory = await Promise.all(
        categories.map(async (categoryName) => {
            // Find the ObjectId of the category by its name
            const category = await Category.findOne({ categoryName }).select('_id');

            if (!category) {
                return {
                    // category: categoryName,
                    totalInventory: 0,
                    // products: [],
                };
            }

            // Count total inventory for the current category where quantity is greater than 0
            const totalInventoryForCategory = await Product.countDocuments({
                productCategory: category._id, // Match category ObjectId
                'productVariance.quantity': { $gt: 0 }, // Only count products with quantity > 0
            });

            // Fetch all products in the current category and populate productCategory to get categoryName
            const productsInCategory = await Product.find({
                productCategory: category._id, // Use category ObjectId
            })
                .populate('productCategory', 'categoryName') // Populate categoryName from productCategory reference
                .select('productTitle productVariance productCategory'); // Select only relevant fields

            // Format all products to include remaining quantities
            // const formattedProductsInCategory = productsInCategory.map((product) => {
            //     return {
            //         productTitle: product.productTitle,
            //         categoryName: product.productCategory?.categoryName || 'Unknown',
            //         remainingQuantities: product.productVariance.map((variant: any) => ({
            //             color: variant.color,
            //             remainingQuantity: variant.quantity,
            //         })),
            //     };
            // });

            return {
                category: categoryName,
                totalInventory: totalInventoryForCategory,
                // products: formattedProductsInCategory,
            };
        })
    );

    // 3. Fetch low stock products (optional if you still need this)
    const lowStockProducts = await Product.find({
        'productVariance.quantity': { $lt: 5 },
    })
        .populate('productCategory', 'categoryName') // Populate categoryName for low stock products as well
        .select('productTitle productVariance productCategory');

    // Format the low stock products to include remaining quantity
    const formattedLowStockProducts = lowStockProducts.map((product) => {
        return {
            productTitle: product.productTitle,
            categoryName: product.productCategory?.categoryName || 'Unknown',
            remainingQuantities: product.productVariance
                .filter((variant: any) => variant.quantity < 5)
                .map((variant: any) => ({
                    color: variant.color,
                    remainingQuantity: variant.quantity,
                })),
        };
    });

    // 4. Return the inventory data in the desired JSON format
    return res.status(200).json({
        success: true,
        totalInventory: totalInventoryCount, // Total inventory where quantity > 0
        products: formattedLowStockProducts, // Original low stock products list
        inventoryByCategory, // New category-based inventory data
    });
});



// export const getInventoryData = asyncErrorHandler(async (req, res, next) => {
//     // Define the categories you want to filter
//     const categories = ['smartphone', 'accessories', 'skin'];

//     // 1. Get total product count where quantity is greater than 0
//     const totalInventoryCount = await Product.countDocuments({
//         'productVariance.quantity': { $gt: 0 }, // Count products with quantity > 0
//     });

//     // 2. Fetch all products (not just low stock) for each category
//     const inventoryByCategory = await Promise.all(
//         categories.map(async (category) => {
//             // Count total inventory for the current category where quantity is greater than 0
//             const totalInventoryForCategory = await Product.countDocuments({
//                 productCategory: { categoryName: category },
//                 'productVariance.quantity': { $gt: 0 }, // Only count products with quantity > 0
//             });

//             // Fetch all products in the current category
//             const productsInCategory = await Product.find({
//                 productCategory: { categoryName: category }, // Adjust according to your schema
//             }).select('productTitle productVariance productCategory'); // Include productCategory for category data

//             // Format all products to include remaining quantities
//             const formattedProductsInCategory = productsInCategory.map((product) => {
//                 return {
//                     productTitle: product.productTitle,
//                     categoryName: product.productCategory?.categoryName || 'Unknown',
//                     remainingQuantities: product.productVariance.map((variant: any) => ({
//                         color: variant.color,
//                         remainingQuantity: variant.quantity,
//                     })),
//                 };
//             });

//             return {
//                 category,
//                 totalInventory: totalInventoryForCategory,
//                 products: formattedProductsInCategory,
//             };
//         })
//     );

//     // 3. Fetch low stock products (optional if you still need this)
//     const lowStockProducts = await Product.find({
//         'productVariance.quantity': { $lt: 5 },
//     }).select('productTitle productVariance productCategory');

//     // Format the low stock products to include remaining quantity
//     const formattedLowStockProducts = lowStockProducts.map((product) => {
//         return {
//             productTitle: product.productTitle,
//             remainingQuantities: product.productVariance
//                 .filter((variant: any) => variant.quantity < 5)
//                 .map((variant: any) => ({
//                     color: variant.color,
//                     remainingQuantity: variant.quantity,
//                 })),
//         };
//     });

//     // 4. Return the inventory data in the desired JSON format
//     return res.status(200).json({
//         success: true,
//         totalInventory: totalInventoryCount, // Total inventory where quantity > 0
//         products: formattedLowStockProducts, // Original low stock products list
//         inventoryByCategory, // New category-based inventory data
//     });
// });




// export const getInventoryData = asyncErrorHandler(async (req, res, next) => {
//     // Define categories to filter
//     const categories = ['smartphone', 'accessories', 'skin'];

//     // 1. Fetch products for each category and count total inventory
//     const inventoryByCategory = await Promise.all(
//         categories.map(async (category) => {
//             // Count total inventory for the current category
//             const totalInventoryCount = await Product.countDocuments({ category });

//             // Fetch products where any variant in the current category has less than 5 quantity
//             const lowStockProducts = await Product.find({
//                 category, // Filter by category
//                 'productVariance.quantity': { $lt: 5 },
//             }).select('productTitle productVariance');

//             // Format the low-stock products to include remaining quantities
//             const formattedLowStockProducts = lowStockProducts.map((product) => {
//                 return {
//                     productTitle: product.productTitle,
//                     remainingQuantities: product.productVariance
//                         .filter((variant: any) => variant.quantity < 5)
//                         .map((variant: any) => ({
//                             color: variant.color,
//                             remainingQuantity: variant.quantity,
//                         })),
//                 };
//             });

//             return {
//                 category,
//                 totalInventory: totalInventoryCount,
//                 products: formattedLowStockProducts,
//             };
//         })
//     );

//     // 3. Return the inventory data in the desired JSON format, grouped by category
//     return res.status(200).json({
//         success: true,
//         inventory: inventoryByCategory,
//     });
// });


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


