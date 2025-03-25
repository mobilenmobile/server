import { asyncErrorHandler } from "../middleware/error.middleware";

import { Request } from "express";


import ErrorHandler from "../utils/errorHandler";
import { subCategory } from "../models/subCategory/subCategory.model";
import { CategoryBaseQuery } from "../types/types";
import { Category } from "../models/category/category.model";

//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.addNewsubCategory
// 2.searchsubCategory
// 3.deletesubCategory

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------

//------------ api to create new category-----------------------------------------
export const addNewsubCategory = asyncErrorHandler(
    async (req: Request, res, next) => {
        const { categoryName, subCategoryName } = req.body;
        console.log(req.body)
        if (!categoryName || !subCategoryName) {
            return next(new ErrorHandler("please provide subcategory name", 400));
        }

        const CategoryName = categoryName
            .toLowerCase()         // Convert to lowercase
            .trim()                // Remove extra spaces from the sides
            .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
        const SubCategoryName = subCategoryName
            .toLowerCase()         // Convert to lowercase
            .trim()                // Remove extra spaces from the sides
            .replace(/\s+/g, ' '); // Replace multiple spaces with a single space



        const refCategory = await Category.findOne({ categoryName: CategoryName })
        if (!refCategory) {
            return next(new ErrorHandler("category not found", 404))
        }

        const category = await subCategory.create({
            categoryId: refCategory._id,
            subCategoryName: SubCategoryName,

        });
        return res.status(201).json({
            success: true,
            message: "New subcategory created successfully",
            category
        });
    }
);

//------------------api to search category------------------------------------------
export const searchsubCategory = asyncErrorHandler(
    async (req: Request, res, next) => {
        const { categoryname } = req.query;

        const baseQuery: CategoryBaseQuery = {};

        if (categoryname) {
            if (typeof categoryname !== "string") {
                return;
            }

            baseQuery.categoryName = {
                $regex: categoryname,
                $options: "i",
            };
        }

        const category = await subCategory.find(baseQuery);

        if (category.length === 0) {
            return next(new ErrorHandler("subcategory not found", 400));
        }

        return res.status(200).json({
            success: true,
            message: "subcategory found successfully",
            category,
        });
    }
);

//-------------------api to delete specfic category-----------------------------------
export const deletesubCategory = asyncErrorHandler(
    async (req: Request, res, next) => {
        const { subCategoryId } = req.body;
        
        console.log(req.body);

        if (!subCategoryId) {
            return res.status(400).json({ error: "provide id" });
        }

        const deletesubCategory = await subCategory.findByIdAndDelete(subCategoryId);

        if (!deletesubCategory) {
            return res.status(400).json({ error: "subcategory doesnt exist" });
        }

        return res.status(200).json({
            success: true,
            message: "successfully deleted the subcategory",
            deletesubCategory,
        });
    }
);
