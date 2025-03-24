import { asyncErrorHandler } from "../middleware/error.middleware";
import { Category } from "../models/category/category.model";
import { Request } from "express";

import {
  CategoryBaseQuery,
  NewCategoryRequestBody,
  NewSubCategoryRequestBody,
  SearchCategoryQuery,
  deleteCategoryQuery,
} from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import { subCategory } from "../models/subCategory/subCategory.model";

//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.addNewCategory
// 2.searchCategory
// 3.deleteCategory

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------


//------------ api to create new category-----------------------------------------

export const addNewCategory = asyncErrorHandler(
  async (req: Request<{}, {}, NewCategoryRequestBody>, res, next) => {
    const { categoryName, categoryImgUrl, redeemedCoin } = req.body;

    // Normalize the categoryName
    const updatedCategoryName = categoryName
      .toLowerCase()         // Convert to lowercase
      .trim()                // Remove extra spaces from the sides
      .replace(/\s+/g, ' '); // Replace multiple spaces with a single space


    const { categoryId } = req.query
    console.log(req.body)
    let categoryKeywordsArr;
    if (!updatedCategoryName) {
      return next(new ErrorHandler("please provide category name.", 400));
    }


    const exisitingCategory = await Category.findOne({ _id: categoryId })
    console.log(exisitingCategory, "category eixsitn")
    if (exisitingCategory) {
      if (updatedCategoryName) {
        exisitingCategory.categoryName = updatedCategoryName

      }
      if (redeemedCoin) {
        exisitingCategory.redeemedCoin = redeemedCoin
      }

      if (categoryImgUrl) {
        exisitingCategory.categoryImgUrl = categoryImgUrl ?? ""
      }
      await exisitingCategory.save()
      return res.status(201).json({
        success: true,
        message: "category updated successfully",
        category: exisitingCategory
      })
    }
    else {

      const category = await Category.create({
        categoryName: updatedCategoryName,
        redeemedCoin,
        categoryImgUrl: categoryImgUrl ? categoryImgUrl : "",
      });
      return res.status(201).json({
        success: true,
        message: "New category created successfully",
        category
      });
    }

  }
);
export const addNewSubCategory = asyncErrorHandler(
  async (req: Request<{}, {}, NewSubCategoryRequestBody>, res, next) => {
    const { categoryName, subCategoryName } = req.body;

    // Normalize the categoryName
    const CategoryName = categoryName
      .toLowerCase()         // Convert to lowercase
      .trim()                // Remove extra spaces from the sides
      .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
    // Normalize the categoryName
    const normalizedSubCategoryName = subCategoryName
      .toLowerCase()         // Convert to lowercase
      .trim()                // Remove extra spaces from the sides
      .replace(/\s+/g, ' '); // Replace multiple spaces with a single space



    console.log(req.body)

    if (!categoryName) {
      return next(new ErrorHandler("please provide category name.", 400));
    }


    const exisitingCategory = await Category.findOne({ categoryName: categoryName })
    // console.log(exisitingCategory, "category eixsitn")
    if (!exisitingCategory) {
      return next(new ErrorHandler("No category found.", 400));
    }

    const category = await subCategory.create({
      categoryId: exisitingCategory._id,
      subCategoryName: normalizedSubCategoryName,
    });

    return res.status(201).json({
      success: true,
      message: "New category created successfully",
      category
    });
  }

);

//------------------api to search category------------------------------------------
export const searchCategory = asyncErrorHandler(
  async (req: Request<{}, {}, SearchCategoryQuery>, res, next) => {
    const { categoryname, categoryId } = req.query;

    const baseQuery: CategoryBaseQuery = {};

    if (categoryId) {
      if (typeof categoryId !== "string") {
        return;
      }
      baseQuery._id = categoryId

    }

    const category = await Category.find(baseQuery);
    console.log(category)
    if (category.length === 0) {
      return next(new ErrorHandler("category not found", 400));
    }

    return res.status(200).json({
      success: true,
      message: "category found successfully",
      category,
    });
  }
);
export const getAllSubCategory = asyncErrorHandler(
  async (req: Request<{}, {}, {}, { categoryName?: string }>, res, next) => {
    const { categoryName } = req.query;
    console.log(categoryName)
    const query: any = {};
    if (categoryName) {
      const category = await Category.findOne({ categoryName: categoryName });
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      query.categoryId = category._id;
    }

    const subCategoryRes = await subCategory.find(query).populate("categoryId");

    return res.status(200).json({
      success: true,
      message: "Subcategories found successfully",
      subCategory: subCategoryRes,
    });
  }
);

//-------------------api to delete specfic category-----------------------------------
export const deleteCategory = asyncErrorHandler(
  async (req, res, next) => {
    const { categoryId } = req.params

    // console.log(req.body);

    if (!categoryId) {
      return res.status(400).json({ error: "provide id" });
    }

    const deleteCategory = await Category.findByIdAndDelete(categoryId);

    if (!deleteCategory) {
      return res.status(400).json({ error: "category doesnt exist" });
    }

    return res.status(200).json({
      success: true,
      message: "successfully deleted the category",
      deleteCategory,
    });
  }
);
