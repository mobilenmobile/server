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
    const {
      productTitle,
      brand,
      category,
      discountedPercentage,
      stockAvailability,
      color,
      description,
      RAM,
      storage,
      pattern,
      headsetType,
      imgUrls,
      thumbnail,
      uniqueId,
      productModel,
      boxPrice,
      sellingPrice,
      productBadge,
      offers,
    } = req.body;

    console.log("new product req body=>", headsetType);
    const imageUrls = JSON.parse(req.body.imgUrls);

    console.log("req body image urls =>", JSON.parse(req.body.imgUrls));

    // const photos = req.files;
    // if (!photos) {
    //   return next(new ErrorHandler("please choose product image", 400));
    // }
    console.log(imgUrls);
    if (
      // !productTitle ||
      // !boxPrice ||
      // !stockAvailability ||
      !brand ||
      !category
      // !uniqueId
    ) {
      // removeFile(photos.path, () => {
      //   console.log("Deleted");
      // });

      return next(new ErrorHandler("provide all product fields", 400));
    }

    // const ImageUrl = await uploadMultipleCloudinary(photos);
    // console.log(ImageUrl);
    console.log(brand);
    const refBrand = await Brand.findOne({ brandName: brand });
    console.log("refBrand id" + refBrand._id);
    if (!refBrand) {
      return next(new ErrorHandler("Please provide the brand ", 400));
    }

    const refCategory = await Category.findOne({ categoryName: category });
    if (!refCategory) {
      return next(new ErrorHandler("Please provide the category", 400));
    }
    console.log("id", refCategory._id);
    console.log(thumbnail);

    const checkedImgUrls = imageUrls.map((item: String) => {
      if (item.includes("[")) {
        item = item.replace("[", "").replace("]", "");
        return item;
      } else {
        return item;
      }
    });

    console.log("checkedimgurls==>", checkedImgUrls);

    const basicData = {
      productTitle: productTitle,
      productModel: productModel,
      productSellingPrice: sellingPrice,
      productBoxPrice: boxPrice,
      productDescription: description,
      productCategory: refCategory._id,
      productBrand: refBrand._id,
      productStock: stockAvailability,
      productColor: color,
      productImages: checkedImgUrls,
      productDiscountPercentage: discountedPercentage,
      productThumbnail: thumbnail,
      productBadge: productBadge,
      productOfferProvided: offers,
      productUniqueId: uniqueId,
    };
    console.log("req body==> ", basicData);
    switch (category.toLowerCase()) {
      case "smartphone":
        const phoneProduct = await Product.create({
          ...basicData,
          productRAM: RAM,
          productStorage: storage,
        });

        await ClearCache({ product: true, admin: true });

        return res.status(200).json({
          success: true,
          data: phoneProduct,
        });

      case "accessories":
        const accessoryProduct = await Product.create({
          ...basicData,
        });
        await ClearCache({ product: true, admin: true });

        return res.status(200).json({
          success: true,
          data: accessoryProduct,
        });

      case "headsets":
        const headsetProduct = await Product.create({
          ...basicData,
          productHeadsetType: headsetType,
        });
        await ClearCache({ product: true, admin: true });

        return res.status(200).json({
          success: true,
          data: headsetProduct,
        });

      case "skins":
        const skinProduct = await Product.create({
          ...basicData,
          productSkinPattern: pattern,
        });
        await ClearCache({ product: true, admin: true });

        return res.status(200).json({
          success: true,
          data: skinProduct,
        });

      case "smartwatch":
        const smartwatch = await Product.create({
          ...basicData,
        });
        await ClearCache({ product: true, admin: true });

        return res.status(200).json({
          success: true,
          data: smartwatch,
        });
    }
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
      productTitle,
      productModel,
      boxPrice,
      sellingPrice,
      productBadge,
      offers,
      brand,
      stockAvailability,
      color,
      description,
      RAM,
      storage,
      review,
      pattern,
      headsetType,
      imgUrls,
      thumbnail,
      discountedPercentage,
    } = req.body;

    console.log("req-body-", req.body);

    const product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Product not found  ", 404));
    }
    console.log("-------imgurl-----", imgUrls);
    if (imgUrls) {
      const checkedImgUrls = imgUrls?.map((item: String) => {
        if (item.includes("[")) {
          item = item.replace("[", "").replace("]", "");
          return item;
        } else {
          return item;
        }
      });
      console.log(
        "--------------------------updating images-----------------------"
      );
      product.productImages = checkedImgUrls;
    }
    console.log("color --->", color);
    if (thumbnail) {
      console.log("---------updating thumbnail----------");
      product.productThumbnail = thumbnail;
      console.log(thumbnail, product.productThumbnail);
    }

    if (description) product.productDescription = description;

    if (review) product.productReview = review;
    if (brand) {
      const refBrand = await Brand.findOne({ brandName: brand });
      console.log("refBrand " + refBrand);
      if (!refBrand) {
        return next(new ErrorHandler("Please provide the brand ", 400));
      }
      product.productBrand = refBrand._id;
    }
    if (productTitle) product.productTitle = productTitle;
    if (productModel) product.productModel = productModel;
    if (stockAvailability) product.productStock = stockAvailability;
    if (color) product.productColor = color;
    if (discountedPercentage) product.productDiscount = discountedPercentage;
    if (RAM) product.productRAM = RAM;
    if (storage) product.productStorage = storage;
    if (headsetType) product.productHeadsetType = headsetType;
    if (pattern) product.productSkinPattern = pattern;
    if (boxPrice) product.productPrice = boxPrice;
    if (sellingPrice) product.productSellingPrice = sellingPrice;
    if (productBadge) product.productBadge = productBadge;
    if (offers) product.productOfferProvided = offers;

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

  product.productImages.map(async (imgUrl: string) => {
    const response = await deleteImgInCloudinary(imgUrl);
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
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;
    const baseQuery: FilterQuery<BaseQuery> = {};
    // let searchQuery = {};
    // if (search) {
    //   searchQuery = {
    //     $or: [
    //       { productTitle: { $regex: search, $options: "i" } },
    //       { productModel: { $regex: search, $options: "i" } },
    //     ],
    //   };
    // }

    // if (search) {
    //   baseQuery.search {
    //     $or: [
    //       { productTitle: { $regex: search, $options: "i" } },
    //       { productModel: { $regex: search, $options: "i" } },
    //     ],
    //   };
    // }

    if (search) {
      baseQuery.productTitle = {
        $regex: search,
        $options: "i",
      };
      //   baseQuery.productModel = {
      //     $regex: search,
      //     $options: "i",
      //   };
    }
    if (price) {
      baseQuery.price = {
        $lte: Number(price), //less than equal to
      };
    }
    if (category) {
      baseQuery.category = category;
    }
    // if(sort){
    //   if(sort==="latest"){
    //     sort=
    //   }
    // }
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
