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

//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.newBrand
// 2.getAllBrand
// 3.deleteBrand

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------

//-------------Api to create new brand------------------------------------------------
export const newBrand = asyncErrorHandler(
  async (req: Request<{}, {}, NewBrandRequestBody>, res, next) => {
    const { brandName, brandImgUrl, brandLogoUrl } = req.body;
    // console.log(brandName);

    const brand = await Brand.create({
      brandName,
      brandImgUrl,
      brandLogoUrl,
    });

    if (!brandName || !brandLogoUrl || !brandImgUrl) {
      return next(new ErrorHandler("please provide all fields", 400));
    }

    return res.status(201).json({
      success: true,
      message: "New brand created successfully",
      data: brand,
    });
  }
);


//-----------------Api to get all brand---------------------------------------------
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
