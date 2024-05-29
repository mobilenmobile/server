import { rm as removeFile } from "fs";
import { asyncErrorHandler } from "../middleware/error.middleware.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
  UpdateProductRequestBody,
} from "../types/types.js";
import ErrorHandler from "../utils/errorHandler.js";
import { NextFunction, Request, response } from "express";
import { myCache } from "../app.js";
import { ClearCache } from "../utils/features.js";
import { Product } from "../models/product/product.model.js";
import { Category } from "../models/category/category.model.js";
import { Brand } from "../models/brand/brand.model.js";
import {
  deleteImgInCloudinary,
  uploadMultipleCloudinary,
} from "../utils/cloudinary.js";

import { FilterQuery } from "mongoose";
export const newProduct = asyncErrorHandler(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    console.log("----------------", req.body, "----------------");
    const {
      category,
      brand,
      productModel,
      productTitle,
      offers,
      description,
      pattern,
      headsetType,
      variance,
    } = req.body;

    console.log("new product req body=>", JSON.parse(variance));

    if (!brand || !category || !productModel) {
      return next(new ErrorHandler("provide all product fields", 400));
    }
    console.log(brand);
    const refBrand = await Brand.findOne({ brandName: brand });

    if (!refBrand) {
      return next(new ErrorHandler("Please provide the brand ", 400));
    }
    console.log("refBrand id" + refBrand._id);
    console.log("refbrand", refBrand);
    const refCategory = await Category.findOne({ categoryName: category });
    console.log("id", refCategory._id);
    if (!refCategory) {
      return next(new ErrorHandler("Please provide the category", 400));
    }

    // const title = `${brand !== "generic" ? brand : ""}- ${
    //   productModel !== "generic" ? productModel : ""
    // } ${pattern.length > 0 ? pattern : ""} ${
    //   headsetType.length > 0 ? headsetType : ""
    // }`;

    const newProduct = await Product.create({
      productCategory: refCategory._id,
      productBrand: refBrand._id,
      productModel: productModel,
      productTitle: productTitle,
      productOffer: offers,
      productDescription: description,
      productSkinPattern: pattern,
      productHeadsetType: headsetType,
      productVariance: JSON.parse(variance),
    
    });
    return res.status(200).json({ success: true, newProduct });
  }
);

export const previewImages = asyncErrorHandler(async (req, res, next) => {
  const photos = req.files;
  console.log("photos =>", photos);

  if (photos?.length === 0) {
    return next(new ErrorHandler("please choose product image", 400));
  }

  const imgUrl = await uploadMultipleCloudinary(photos);
  console.log(imgUrl);

  return res.status(200).json({ success: true, imgUrl });
});

export const getLatestProduct = asyncErrorHandler(async (req, res, next) => {
  //created at -1 means we get in descending order
  let products;
  if (myCache.has("latest-product")) {
    products = JSON.parse(myCache.get("latest-product") as string);
  } else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(8);
    myCache.set("latest-product", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

export const getSingleProduct = asyncErrorHandler(async (req, res, next) => {
  let product;
  const id = req.params.id;
  product = await Product.findById(id)
    .populate("productCategory")
    .populate("productBrand");

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  return res.status(200).json({
    success: true,
    product,
  });
});

export const updateProduct = asyncErrorHandler(
  async (req: Request<{}, {}, UpdateProductRequestBody>, res, next) => {
    const id = (req.params as { id: string }).id;

    const {
      brand,
      productModel,
      productTitle,
      offers,
      description,
      pattern,
      headsetType,
      variance,
    } = req.body;

    console.log("req-body-", req.body);

    const product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Product not found  ", 404));
    }
    if (brand) {
      const refBrand = await Brand.findOne({ brandName: brand });
      console.log("refBrand " + refBrand);
      if (!refBrand) {
        return next(new ErrorHandler("Please provide the brand ", 400));
      }
      product.productBrand = refBrand._id;
    }
    if (productModel) product.productModel = productModel;
    if (productTitle) product.productTitle = productTitle;
    if (offers) product.productOfferProvided = offers;
    if (description) product.productDescription = description;
    if (pattern) product.productSkinPattern = pattern;
    if (headsetType) product.productHeadsetType = headsetType;
    if (variance) product.productVariance = JSON.parse(variance);

    const prod = await product.save();

    console.log("prod", prod);
    return res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
      product,
    });
  }
);

export const deleteProduct = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  console.log("deletedProduct " + product);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  product.productVariance.map(async (item: any) => {
    const response = await deleteImgInCloudinary(item.thumbnail);
    item.productImages.map(async (imgUrl: any) => {
      const response2 = await deleteImgInCloudinary(imgUrl);
    });
  });

  await Product.findByIdAndDelete(product._id);

  await ClearCache({ product: true, productId: String(product._id) });
  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const deletePreviewCloudinary = asyncErrorHandler(
  async (req, res, next) => {
    console.log(req.body);
    const { imgUrl } = req.body;
    console.log("reqbody", imgUrl);

    if (!imgUrl) {
      return next(new ErrorHandler("please provide images to delete", 400));
    }
    const response = await deleteImgInCloudinary(imgUrl);
    return res.status(200).json({
      success: true,
      message: "photo successfully deleted from cloudinary.",
      response,
    });
  }
);

export const getAllProducts = asyncErrorHandler(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page);
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 50;
    const skip = (page - 1) * limit;
    const baseQuery: FilterQuery<BaseQuery> = {};

    if (search) {
      baseQuery.productTitle = {
        $regex: search,
        $options: "i",
      };
    }
    if (price) {
      baseQuery.price = {
        $lte: Number(price), //less than equal to
      };
    }
    if (category) {
      baseQuery.category = category;
    }

    const sortBy: any = {};

    if (sort) {
      if (sort === "A-Z") {
        sortBy.productTitle = 1;
      } else if (sort === "Z-A") {
        sortBy.productTitle = -1;
      } else if (sort === "oldest") {
        sortBy.createdAt = 1;
      } else {
        sortBy.createdAt = -1;
      }
    }
    console.log(baseQuery);
    const productPromise = Product.find(baseQuery)
      .populate("productCategory")
      .populate("productBrand")
      .sort(sort ? sortBy : { createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredProductwithoutlimit] = await Promise.all([
      productPromise,
      Product.find({ baseQuery }),
    ]);

    const totalPage = Math.ceil(products.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);
