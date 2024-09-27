import { asyncErrorHandler } from "../middleware/error.middleware";
import { Brand } from "../models/brand/brand.model";
import { Category } from "../models/category/category.model";
import {
  NewBrandRequestBody,
  SearchBrandRequestQuery,
  brandBaseQuery,
  deleteBrandQuery,
} from "../types/types";
import { Request } from "express";
import ErrorHandler from "../utils/errorHandler";

//-------------Api to create new brand------------------------------------------------
export const newBrand = asyncErrorHandler(
  async (req: Request<{}, {}>, res, next) => {
    const { brandName, brandImgUrl, brandLogoUrl, categoryArray, brandKeywords } = req.body;
    let brandKeywordsArr;
    console.log(brandKeywords, "brandKeywords")
    if (brandKeywords) {

      brandKeywordsArr = brandKeywords.split(",")

    }
    console.log(brandKeywordsArr)
    if (categoryArray.length === 0) return next(new ErrorHandler("Category name not provided", 400));

    // Check if category exists by name

    // const category = await Category.findOne({ categoryName: categoryName });
    // if (!category) return next(new ErrorHandler("Category not found", 400));

    // Check if the brand already exists in the category
    // const existingBrand = await Brand.findOne({ brandName, categories: category._id });

    const existingBrand = await Brand.findOne({ brandName });
    console.log("existing brand found", existingBrand)
    if (existingBrand) {
      if (brandName) {
        existingBrand.brandName = brandName
      }
      if (brandKeywords) {
        existingBrand.branKeywords = brandKeywordsArr
      }
      if (brandImgUrl) {
        existingBrand.brandImgUrl = brandImgUrl
      }
      if (brandLogoUrl) {
        existingBrand.brandLogoUrl = brandLogoUrl
      }
      if (categoryArray.length !== 0) {
        existingBrand.categories = categoryArray
      }

      await existingBrand.save();
      return res.status(201).json({
        success: true,
        message: "brand updated successfully",
        data: existingBrand,
      });
    } else {
      // Create new brand
      const brand = await Brand.create({
        brandName,
        brandImgUrl: brandImgUrl ? brandImgUrl : null,
        brandLogoUrl: brandLogoUrl ? brandLogoUrl : null,
        branKeywords: brandKeywordsArr,
        categoryArray
      });
      return res.status(201).json({
        success: true,
        message: "New brand created successfully",
        data: brand,
      });
    }
  }
);

//-----------------Api to get all brand---------------------------------------------
export const getAllBrand = asyncErrorHandler(
  async (req: Request<{}, {}, SearchBrandRequestQuery>, res, next) => {
    const { categoryName } = req.query;
    console.log(req.query, "query")
    const baseQuery = { categories: "" };






    if (categoryName) {
      const category = await Category.findOne({ categoryName: categoryName });
      if (!category) return next(new ErrorHandler("category not found", 400));
      baseQuery.categories = category._id;
    }

    const allBrand = await Brand.find(baseQuery);
    return res.status(200).json({
      success: true,
      message: "All brands fetched successfully",
      allBrand,
    });
  }
);
interface brandWithoutCategory {
  categories?: string;
}
export const getAllBrandWithoutCategory = asyncErrorHandler(
  async (req: Request<{}, {}, SearchBrandRequestQuery>, res, next) => {
    const { categoryName, brandId } = req.query;
    console.log(req.query, "query")
    let baseQuery: any = {}

    if (brandId) {
      if (typeof brandId !== "string") {
        return
      }
      baseQuery._id = brandId
    }

    if (categoryName) {
      const category = await Category.findOne({ categoryName: categoryName });
      // if (!category) return next(new ErrorHandler("category not found", 400));
      baseQuery.categories = category._id;

    }



    const allBrand = await Brand.find(baseQuery);
    return res.status(200).json({
      success: true,
      message: "All brands fetched successfully",
      allBrand,
    });
  }
);

//-----------------Api to delete brand----------------------------------------
export const deleteBrand = asyncErrorHandler(
  async (req, res, next) => {
    const { brandName, categoryName } = req.body;

    if (!brandName || !categoryName) {
      return next(new ErrorHandler("please provide brand name and category name", 400));
    }

    // Find category ID
    const category = await Category.findOne({ categoryName });
    if (!category) {
      return next(new ErrorHandler("Category not found", 400));
    }

    // Find brand and remove category from categories array
    const updatedBrand = await Brand.findOneAndUpdate(
      { brandName },
      { $pull: { categories: category._id } },
      { new: true }
    );

    if (!updatedBrand) {
      return next(new ErrorHandler("No brand found", 400));
    }

    // Check if category is removed
    if (!updatedBrand.categories.includes(category._id)) {
      return res.status(200).json({
        success: true,
        message: "Category removed from brand successfully",
        updatedBrand,
      });
    } else {
      return next(new ErrorHandler("Failed to remove category from brand", 400));
    }
  }
);