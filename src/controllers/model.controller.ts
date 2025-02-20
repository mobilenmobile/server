import { Types } from "mongoose";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Brand } from "../models/brand/brand.model";
import { Model } from "../models/brand/model.model";
import { Category } from "../models/category/category.model";
import ErrorHandler from "../utils/errorHandler";

// // Controller to create a new model
// export const newModel = asyncErrorHandler(
//     async (req, res, next) => {
//         const { modelName, brandName, categoryName } = req.body;

//         if (!brandName || !categoryName) {
//             return next(new ErrorHandler("Brand name and category name are required", 400));
//         }
//         // Check if category exists by name
//         const category = await Category.findOne({ categoryName: categoryName });
//         if (!category) {
//             return next(new ErrorHandler("Category not found", 404));
//         }
//         // Check if brand exists by name
//         const brand = await Brand.findOne({ category: category._id, brandName: new RegExp(`^${brandName as string}$`, 'i') });
//         if (!brand) {
//             return next(new ErrorHandler("Brand not found", 404));
//         }

//         // Check if model already exists for the brand and category
//         const existingModel = await Model.findOne({ modelName, brand: brand._id, category: category._id });
//         if (existingModel) {
//             return next(new ErrorHandler('Model name already exists for this brand and category', 400));
//         }

//         // Create the new model
//         const model = await Model.create({
//             modelName,
//             brand: brand._id,
//             category: category._id
//         });

//         return res.status(201).json({
//             success: true,
//             message: "New model created successfully",
//             data: model,
//         });
//     }
// );



export const deleteTodayModels = async () => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find the smartphone category
        const category = await Category.findOne({ categoryName: "smartphone" });

        if (!category) {
            console.log("Smartphone category not found");
            return;
        }

        // Find and delete models created today under smartphone category
        const result = await Model.deleteMany({
            category: category._id,
            createdAt: { $gte: todayStart, $lte: todayEnd }
        });

        console.log(`Deleted ${result.deletedCount} models created today under the smartphone category`);
    } catch (error) {
        console.error("Error deleting models:", error);
    }
};













// Controller to create a new model
export const newModel = asyncErrorHandler(async (req, res, next) => {
    const { modelName, brandName, categoryName } = req.body;

    // Validate required fields
    if (!brandName || !categoryName) {
        return next(new ErrorHandler("Brand name and category name are required", 400));
    }

    // Normalize inputs by converting to lowercase and trimming extra spaces
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();

    const normalizedCategoryName = normalize(categoryName);
    const normalizedBrandName = normalize(brandName);
    const normalizedModelName = normalize(modelName);

    // Check if category exists by normalized name
    const category = await Category.findOne({ categoryName: normalizedCategoryName });
    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    // Check if brand exists by normalized name and matches the found category
    const brand = await Brand.findOne({
        brandName: new RegExp(`^${normalizedBrandName}$`, 'i'),
        categories: category._id // Ensure the brand has the category
    });

    if (!brand) {
        return next(new ErrorHandler("Brand not found", 404));
    }

    // Check if model already exists for the brand and category
    const existingModel = await Model.findOne({
        modelName: normalizedModelName,
        brand: brand._id,
        category: category._id
    });

    if (existingModel) {
        return next(new ErrorHandler('Model name already exists for this brand and category', 400));
    }

    // Create the new model
    const model = await Model.create({
        modelName: normalizedModelName,
        brand: brand._id,
        category: category._id
    });

    return res.status(201).json({
        success: true,
        message: "New model created successfully",
        data: model
    });
})


//update model 
export const updateModel = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { modelName, brandName, categoryName } = req.body;

    // Check if the model exists
    const existingModel = await Model.findById(id);
    if (!existingModel) {
        return next(new ErrorHandler("Model not found", 404));
    }

    // Normalize inputs by converting to lowercase and trimming extra spaces
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();

    // Only normalize fields that are provided
    const normalizedModelName = modelName ? normalize(modelName) : undefined;
    const normalizedBrandName = brandName ? normalize(brandName) : undefined;
    const normalizedCategoryName = categoryName ? normalize(categoryName) : undefined;

    let updatedFields: any = {};

    // If category name is provided, verify it exists
    if (normalizedCategoryName) {
        const category = await Category.findOne({ categoryName: normalizedCategoryName });
        if (!category) {
            return next(new ErrorHandler("Category not found", 404));
        }
        updatedFields.category = category._id;
    }

    // If brand name is provided, verify it exists and is associated with the category
    if (normalizedBrandName) {
        const category = updatedFields.category || existingModel.category;
        const brand = await Brand.findOne({
            brandName: new RegExp(`^${normalizedBrandName}$`, 'i'),
            categories: category
        });

        if (!brand) {
            return next(new ErrorHandler("Brand not found or not associated with the category", 404));
        }
        updatedFields.brand = brand._id;
    }

    // If model name is provided, check for duplicates
    if (normalizedModelName) {
        const duplicateModel = await Model.findOne({
            modelName: normalizedModelName,
            brand: updatedFields.brand || existingModel.brand,
            category: updatedFields.category || existingModel.category,
            _id: { $ne: id } // Exclude current model from duplicate check
        });

        if (duplicateModel) {
            return next(new ErrorHandler('Model name already exists for this brand and category', 400));
        }
        updatedFields.modelName = normalizedModelName;
    }

    // Update the model with new fields
    const updatedModel = await Model.findByIdAndUpdate(
        id,
        { $set: updatedFields },
        { new: true, runValidators: true }
    );

    return res.status(200).json({
        success: true,
        message: "Model updated successfully",
        data: updatedModel
    });
});
// /-----------------Api to delete brand----------------------------------------

export const deleteModel = asyncErrorHandler(
    async (req, res, next) => {
        const { id } = req.body;
        const { modelId } = req.params

        // console.log(req.body);

        if (!modelId) {
            return next(new ErrorHandler("please provide model id", 400));
        }

        const deleteModel = await Model.findByIdAndDelete(modelId);

        if (!deleteModel) {
            return next(new ErrorHandler("No brand found ", 400));
        }

        return res.status(200).json({
            success: true,
            message: "successfully deleted the model",
            deleteModel,
        });
    }
);





// // Controller to create a new model
// export const newModel = asyncErrorHandler(
//     async (req, res, next) => {
//         const { modelName, brandId, categoryId } = req.body;

//         if (!brandId || !categoryId) return next(new ErrorHandler("Brand ID and Category ID are required", 400));

//         // Check if brand exists
//         const brand = await Brand.findById(brandId);
//         if (!brand) return next(new ErrorHandler("Brand not found", 404));

//         // Check if category exists
//         const category = await Category.findById(categoryId);
//         if (!category) return next(new ErrorHandler("Category not found", 404));

//         // Check if model already exists for the brand and category
//         const existingModel = await Model.findOne({ modelName, brand: brand._id, category: category._id });
//         if (existingModel) return next(new ErrorHandler('Model name already exists for this brand and category', 400));

//         // Create the new model
//         const model = await Model.create({
//             modelName,
//             brand: brandId,
//             category: categoryId
//         });

//         return res.status(201).json({
//             success: true,
//             message: "New model created successfully",
//             data: model,
//         });
//     }
// );



// Controller to search models by category name and/or brand name
export const searchModelsv2 = asyncErrorHandler(
    async (req, res, next) => {
        const { categoryName, brandName } = req.query; // Changed to use query parameters
        console.log("req query", req.query)
        let query = { category: "", brand: "" };

        if (categoryName) {
            // Find category by name
            const category = await Category.findOne({ categoryName: categoryName });
            if (!category) return next(new ErrorHandler("Category not found", 404));
            query.category = category._id; // Use the category ID in the query
            console.log(query, "query...........")
        }
        console.log("############", query.category)

        if (brandName) {
            // // Find brand by name
            // const brand = await Brand.findOne({ category: query.category, brandName: brandName });
            // if (!brand) return next(new ErrorHandler("Brand not found", 404));
            // query.brand = brand._id; // Use the brand ID in the query
            const brand = await Brand.findOne({
                brandName: new RegExp(`^${brandName}$`, 'i'),
                categories: query.category  // Ensure the brand has the category
            });
            query.brand = brand._id; // Use the brand ID in the query
        }


        console.log("query 2", query)

        try {
            // Find models based on the query
            const models = await Model.find(query)
            return res.status(200).json({
                success: true,
                data: models,
            });
        } catch (err) {
            return next(new ErrorHandler("Error in searching models", 500));
        }
    }
);



// Controller to search models by category and/or brand
export const searchModels = asyncErrorHandler(
    async (req, res, next) => {
        const { categoryId, brandId } = req.body;

        let query = { category: "", brand: "" };

        if (categoryId) {
            // Validate categoryId
            const category = await Category.findById(categoryId);
            if (!category) return next(new ErrorHandler("Category not found", 404));
            query.category = categoryId;
        }

        if (brandId) {
            // Validate brandId
            const brand = await Brand.findById(brandId);
            if (!brand) return next(new ErrorHandler("Brand not found", 404));
            query.brand = brandId;
        }

        try {
            // Find models based on the query
            const models = await Model.find(query)
                .populate('brand')
                .populate('category');

            return res.status(200).json({
                success: true,
                data: models,
            });
        } catch (err) {
            return next(new ErrorHandler("err in seraching", 500));
        }
    }
);


//get formatted data to show at skin page
interface FormattedResponse {
    [category: string]: { [brand: string]: string[] };
}




export const getFormattedModels = asyncErrorHandler(async (req, res, next) => {
    try {
        const categoryNames = ["smartphone", "laptop"];

        // Fetch categories and convert to ObjectIds
        const categories = await Category.find({
            categoryName: { $in: categoryNames }
        });

        if (!categories.length) {
            return next(new ErrorHandler("No categories found", 404));
        }

        // Create category mapping
        const categoryMap = categories.reduce((map, category) => {
            map[category._id.toString()] = category.categoryName.toLowerCase();
            return map;
        }, {} as Record<string, string>);

        // Convert category IDs to ObjectIds for proper matching
        const categoryIds = categories.map(cat => new Types.ObjectId(cat._id));

        const result = await Model.aggregate([
            {
                $match: {
                    category: { $in: categoryIds }  // Use ObjectIds for matching
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "brand",
                    foreignField: "_id",
                    as: "brandData"
                }
            },
            {
                $unwind: {
                    path: "$brandData",
                    preserveNullAndEmptyArrays: false  // Skip documents with no brand match
                }
            },
            {
                $group: {
                    _id: {
                        categoryId: "$category",
                        brandName: "$brandData.brandName"
                    },
                    models: {
                        $push: "$modelName"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id.categoryId",
                    brand: "$_id.brandName",
                    models: 1
                }
            }
        ]);

        // Format the response
        const formattedResponse: Record<string, Record<string, string[]>> = {};

        result.forEach(({ category, brand, models }) => {
            const categoryKey = categoryMap[category.toString()];

            if (!formattedResponse[categoryKey]) {
                formattedResponse[categoryKey] = {};
            }

            formattedResponse[categoryKey][brand] = models;
        });

        // Check if we have any data
        const hasData = Object.keys(formattedResponse).length > 0;

        if (!hasData) {
            return next(new ErrorHandler("No models found", 404));
        }

        return res.status(200).json({
            success: true,
            data: formattedResponse
        });

    } catch (err) {
        console.error('Error in getFormattedModels:', err);
        return next(new ErrorHandler("Error fetching models", 500));
    }
});

// export const getFormattedModels = asyncErrorHandler(async (req, res, next) => {
//     try {
//         const categoryNames = ["smartphone", "laptop", "tablet"];

//         const categories = await Category.find({ categoryName: { $in: categoryNames } });
//         console.log("categories", categories)
//         if (!categories.length) {
//             return next(new ErrorHandler("No categories found", 404));
//         }

//         const categoryMap: Record<string, string> = categories.reduce((map, category) => {
//             map[category.categoryName.toLowerCase()] = category._id.toString();
//             return map;
//         }, {} as Record<string, string>);

//         console.log("categorymap ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^", categoryMap)

//         const result = await Model.aggregate([
//             { $match: { category: { $in: Object.values(categoryMap) } } },
//             { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brandData" } },
//             { $unwind: "$brandData" },
//             {
//                 $group: {
//                     _id: { category: "$category", brandName: "$brandData.brandName" },
//                     models: { $push: "$modelName" }
//                 }
//             },
//             { $lookup: { from: "categories", localField: "_id.category", foreignField: "_id", as: "categoryData" } },
//             { $unwind: "$categoryData" },
//             {
//                 $project: {
//                     _id: 0,
//                     category: "$categoryData.categoryName",
//                     brand: "$_id.brandName",
//                     models: 1
//                 }
//             }
//         ]);

//         // **✅ Fix: Use defined type**
//         let formattedResponse: FormattedResponse = {};

//         result.forEach(({ category, brand, models }) => {
//             const categoryKey = category.toLowerCase();

//             if (!formattedResponse[categoryKey]) {
//                 formattedResponse[categoryKey] = {};
//             }

//             formattedResponse[categoryKey][brand] = models;
//         });

//         return res.status(200).json({
//             success: true,
//             data: formattedResponse
//         });

//     } catch (err) {
//         return next(new ErrorHandler("Error fetching models", 500));
//     }
// });
