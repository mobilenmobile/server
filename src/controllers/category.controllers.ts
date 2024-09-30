import { asyncErrorHandler } from "../middleware/error.middleware";
import { Category } from "../models/category/category.model";
import { Request } from "express";

import {
  CategoryBaseQuery,
  NewCategoryRequestBody,
  SearchCategoryQuery,
  deleteCategoryQuery,
} from "../types/types";
import ErrorHandler from "../utils/errorHandler";

//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.addNewCategory
// 2.searchCategory
// 3.deleteCategory

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------


//------------ api to create new category-----------------------------------------

export const addNewCategory = asyncErrorHandler(
  async (req: Request<{}, {}, NewCategoryRequestBody>, res, next) => {
    const { categoryName, categoryImgUrl } = req.body;
    const { categoryId } = req.query
    console.log(req.body)
    let categoryKeywordsArr;
    if (!categoryName) {
      return next(new ErrorHandler("please provide category name.", 400));
    }


    const exisitingCategory = await Category.findOne({ _id: categoryId })
    console.log(exisitingCategory, "category eixsitn")
    if (exisitingCategory) {
      if (categoryName) {
        exisitingCategory.categoryName = categoryName

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
        categoryName,
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
