import { asyncErrorHandler } from "../middleware/error.middleware";
import { Brand } from "../models/brand/brand.model";
import {
  NewBrandRequestBody,
  SearchBrandRequestQuery,
  brandBaseQuery,
  deleteBrandQuery,
} from "../types/types";
import { Request } from "express";
import ErrorHandler from "../utils/errorHandler";
import { Category } from "../models/category/category.model";

//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.newBrand
// 2.getAllBrand
// 3.deleteBrand

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------

//-------------Api to create new brand------------------------------------------------
export const newBrandv2 = asyncErrorHandler(
  async (req: Request, res, next) => {
    const { brandName, brandImgUrl, brandLogoUrl, categoryName } = req.body;

    if (!categoryName) return next(new ErrorHandler("Category name not provided", 400));

    // Check if category exists by name
    const category = await Category.findOne({ categoryName: categoryName });
    if (!category) return next(new ErrorHandler("Category not found", 400));

    // Check if the brand already exists in the category
    const existingBrand = await Brand.findOne({ brandName, category: category._id });
    if (existingBrand) return next(new ErrorHandler('Brand name already exists in this category', 400));

    // Create the new brand
    const brand = await Brand.create({
      brandName,
      brandImgUrl: brandImgUrl ? brandImgUrl : null,
      brandLogoUrl: brandLogoUrl ? brandLogoUrl : null,
      category: category._id
    });

    // Respond with success
    return res.status(201).json({
      success: true,
      message: "New brand created successfully",
      data: brand,
    });
  }
);


export const newBrand = asyncErrorHandler(
  async (req: Request<{}, {}, NewBrandRequestBody>, res, next) => {
    const { brandName, brandImgUrl, brandLogoUrl } = req.body;
    // console.log(brandName);

    if (!brandName) {
      return next(new ErrorHandler("please provide all fields", 400));
    }

    const brand = await Brand.create({
      brandName,
      brandImgUrl: brandImgUrl ? brandImgUrl : null,
      brandLogoUrl: brandLogoUrl ? brandLogoUrl : null,
    });

    return res.status(201).json({
      success: true,
      message: "New brand created successfully",
      data: brand,
    });
  }
);


//-----------------Api to get all brand---------------------------------------------
export const getAllBrandv2 = asyncErrorHandler(
  async (req: Request, res, next) => {
    const { categoryName } = req.query;

    if (!categoryName) return next(new ErrorHandler("category not found", 400));

    const category = await Category.findOne({ categoryName: categoryName });
    if (!category) return next(new ErrorHandler("category not found", 400));


    const allbrands = await Brand.find({ category: category._id })

    return res.status(200).json({
      success: true,
      message: "All brands fetched successfully",
      allBrand: allbrands,
    });
  }
);
export const getAllBrand = asyncErrorHandler(
  async (req: Request<{}, {}, SearchBrandRequestQuery>, res, next) => {
    const { brandname } = req.query;
    // console.log(brandname);

    const baseQuery: brandBaseQuery = {};
    // console.log(baseQuery);

    if (brandname) {
      if (typeof brandname !== "string") {
        return;
      }
      baseQuery.brandName = {
        $regex: brandname,
        $options: "i",
      };
    }
    const allBrand = await Brand.find(baseQuery);
    // console.log(allBrand);

    return res.status(200).json({
      success: true,
      message: "All brands fetched successfully",
      allBrand,
    });
  }
);

//-----------------Api to delete brand----------------------------------------
export const deleteBrand = asyncErrorHandler(
  async (req: Request<{}, {}, deleteBrandQuery>, res, next) => {
    const { id } = req.body;

    // console.log(req.body);

    if (!id) {
      return next(new ErrorHandler("please provide aid", 400));
    }

    const deleteBrand = await Brand.findByIdAndDelete(id);

    if (!deleteBrand) {
      return next(new ErrorHandler("No brand found ", 400));
    }

    return res.status(200).json({
      success: true,
      message: "successfully deleted the brand",
      deleteBrand,
    });
  }
);
