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


export const addNewCategory = asyncErrorHandler(
  async (req: Request<{}, {}, NewCategoryRequestBody>, res, next) => {
    const { categoryName, categoryDescription, categoryImgUrl } = req.body;

    if (!categoryName || !categoryImgUrl) {
        return next(new ErrorHandler("please provide category name/images.", 400));
    }

    const category = await Category.create({
      categoryName,
      categoryDescription,
      categoryImgUrl,
    });
    return res.status(201).json({ success: true, category });
  }
);

export const searchCategory = asyncErrorHandler(
  async (req: Request<{}, {}, SearchCategoryQuery>, res, next) => {
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

    const category = await Category.find(baseQuery);

    if (category.length === 0) {
      return next(new ErrorHandler("category not found", 400));
    }

    return res.status(200).json({
      success: true,
      category,
    });
  }
);

export const deleteCategory = asyncErrorHandler(
  async (req: Request<{}, {}, deleteCategoryQuery>, res, next) => {
    const { id } = req.body;

    console.log(req.body);

    if (!id) {
      return res.status(400).json({ error: "provide id" });
    }

    const deleteCategory = await Category.findByIdAndDelete(id);

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
