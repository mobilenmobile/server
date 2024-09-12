import { asyncErrorHandler } from "../middleware/error.middleware";
import { Brand } from "../models/brand/brand.model";
import { Model } from "../models/brand/model.model";
import { Category } from "../models/category/category.model";
import ErrorHandler from "../utils/errorHandler";

// Controller to create a new model
export const newModel = asyncErrorHandler(
    async (req, res, next) => {
        const { modelName, brandName, categoryName } = req.body;

        if (!brandName || !categoryName) {
            return next(new ErrorHandler("Brand name and category name are required", 400));
        }
        // Check if category exists by name
        const category = await Category.findOne({ categoryName: categoryName });
        if (!category) {
            return next(new ErrorHandler("Category not found", 404));
        }
        // Check if brand exists by name
        const brand = await Brand.findOne({ category: category._id, brandName:new RegExp(`^${brandName as string}$`, 'i') });
        if (!brand) {
            return next(new ErrorHandler("Brand not found", 404));
        }

        // Check if model already exists for the brand and category
        const existingModel = await Model.findOne({ modelName, brand: brand._id, category: category._id });
        if (existingModel) {
            return next(new ErrorHandler('Model name already exists for this brand and category', 400));
        }

        // Create the new model
        const model = await Model.create({
            modelName,
            brand: brand._id,
            category: category._id
        });

        return res.status(201).json({
            success: true,
            message: "New model created successfully",
            data: model,
        });
    }
);


// /-----------------Api to delete brand----------------------------------------

export const deleteModel = asyncErrorHandler(
    async (req, res, next) => {
        const { id } = req.body;

        // console.log(req.body);

        if (!id) {
            return next(new ErrorHandler("please provide aid", 400));
        }

        const deleteModel = await Model.findByIdAndDelete(id);

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
        }

        if (brandName) {
            // Find brand by name
            const brand = await Brand.findOne({ category: query.category, brandName: brandName });
            if (!brand) return next(new ErrorHandler("Brand not found", 404));
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
