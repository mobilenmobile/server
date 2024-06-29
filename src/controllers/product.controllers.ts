import { asyncErrorHandler } from "../middleware/error.middleware.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
  UpdateProductRequestBody,
} from "../types/types.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";
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


//api to create new product
export const newProduct = asyncErrorHandler(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    console.log("----------------", req.body, "----------------");
    const {
      category,
      brand,
      productModel,
      productTitle,
      description,
      pattern,
      headsetType,
      variance,
      colors,
      ramAndStorage
    } = req.body;

    console.log("new product req body=>", JSON.parse(colors))

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

    // // const title = `${brand !== "generic" ? brand : ""}- ${
    // //   productModel !== "generic" ? productModel : ""
    // // } ${pattern.length > 0 ? pattern : ""} ${
    // //   headsetType.length > 0 ? headsetType : ""
    // // }`;

    const newProduct = await Product.create({
      productCategory: refCategory._id,
      productBrand: refBrand._id,
      productModel: productModel,
      productTitle: productTitle,
      productDescription: description,
      productSkinPattern: pattern,
      productHeadsetType: headsetType,
      productVariance: JSON.parse(variance),
      productColors: JSON.parse(colors),
      productRamAndStorage: JSON.parse(ramAndStorage)
      // productTitle: title,
    });
    return res.status(200).json({ success: true, newProduct });
  }
);



//api to get image url by uploading on cloudinary
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


//api to get latest product
export const getLatestProduct = asyncErrorHandler(async (req, res, next) => {
  //created at -1 means we get in descending order

  const products = await Product.find({}).sort({ createdAt: -1 }).limit(8);
  myCache.set("latest-product", JSON.stringify(products));

  return res.status(200).json({
    success: true,
    products,
  });
});


//api to get single product 
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


//api to update product for admin only
export const updateProduct = asyncErrorHandler(
  async (req: Request<{}, {}, UpdateProductRequestBody>, res, next) => {
    const id = (req.params as { id: string }).id;
    const {
      brand,
      productModel,
      productTitle,
      description,
      pattern,
      headsetType,
      variance,

    } = req.body;

    console.log("req-body", req.body);

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


//api to delete product
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

//api to delete only product 
export const deleteProductDirectly = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  console.log("deletedProduct " + product);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  await Product.findByIdAndDelete(product._id);
  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});


//api to delete image 
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



//api to get all products
export const getAllProducts = asyncErrorHandler(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
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
      const findCategory = await Category.findOne({ categoryName: category });
      console.log(findCategory);

      baseQuery.productCategory = findCategory._id;
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
      .skip(skip)
      .limit(limit);

    const [products, filteredProductwithoutlimit] = await Promise.all([
      productPromise,
      Product.find({ baseQuery }),
    ]);

    const totalProducts = (await Product.find(baseQuery)).length;

    const totalPage = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
      totalProducts,
    });
  }
);



// api to get selected brand titles 
export const getLimitedProductsByBrands = asyncErrorHandler(async (req, res, next) => {
  // Find the category ID for "smartphone"
  const smartphoneCategory = await Category.findOne({ categoryName: 'smartphone' });

  if (!smartphoneCategory) {
    console.log('Smartphone category not found.');
    return;
  }

  const categoryID = smartphoneCategory._id;

  // Find the brand IDs for Apple, Vivo, and Samsung
  const brands = await Brand.find({ brandName: { $in: ['apple', 'vivo', 'samsung'] } });

  if (brands.length === 0) {
    console.log('Brands not found.');
    return;
  }

  const brandIDs = brands.map(brand => brand._id);

  const result = await Product.aggregate([
    {
      $match: {
        productCategory: categoryID,
        productBrand: { $in: brandIDs }
      }
    },
    {
      $group: {
        _id: '$productBrand',
        products: { $push: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'brands', // Name of the Brand collection
        localField: '_id',
        foreignField: '_id',
        as: 'brand'
      }
    },
    {
      $unwind: '$brand'
    },
    {
      $project: {
        _id: 0,
        brandName: '$brand.brandName',
        products: { $slice: ['$products', 10] } // Limit to 10 products per brand
      }
    }
  ]);


  return res.status(200).json({
    success: true,
    products: result,
  });


})



// export const getorderwithreview = asyncErrorHandler(async (req, res, next) => {
//   // Find orders
//   const orders = await Order.find().populate({
//     path: 'orderItems.product',
//     populate: {
//       path: 'productReviews',
//       match: { userId: '66471eec395dbd18fbc7122a' }, // Assuming you have userId variable defined
//       select: 'rating description',
//       options: { limit: 10 } // Limit to 10 reviews per product
//     }
//   });
//   return res.status(200).json({
//     success: true,
//     products: orders,
//   });
// })


// async function populateReviewsInOrders() {
//   try {
//     // Find orders
//     const orders = await Order.find().populate({
//       path: 'orderItems.product',
//       populate: {
//         path: 'reviews',
//         match: { userId: '66471eec395dbd18fbc7122a' }, // Assuming you have userId variable defined
//         select: 'rating comment',
//         options: { limit: 10 } // Limit to 10 reviews per product
//       }
//     });

//     // Print or process the populated orders
//     console.log(orders);
//   } catch (err) {
//     console.error('Error populating reviews in orders:', err);
//   }
// }
// populateReviewsInOrders()














// async function getLimitedProductByBrand() {
//   try {
//     // Aggregate to group by category and limit to 10 products per category
//     const result = await Product.aggregate([
//       {
//         $group: {
//           _id: '$productBrand',
//           products: { $push: '$$ROOT' }
//         }
//       },
//       {
//         $lookup: {
//           from: 'brands', // Name of the collection
//           localField: '_id',
//           foreignField: '_id',
//           as: 'brand'
//         }
//       },
//       {
//         $unwind: '$brand'
//       },
//       {
//         $project: {
//           _id: 0,
//           brand: '$brand',
//           products: { $slice: ['$products', 10] } // Limit to 10 products per category
//         }
//       }
//     ]);

//     // Print or process the result
//     console.log(result);
//   } catch (err) {
//     console.error('Error fetching products by category:', err);
//   }
// }

// getProductsByCategory()