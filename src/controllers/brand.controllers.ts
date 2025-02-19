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
    const { categoryName, brandName, brandImgUrl, brandLogoUrl, categoryArray } = req.body;
    const { brandId } = req.query

    console.log(req.body)

    // Check if category exists by name
    const brandNameTrimmedLowercase = brandName.trim().toLowerCase();
    const existingBrand = await Brand.findOne({ brandName: brandNameTrimmedLowercase });
    if (categoryName) {

      const categoryNameTrimmedLowercase = categoryName.trim().toLowerCase();
      const category = await Category.findOne({ categoryName: categoryNameTrimmedLowercase });
      if (!category) return next(new ErrorHandler("category not found", 400));

      if (existingBrand) {

        if (!existingBrand.categories.includes(category._id)) {
          existingBrand.categories.push(category._id); // Add category ID if not already present
          await existingBrand.save();
        }

        return res.status(201).json({
          success: true,
          message: "brand updated successfully",
          data: existingBrand,
        });
      }
      else {
        const brand = await Brand.create({
          brandName,
          brandImgUrl: null,
          brandLogoUrl: null,
          categories: [category._id]
        });
        return res.status(201).json({
          success: true,
          message: "New brand created successfully",
          data: brand,
        });
      }

    }
    // if (!category) return next(new ErrorHandler("Category not found", 400));

    // Check if the brand already exists in the category
    // const existingBrand = await Brand.findOne({ brandName, categories: category._id });

    // const existingBrand = await Brand.findOne({ _id: brandId });
    console.log("existing brand found", existingBrand)


    if (categoryArray.length === 0) return next(new ErrorHandler("Category name not provided", 400));
    if (existingBrand) {
      console.log("updating existing brand....")
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
        categories: categoryArray
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

    if (!categoryName) return next(new ErrorHandler("category not found", 400));

    const baseQuery = { categories: "" };

    if (categoryName) {
      const category = await Category.findOne({ categoryName: categoryName });
      if (!category) return next(new ErrorHandler("category not found", 400));
      baseQuery.categories = category._id;
    }


    // Fetch all brands sorted by the created date in descending order
    const allBrand = await Brand.find(baseQuery).sort({ createdAt: -1 }); // Assuming 'createdAt' is the field you use for creation date

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
    const { brandId } = req.params
    console.log(brandId, "id id id")
    const offer = await Brand.findById(brandId);
    if (!offer) {
      return next(new ErrorHandler("brand not found", 404));
    }
    await offer.deleteOne();
    return res.status(200).json({
      success: true,
      message: "brand Deleted Successfully",
    });
    //   const { brandName, categoryName } = req.body;

    //   if (!brandName || !categoryName) {
    //     return next(new ErrorHandler("please provide brand name and category name", 400));
    //   }

    //   // Find category ID
    //   const category = await Category.findOne({ categoryName });
    //   if (!category) {
    //     return next(new ErrorHandler("Category not found", 400));
    //   }

    //   // Find brand and remove category from categories array
    //   const updatedBrand = await Brand.findOneAndUpdate(
    //     { brandName },
    //     { $pull: { categories: category._id } },
    //     { new: true }
    //   );

    //   if (!updatedBrand) {
    //     return next(new ErrorHandler("No brand found", 400));
    //   }

    //   // Check if category is removed
    //   if (!updatedBrand.categories.includes(category._id)) {
    //     return res.status(200).json({
    //       success: true,
    //       message: "Category removed from brand successfully",
    //       updatedBrand,
    //     });
    //   } else {
    //     return next(new ErrorHandler("Failed to remove category from brand", 400));
    //   }
    // }
  }
);