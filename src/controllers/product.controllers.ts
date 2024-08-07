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


//----------------------xxxxxx ListOfApis xxxxxxxxx-------------------

// 1.newProduct
// 2.previewImages
// 3.getLatestProduct
// 4.getSingleProduct
// 5.updateProduct
// 6.deleteProduct
// 7.deleteProductDirectly
// 8.deletePreviewCloudinary -- delete images from uploadOnCloudinary
// 9.getAllAdminProducts
// 10.getAllProducts
// 11.getSimilarProducts
// 12.getLimitedProductsByBrands -- give only title of selected brand available in stock
// 13.getFilterAndSortProducts  -- handle filtering and sorting of products

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------

//------------------api to create new product-----------
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
    return res.status(200).json({
      success: true,
      message: "product created successfully",
      newProduct
    });
  }
);


//-----------------api to get image url by uploading on cloudinary------------------
export const previewImages = asyncErrorHandler(async (req, res, next) => {
  const photos = req.files;
  console.log("photos =>", photos);

  if (photos?.length === 0) {
    return next(new ErrorHandler("please choose product image", 400));
  }

  const imgUrl = await uploadMultipleCloudinary(photos);
  console.log(imgUrl);

  return res.status(200).json({
    success: true,
    message: "image uploaded successfully",
    imgUrl
  });
});


//-----------------------------api to get latest product-----------------------------
export const getLatestProduct = asyncErrorHandler(async (req, res, next) => {
  //created at -1 means we get in descending order

  const products = await Product.find({}).sort({ createdAt: -1 }).limit(8);
  myCache.set("latest-product", JSON.stringify(products));

  return res.status(200).json({
    success: true,
    message: "latest products fetched successfully",
    products,
  });
});


//-----------------------------api to get single product-----------------------------------
export const getSingleProduct = asyncErrorHandler(async (req, res, next) => {
  let product;
  const id = req.params.id;
  product = await Product.findById(id)
    .populate("productCategory")
    .populate("productBrand");

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  console.log(product)
  // Function to modify strings starting with "0-"
  if (product?.productRamAndStorage && product?.productBrand?.brandName == 'apple') {
    let modifiedRamAndStorage = product.productRamAndStorage.map((item: { id: string }) => {
      if (item.id.startsWith("0-")) {
        return item.id = item.id.substring(2); // Take substring from index 2 to end
      } else {
        return item; // Return unchanged if it doesn't start with "0-"
      }
    });
    product.productRamAndStorage = modifiedRamAndStorage
  }

  console.log(updateProduct)
  return res.status(200).json({
    success: true,
    message: "product fetched successfully",
    product,
  });
});

//------------------------api to update product for admin only-------------------------------
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
      colors
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
    if (colors) product.productColors = JSON.parse(colors)

    const prod = await product.save();
    console.log("prod", prod);
    return res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
      product,
    });
  }
);


//--------------------------------api to delete product---------------------------------------
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

//-----------------api to delete only product not its cloundinary images -----------------------
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


//-----------------------api to delete cloudinary image-------------------------------------------
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
      message: "Image successfully deleted from cloudinary.",
      response,
    });
  }
);

//---------------------api to get all Admin products withoud changing structure-----------------------------------


//api to get all products
export const getAllAdminProducts = asyncErrorHandler(
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


    console.log("-------admin product--------------------------")
    console.log(products, filteredProductwithoutlimit)
    console.log("-------admin product--------------------------")
    
    const totalProducts = products.length;
    const totalPage = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
      totalProducts,
    });
  }
);






// export const getAllAdminProducts = asyncErrorHandler(
//   async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
//     const { search, sort, category, price } = req.query;
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 20;
//     const skip = (page - 1) * limit;
//     const baseQuery: FilterQuery<BaseQuery> = {};

//     if (search) {
//       baseQuery.productTitle = {
//         $regex: search,
//         $options: "i",
//       };
//     }
//     if (price) {
//       baseQuery.price = {
//         $lte: Number(price), //less than equal to
//       };
//     }
//     if (category) {
//       const findCategory = await Category.findOne({ categoryName: category });
//       console.log(findCategory);

//       baseQuery.productCategory = findCategory._id;
//     }

//     const sortBy: any = {};

//     if (sort) {
//       if (sort === "A-Z") {
//         sortBy.productTitle = 1;
//       } else if (sort === "Z-A") {
//         sortBy.productTitle = -1;
//       } else if (sort === "oldest") {
//         sortBy.createdAt = 1;
//       } else {
//         sortBy.createdAt = -1;
//       }
//     }
//     console.log(baseQuery);
//     const productPromise = Product.find(baseQuery)
//       .populate("productCategory")
//       .populate("productBrand")
//       .sort(sort ? sortBy : { createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const [products, filteredProductwithoutlimit] = await Promise.all([
//       productPromise,
//       Product.find({ baseQuery }),
//     ]);

//     const totalProducts = (await Product.find(baseQuery)).length;

//     const totalPage = Math.ceil(totalProducts / limit);

//     return res.status(200).json({
//       success: true,
//       message: "all products fetched successfully",
//       products,
//       totalPage,
//       totalProducts,
//     });
//   }
// );


//---------------------api to get all products and change its structure------------------------------------
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
    if (!totalProducts) {
      return next(new ErrorHandler("No Product Found", 204));
    }
    let flatProducts: any = []

    products.forEach(product => {
      product.productVariance.forEach((variant: ProductVariance) => {
        const productDiscount = calculateDiscount(variant.boxPrice, variant.sellingPrice)
        // console.log(variant)
        if (Number(variant.quantity) > 0) {
          // console.log("--------------------------------ram---------------------", variant.ramAndStorage[0])

          //dynamically creating title of product
          let title = product.productTitle

          if (variant['ramAndStorage'].length > 0 && variant.ramAndStorage[0]?.ram) {
            // title = `${product.productTitle} ${variant.ramAndStorage
            //   && `(${variant.ramAndStorage[0].ram != '0' ? `${variant.color} ${variant.ramAndStorage[0].ram}GB` : ''} ${variant.ramAndStorage[0].storage != '0' ? `${variant.ramAndStorage[0].storage}GB` : ''})`
            //   }`
            title = `${product.productTitle} ${variant.ramAndStorage
              && `(${variant.color} ${variant.ramAndStorage[0].storage != '0' ? `${variant.ramAndStorage[0].storage}GB` : ''})`
              }`
          } else {
            title = `${product.productTitle} (${variant.color})`
          }
          //creating different product based on variance
          const newProduct = {
            productid: `${product._id}`,
            keyid: `${product._id}${variant.id.replace(/\s+/g, "")}`,
            variantid: `${variant.id.replace(/\s+/g, "")}`,
            title: title.toLowerCase(),
            category: product?.productCategory?.categoryName,
            thumbnail: variant.thumbnail,
            boxPrice: variant.boxPrice,
            sellingPrice: variant.sellingPrice,
            discount: productDiscount,
            rating: product.productRating,
            color: variant.color, // Replace with actual rating if available
            brand: product.productBrand?.brandName || 'nobrand'
          };
          flatProducts.push(newProduct)
        }
      });
    });
    // console.log("----------flatProducts--------", flatProducts)
    const totalPage = Math.ceil(totalProducts / limit);

    //shuffling the products array
    for (let i = flatProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flatProducts[i], flatProducts[j]] = [flatProducts[j], flatProducts[i]];
    }

    return res.status(200).json({
      success: true,
      message: "all products fetched successfully",
      products: flatProducts,
      totalPage,
      totalProducts,
    });
  }
);
//---------------------api to get similar products and change its structure------------------------------------
export const getSimilarProducts = asyncErrorHandler(
  async (req, res, next) => {

    const categoryIds = req.body.categoryIds
    console.log("categoryIds-------------------->", categoryIds)
    const parsedCategoryIds = categoryIds

    let limitProducts = 5

    if (!Array.isArray(parsedCategoryIds) || parsedCategoryIds.length === 0) {
      return res.status(400).json({ message: 'Invalid category IDs' });
    }

    if (parsedCategoryIds.length == 1) {
      limitProducts = 5
    } else if (parsedCategoryIds.length == 2) {
      limitProducts = 3
    } else if (parsedCategoryIds.length == 3) {
      limitProducts = 2
    } else if (parsedCategoryIds.length >= 4) {
      limitProducts = 1
    }

    // Fetch 5 products for each category ID
    const productsPromises = parsedCategoryIds.map((categoryId: string) => {
      return Product.find({ productCategory: categoryId }).limit(limitProducts).exec();
    });

    const productsByCategory = await Promise.all(productsPromises);

    // Flatten the array of arrays into a single array
    const allProducts = productsByCategory.flat();

    let flatProducts: any = []

    allProducts.forEach(product => {
      product.productVariance.forEach((variant: ProductVariance) => {
        const productDiscount = calculateDiscount(variant.boxPrice, variant.sellingPrice)
        // console.log(variant)
        if (Number(variant.quantity) > 0) {
          // console.log("--------------------------------ram---------------------", variant.ramAndStorage[0])

          //dynamically creating title of product
          let title = product.productTitle

          if (variant['ramAndStorage'].length > 0 && variant.ramAndStorage[0]?.ram) {
            // title = `${product.productTitle} ${variant.ramAndStorage
            //   && `(${variant.ramAndStorage[0].ram != '0' ? `${variant.color} ${variant.ramAndStorage[0].ram}GB` : ''} ${variant.ramAndStorage[0].storage != '0' ? `${variant.ramAndStorage[0].storage}GB` : ''})`
            //   }`
            title = `${product.productTitle} ${variant.ramAndStorage
              && `(${variant.color} ${variant.ramAndStorage[0].storage != '0' ? `${variant.ramAndStorage[0].storage}GB` : ''})`
              }`
          } else {
            title = `${product.productTitle} (${variant.color})`
          }
          //creating different product based on variance
          const newProduct = {
            productid: `${product._id}`,
            keyid: `${product._id}${variant.id.replace(/\s+/g, "")}`,
            variantid: `${variant.id.replace(/\s+/g, "")}`,
            title: title.toLowerCase(),
            category: product?.productCategory?.categoryName,
            thumbnail: variant.thumbnail,
            boxPrice: variant.boxPrice,
            sellingPrice: variant.sellingPrice,
            discount: productDiscount,
            rating: product.productRating,
            reviews: product.productNumReviews,
            color: variant.color, // Replace with actual rating if available
            brand: product.productBrand?.brandName || 'nobrand'
          };
          flatProducts.push(newProduct)
        }
      });
    });

    //shuffling the products array
    for (let i = flatProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flatProducts[i], flatProducts[j]] = [flatProducts[j], flatProducts[i]];
    }

    console.log("similar products", allProducts)
    return res.status(200).json({
      success: true,
      message: "products fetched successfully",
      products: flatProducts,
      TotalProducts: flatProducts.length
    });
  }
);

// ------------------api to get selected product title for selected brand------------------------------------- 
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
        // products: { $slice: ['$products', 10] } // Limit to 10 products per brand
        products: {
          $slice: [
            {
              $map: {
                input: { $slice: ['$products', 10] },
                as: 'product',
                in: {
                  _id: '$$product._id', // Assuming _id is the product ID
                  productTitle: '$$product.productTitle'
                }
              }
            },
            10
          ]
        }
      }
    }
  ]);

  return res.status(200).json({
    success: true,
    message: "products fetched successfully",
    products: result,
  });


})

interface Product {
  _id: string;
  productTitle: string;
  productCategory: string;
  productBrand: {
    _id: string;
    name: string; // Assuming the brand has a name property
  };
  productModel: string;
  productDescription: string;
  productVariance: ProductVariance;
  // Add more properties as needed
}

interface ProductVariance {
  quantity: any;
  _id: string;
  id: string;
  color: string; // Assuming color is always present in productVariance
  ramAndStorage: {
    _id: string;
    id: string;
    ram: string;
    storage: string;
  }[];
  thumbnail: string;
  sellingPrice: string;
  boxPrice: string;
}

// -------------------Api to filter and sort products-------------------------------------
export const getFilterAndSortProducts = asyncErrorHandler(async (req, res, next) => {
  // Example filters object (adjust as per your UI or requirements)
  // const filters = {
  //   searchText: req.query.search || '',
  //   minPrice: Number(req.query.minPrice) || 0,
  //   maxPrice: Number(req.query.maxPrice) || 0,
  //   rating: req.query.rating || 0,
  //   brand: req.query.brand || '',
  //   color: req.query.color || '',
  //   memory: req.query.memory || '',
  //   storage: req.query.storage || '',
  //   sortBy: req.query.sortBy || 'priceLowToHigh' // Options: 'priceLowToHigh', 'priceHighToLow', 'topRated'
  // };
  const {
    searchText,
    minPrice,
    maxPrice,
    rating,
    brand,
    color,
    memory,
    storage,
    sortBy
  } = req.body

  console.log(req.body)
  const baseQuery: FilterQuery<BaseQuery> = {};

  if (searchText) {
    baseQuery.productTitle = {
      $regex: searchText,
      $options: "i",
    };
  }

  const data = await Product.find(baseQuery).populate("productCategory")
    .populate("productBrand")

  let flatProducts: any = []

  data.forEach(product => {
    product.productVariance.forEach((variant: ProductVariance) => {

      if (Number(variant.quantity) > 0) {
        const productDiscount = calculateDiscount(variant.boxPrice, variant.sellingPrice)
        let title = product.productTitle

        if (variant['ramAndStorage'].length > 0 && variant.ramAndStorage[0]?.ram) {
          // title = `${product.productTitle} ${variant.ramAndStorage
          //   && `(${variant.ramAndStorage[0].ram != '0' ? `${variant.color} ${variant.ramAndStorage[0].ram}GB` : ''} ${variant.ramAndStorage[0].storage != '0' ? `${variant.ramAndStorage[0].storage}GB` : ''})`
          //   }`
          title = `${product.productTitle} ${variant.ramAndStorage
            && `(${variant.color} ${variant.ramAndStorage[0].storage != '0' ? `${variant.ramAndStorage[0].storage}GB` : ''})`
            }`
        } else {
          title = `${product.productTitle} (${variant.color})`
        }
        const newProduct = {
          productid: `${product._id}`,
          keyid: `${product._id}${variant.id.replace(/\s+/g, "")}`,
          variantid: `${variant.id.replace(/\s+/g, "")}`,
          title: title.toLowerCase(),
          thumbnail: variant.thumbnail,
          boxPrice: variant.boxPrice,
          sellingPrice: variant.sellingPrice,
          discount: productDiscount,
          rating: product.productRating,
          reviews: product.productNumReviews,
          color: variant.color,
          brand: product.productBrand?.brandName || 'nobrand',
          memory: variant?.ramAndStorage[0]?.ram,
          storage: variant?.ramAndStorage[0]?.storage
        };
        flatProducts.push(newProduct);
      }
    });
  });

  let filteredProducts = [...flatProducts];
  // Apply search text filter
  // if (typeof searchText === 'string') {
  //   const searchRegex = new RegExp(searchText.trim(), 'i'); // Case insensitive search
  //   filteredProducts = filteredProducts.filter(product => searchRegex.test(product.title));
  // }
  // Apply filters

  const minPriceValue = minPrice.sort()[0]
  const maxPriceValue = maxPrice.sort()[maxPrice.length - 1]

  if (minPriceValue && maxPriceValue) {
    console.log("---filtering based on minprice and maxprice")
    filteredProducts = filteredProducts.filter(product => {
      const sellingPrice = Number(product.sellingPrice);
      console.log("--------------selling price-------------", minPriceValue, ">", sellingPrice, "<=", maxPriceValue)
      console.log(sellingPrice >= minPriceValue && sellingPrice <= maxPriceValue)
      return sellingPrice >= Number(minPriceValue) && sellingPrice <= Number(maxPriceValue);
    });
  }

  if (rating && rating.length > 0) {
    console.log("---filtering based on rating")
    filteredProducts = filteredProducts.filter(product => {
      console.log(rating, product.rating)
      if (rating.includes(product.rating)) {
        return rating.includes(product.rating)
      }
      rating.includes[product.rating]
    });
  }

  if (brand && brand.length > 0) {
    console.log("---filtering based on brand")
    filteredProducts = filteredProducts.filter(product => brand.includes(product.brand));
  }
  if (color && color.length > 0) {
    // filteredProducts = filteredProducts.filter(product => {
    //   let matches = 0;

    //   color.forEach((arrcolor: string) => {
    //     const regex = new RegExp(arrcolor.toLowerCase().split(' ').join('\\s+'), 'i');
    //     const match = product.color.toLowerCase().match(regex);
    //     console.log("regex", regex, "match", match, "productcolor", product.color.toLowerCase())
    //     if (match) {
    //       const matchedWords = match[0].split(/\s+/);
    //       matches = Math.max(matches, matchedWords.length);
    //     }
    //   });

    //   return matches >= 3;
    // });
    filteredProducts = filteredProducts.filter(product => {
      let matches = 0;

      color.forEach((arrcolor: string) => {
        const arrColors = arrcolor.toLowerCase().split(/\s+/); // Split arrcolor into individual words
        const productColors = product.color.toLowerCase().split(/\s+/); // Split product.color into individual words

        // Check for matches of any word from arrColors in productColors
        const foundMatches = arrColors.filter(colorWord => productColors.includes(colorWord));

        if (foundMatches.length > 0) {
          matches += foundMatches.length; // Increase matches count by number of found matches
        }
      });

      return matches > 0;
    });

  }

  if (memory && memory.length > 0) {
    console.log("---filtering based on memory")
    filteredProducts = filteredProducts.filter(product => {
      return memory.includes(product.memory)
    });
  }
  if (storage && storage.length > 0) {
    console.log("---filtering based on storage")
    filteredProducts = filteredProducts.filter(product => storage.includes(product.storage));
  }

  // Apply sorting
  if (sortBy.includes('priceLowToHigh')) {
    console.log("---filtering based pricelowtohigh")
    filteredProducts.sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));
  } else if (sortBy.includes('priceHighToLow')) {
    console.log("---filtering based hightolow")
    filteredProducts.sort((a, b) => Number(b.sellingPrice) - Number(a.sellingPrice));
  } else if (sortBy.includes('topRated')) {
    console.log("---filtering based on toprated")
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }
  // console.log(flatProducts, "-----and---------", filteredProducts)
  return res.status(200).json({
    success: true,
    products: filteredProducts,
    message: "successfully filtered and sorted products",
  });
})

//------------------------function to calculate discount of product-------------------------
export function calculateDiscount(boxPrice?: string, sellingPrice?: string) {
  if (boxPrice?.length == 0 || sellingPrice?.length == 0) {
    return 0
  }
  var discountPercentage = ((Number(boxPrice) - Number(sellingPrice)) / Number(boxPrice) * 100);
  discountPercentage = Math.floor(discountPercentage);
  return discountPercentage;
}



