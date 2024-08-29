import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { NewUserRequestBody } from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import { User } from "../models/auth/user.model";
import { Product } from "../models/product/product.model";
import { Wishlist } from "../models/wishlist/wishlist.model";
import { cart } from "../models/cart/cart.model";
import { Offer } from "../models/offer/offer.model";
import { calculateDiscount } from "./product.controllers";
import { deleteUser } from "../db/firebase";
import { IncreaseCoins } from "./coin.controller";
import mongoose, { ObjectId } from "mongoose";
import { CoinAccount } from "../models/coins/coinAccount";




//------------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------


// 1.newUser
// 2.getUser
// 3.updateProfile
// 4.updateProfileImage
// 5.updateCouponCode
// 6.getAppliedCoupon
// 7.removeCouponCode
// 8.updateWishlist
// 9.getWishlistItems
// 10.removeWishlistItem
// 11.updateCart
// 12.decreaseCartProductQuantity
// 13.getCartItems
// 14.removeCartItem
// 15.getCartDetails
// 16.clearCart

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------------


//------------------------api to create new user----------------------------------
export const newUser = asyncErrorHandler(
  async (req: Request<{}, {}, NewUserRequestBody>, res, next) => {
    const { name, uid, email } = req.body;

    if (!email || !uid) {
      return next(new ErrorHandler("please provide email or uid", 400));
    }

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res
        .status(200)
        .json({ success: true, message: `welcome back ${name}` });
    }

    const userData = {
      name: name ? name : "",
      uid,
      email,
    };

    const user = await User.create(userData);
    if (!user._id) {
      // console.log("failed to store user data")
      deleteUser(uid)
      return res.status(200).json({
        success: false,
        message: `error while signing up`,
        user
      });

    }
    // userId: string, rewardType: string, orderId: string, coinsTobeAdded: number

    await IncreaseCoins(user._id, "signupBonus", "signup", 100)

    return res.status(200).json({
      success: true,
      message: `welcome ${name} to mnm`,
      user
    });
  }
);

//------------------------api to get user details ----------------------------------
export const getUser = asyncErrorHandler(async (req: Request, res, next) => {
  const uid = req.params.uid;
  const user = await User.findOne({ uid }).populate("coupon")

  if (!user) {
    return next(new ErrorHandler("user doesnt exist", 400));
  }

  return res.status(200).json({
    success: true,
    message: "successfully fetched user details",
    user
  });
});

//-----------------------api to update profile ----------------------------------------
export const updateProfile = asyncErrorHandler(async (req, res, next) => {
  const { profile } = req.body
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }

  const profileData = JSON.parse(profile)
  user.name = profileData.profileName
  user.profile = profileData
  user.email = profileData.profileEmailId
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Successfully changed user previlege",

  });
});

//---------------------api to update profile image-------------------------------------------
export const updateProfileImage = asyncErrorHandler(async (req, res, next) => {
  const { profileImageUrl } = req.body
  if (!profileImageUrl) {
    return next(new ErrorHandler("enter profile image url", 404));
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }
  user.profile.profileImageUrl = profileImageUrl
  await user.save();

  // console.log(user.profile)
  return res.status(200).json({
    success: true,
    message: "Successfully changed user profile image url",
    profileImageUrl
  });
});

//------------------api to add coupon code for cart------------------------------------------
export const updateCouponCode = asyncErrorHandler(async (req, res, next) => {
  const { couponId } = req.body
  if (!couponId) {
    return next(new ErrorHandler("enter coupon code", 404));
  }
  const couponCode = await Offer.findOne({ _id: couponId })

  if (!couponCode) {
    return next(new ErrorHandler("No coupon found by this id", 404));
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }

  user.coupon = couponId

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Successfully added coupon",
  });
});

//-------------------api to get applied coupon code for cart--------------------------------------------------
export const getAppliedCoupon = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("coupon")
  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }
  if (!user.coupon) {
    return next(new ErrorHandler("No coupon found", 204));
  }
  return res.status(200).json({
    success: true,
    message: "Successfully fetched coupon",
    coupon: user.coupon || []
  });
});

//-------------------api remove coupon code for cart--------------------------------------------
export const removeCouponCode = asyncErrorHandler(async (req, res, next) => {

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }

  user.coupon = null

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Successfully removed coupon",
  });
});

//---------------------api to update wislist----------------------------------------------------
export const updateWishlist = asyncErrorHandler(async (req, res, next) => {

  const { productId, selectedVarianceId } = req.body

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("please enter all fields", 404));
  }


  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("No product found with this id", 404));
  }

  const existingItem = await Wishlist.findOne({ user: req.user._id, productId, selectedVarianceId });
  if (existingItem) {
    return next(new ErrorHandler("This combination already exists in the wishlist.", 404));
  }

  const wishlist = await Wishlist.create({
    user: req.user._id,
    productId,
    selectedVarianceId
  })

  return res.status(200).json({
    success: true,
    message: "Successfully added wishlist item",
    wishlist
  });

});

//----------------- api to get wishlist items -----------------------------------------------------------
export const getWishlistItems = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  const wishlistItems = await Wishlist.find({ user: req.user._id }).populate("productId");

  // console.log("-------------wishlistitems--------------", wishlistItems)
  const wishlistItemsData = wishlistItems.map((item) => {
    if (item.productId.productVariance) {
      const variantData = item.productId.productVariance.find((variant: any) => {
        if (variant.id.replace(/\s+/g, "") == item.selectedVarianceId) {
          return variant
        }
      })
      // console.log("variantData", variantData)
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
      return {

        _id: item._id,
        productId: item.productId._id,
        selectedVarianceId: item.selectedVarianceId,
        productTitle: item.productId.productTitle,
        thumbnail: variantData?.thumbnail || '',
        boxPrice: variantData?.boxPrice || '',
        sellingPrice: variantData?.sellingPrice || '',
        productRating: item.productId.productRating,
        discount: productDiscount,
      }
    }
  })
  // console.log(wishlistItemsData)s
  return res.status(200).json({
    success: true,
    message: "successfully fetched wishlist items",
    wishlistItemsData
  });

});

// ---------------api to remove wishlist item-------------------------------------------------------
export const removeWishlistItem = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  // if (!req.params.id) {
  //   return next(new ErrorHandler("no id", 400));
  // }

  const { productId, selectedVarianceId } = req.body

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("no product id", 400));
  }

  const wishlistItem = await Wishlist.findOne({ user: req.user._id, productId: productId, selectedVarianceId: selectedVarianceId });

  if (!wishlistItem) {
    return next(new ErrorHandler("wishlistitem not found", 400));
  }

  await Wishlist.findByIdAndDelete(wishlistItem._id);
  return res.status(200).json({ success: true, message: "successfully deleted item from wishlist" });

});


//---------------------api to update cart----------------------------------------------------------
export const updateCart = asyncErrorHandler(async (req, res, next) => {

  const { productId, selectedVarianceId, quantity, customSkin, skinProductDetails } = req.body

  if (!customSkin) {
    if (!productId || !selectedVarianceId) {
      return next(new ErrorHandler("please enter all fields", 404));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler("No product found with this id", 404));
    }
    const selectedVariantData = product.productVariance.find((variant: { id: string; }) => {
      return variant.id.replace(/\s+/g, "") == selectedVarianceId.replace(/\s+/g, "")
    })

    if (selectedVariantData?.quantity == '0' || selectedVariantData?.quantity == 0) {
      return next(new ErrorHandler("product is out of stock", 404));
    }

  }

  const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });


  if (cartItem && cartItem.quantity < 10) {
    cartItem.quantity = cartItem.quantity + 1
    await cartItem.save()
  }

  // console.log(skinProductDetails)
  // console.log(JSON.parse(skinProductDetails))

  if (!cartItem) {
    await cart.create({
      user: req.user._id,
      productId,
      selectedVarianceId,
      customSkin,
      skinProductDetails: skinProductDetails ? JSON.parse(skinProductDetails) : null,
      quantity
    })
  }

  return res.status(200).json({
    success: true,
    message: "Successfully updated cart",
    cartItem
  });

});

//----------------api to decrease product quantity in cart------------------------------------------------
export const decreaseCartProductQuantity = asyncErrorHandler(async (req, res, next) => {

  const { productId, selectedVarianceId } = req.body

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("please enter all fields", 404));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("No product found with this id", 404));
  }

  const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });


  if (!cartItem) {
    return next(new ErrorHandler("cart item not found", 404));
  }

  if (cartItem && cartItem.quantity > 0) {
    cartItem.quantity = cartItem.quantity - 1
    await cartItem.save()
  }

  return res.status(200).json({
    success: true,
    message: "Successfully decreased product quantity",
    cartItem
  });

});

//---------------- api to get cart items -----------------------------------------------------------
export const getCartItems = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  const wishlistItems = await cart.find({ user: req.user._id }).populate("productId");

  const cartItemsData = wishlistItems.map((item) => {

    // console.log(item)

    if (item.productId.productVariance) {
      const variantData = item.productId.productVariance.find((variant: any) => {
        if (variant.id == item.selectedVarianceId) {
          return variant
        }
      })

      // console.log("variantData", variantData)
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
      if (variantData.quantity && Number(variantData.quantity) > 0) {
        return {
          _id: item._id,
          productTitle: item.productId.productTitle,
          thumbnail: variantData?.thumbnail,
          boxPrice: variantData?.boxPrice,
          sellingPrice: variantData?.sellingPrice,
          color: variantData?.color,
          ramAndStorage: variantData?.ramAndStorage[0],
          productRating: item.productId.productRating,
          quantity: item.quantity,
          productId: item.productId._id,
          selectedVarianceId: item.selectedVarianceId,
          discount: productDiscount,
        }
      }

    }
  })
  return res.status(200).json({
    success: true,
    message: "successfully fetched cartitems data",
    cartItemsData
  });
});

//---------------- api to remove cart item-----------------------------------------------------------
export const removeCartItem = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  if (!req.params.id) {
    return next(new ErrorHandler("no id", 400));
  }
  const cartItem = await cart.findOne({ user: req.user._id, _id: req.params.id });
  if (!cartItem) {
    return next(new ErrorHandler("cart not found", 400));
  }

  await cart.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: "successfully deleted item from cart" });

});

// ------------------ api to get cart details -------------------------------------------------------
export const getCartDetails = asyncErrorHandler(async (req: Request, res, next) => {
  const { cart } = req.body()
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  // const cartItems = await cart.find({ user: req.user._id }).populate("productId");
  // const cartItems = await cart.find({ user: req.user._id }).populate({
  //   path: 'productId',
  //   populate: {
  //     path: 'productCategory',
  //   }
  // });
  // console.log("categorynew----------------->", cartItemsnew)
  const user = await User.findOne({ _id: req.user._id })
  const appliedCoupon = await Offer.findOne({ _id: user?.coupon })
  const coinAccountData = await CoinAccount.find({ userId: req.user._id })

  //mapping through cartItems to structure the data
  const cartItems = await Promise.all(cart.map(async (cartItem: { productId: any; }) => {
    const product = await Product.findById(cartItem.productId).populate({
      path: 'productCategory',
    });
    // console.log("------------product--------", product);
    if (product) {
      return {
        ...cartItem,
        productId: product,
      };
    }
    return null; // or handle the case where product is not found
  }));

  // Remove null entries if there were any
  const filteredCartItemsData = cartItems.filter(item => item !== null);
  // console.log("---------cart------------", filteredCartItemsData);
  // //mapping through cartItems to structure the data
  const cartItemsData = filteredCartItemsData.map((item) => {
    console.log("------------- item-------------------", item)
    if (item.productId.productVariance) {
      const variantData = item.productId.productVariance.find((variant: any) => {
        if ((variant.id.replace(/\s+/g, "")) == (item.selectedVarianceId.replace(/\s+/g, ""))) {
          return variant
        }
      })
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
      return {
        _id: item.productId._id,
        keyid: `${item.productId._id}${variantData?.id.replace(/\s+/g, "")}`,
        categoryId: item.productId?.productCategory?._id,
        category: item.productId?.productCategory?.categoryName,
        productTitle: item.productId.productTitle,
        thumbnail: variantData?.thumbnail,
        boxPrice: variantData?.boxPrice,
        sellingPrice: variantData?.sellingPrice,
        color: variantData?.color,
        ramAndStorage: variantData?.ramAndStorage[0],
        productRating: item.productId.productRating,
        quantity: item.quantity,
        productId: item.productId._id,
        selectedVarianceId: item.selectedVarianceId,
        discount: productDiscount,
        customSkin: item?.customSkin || false,
        skinProductDetails: item?.skinProductDetails || []
      }
    }
  })

  let Total = 0
  let DiscountedTotal = 0

  const cartDetails = cartItemsData.map((item) => {
    return {
      Total: Total + (item?.quantity * item?.boxPrice),
      DiscountedTotal: DiscountedTotal + (item?.quantity * item?.sellingPrice)
    }
  })

  const totals = cartItemsData.reduce((accumulator, item) => {
    const Total = accumulator.Total + (item?.quantity * item?.boxPrice);
    const DiscountedTotal = accumulator.DiscountedTotal + (item?.quantity * item?.sellingPrice);

    return {
      Total,
      DiscountedTotal
    };
  }, {
    Total: 0,
    DiscountedTotal: 0,
  })

  let couponDiscount = 0
  if (appliedCoupon && appliedCoupon.offerCouponDiscount) {
    couponDiscount = Math.round((Number(appliedCoupon.offerCouponDiscount) * totals.DiscountedTotal) / 100)
    couponDiscount = couponDiscount > 500 ? 499 : couponDiscount
  }

  const availableCoins = coinAccountData.length > 0 && coinAccountData[0]?.coinAccountBalance || 0
  const usableCoins = coinAccountData.length > 0 && coinAccountData[0].useCoinForPayment ? coinAccountData[0].coinAccountBalance : 0


  const finalCartTotal = totals.DiscountedTotal - (couponDiscount) - usableCoins

  return res.status(200).json({
    success: true,
    message: "Cart details fetched successfully",
    cartItemsData,
    cartDetails: { ...totals, finalCartTotal, couponDiscount, availableCoins },
    offer: user?.coupon,
  });
});




// ------------------ api to get cart details -------------------------------------------------------
export const getUnAuthenticatedCartDetails = asyncErrorHandler(async (req: Request, res, next) => {

  console.log("-------------------? unauthenticated cart details", req.body)
  const { cart } = req.body


  const cartItems = await Promise.all(cart.map(async (cartItem: { productId: any; }) => {
    const product = await Product.findById(cartItem.productId).populate({
      path: 'productCategory',
    });
    // console.log("------------product--------", product);
    if (product) {
      return {
        ...cartItem,
        productId: product,
      };
    }
    return null; // or handle the case where product is not found
  }));

  // Remove null entries if there were any
  const filteredCartItemsData = cartItems.filter(item => item !== null);
  // console.log("---------cart------------", filteredCartItemsData);
  // //mapping through cartItems to structure the data
  const cartItemsData = filteredCartItemsData.map((item) => {
    console.log("------------- item-------------------", item)
    if (item.productId.productVariance) {
      const variantData = item.productId.productVariance.find((variant: any) => {
        if ((variant.id.replace(/\s+/g, "")) == (item.selectedVarianceId.replace(/\s+/g, ""))) {
          return variant
        }
      })
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
      return {
        _id: item.productId._id,
        keyid: `${item.productId._id}${variantData?.id.replace(/\s+/g, "")}`,
        categoryId: item.productId?.productCategory?._id,
        category: item.productId?.productCategory?.categoryName,
        productTitle: item.productId.productTitle,
        thumbnail: variantData?.thumbnail,
        boxPrice: variantData?.boxPrice,
        sellingPrice: variantData?.sellingPrice,
        color: variantData?.color,
        ramAndStorage: variantData?.ramAndStorage[0],
        productRating: item.productId.productRating,
        quantity: item.quantity,
        productId: item.productId._id,
        selectedVarianceId: item.selectedVarianceId,
        discount: productDiscount,
        customSkin: item?.customSkin || false,
        skinProductDetails: item?.skinProductDetails || []
      }
    }
  })

  let Total = 0
  let DiscountedTotal = 0
  const cartDetails = cartItemsData.map((item) => {
    return {
      Total: Total + (item?.quantity * item?.boxPrice),
      DiscountedTotal: DiscountedTotal + (item?.quantity * item?.sellingPrice)
    }
  })

  const totals = cartItemsData.reduce((accumulator, item) => {
    const Total = accumulator.Total + (item?.quantity * item?.boxPrice);
    const DiscountedTotal = accumulator.DiscountedTotal + (item?.quantity * item?.sellingPrice);

    return {
      Total,
      DiscountedTotal
    };
  }, {
    Total: 0,
    DiscountedTotal: 0,
  })
  let couponDiscount = 0


  let finalCartTotal = totals.DiscountedTotal
  let deliveryCharges = 150
  if (finalCartTotal > 500) {
    deliveryCharges = 0
  }
  finalCartTotal = finalCartTotal + deliveryCharges
  return res.status(200).json({
    success: true,
    message: "Cart details fetched successfully",
    cartItemsData,
    cartDetails: { ...totals, finalCartTotal, deliveryCharges }
  });
});
// ------------------ api to get cart details -------------------------------------------------------
export const storeCartItemsInDb = asyncErrorHandler(async (req: Request, res, next) => {

  console.log("-------------------? save cart item in db", req.body)
  const { cartData } = req.body
  console.log("-----cartData----", cartData)
  for (const item of cartData) {
    const cartItem = new cart(item);
    await cartItem.save();
  }
  return res.status(200).json({
    success: true,
    message: "Cart items stored in db",
  });
});

// ----------------  api to clear cart -----------------------------------------------------------------
export const clearCart = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  // const cartItems = await cart.find({ user: req.user._id })
  const deletedItems = await cart.deleteMany({ user: req.user._id });
  return res.status(200).json({
    success: true,
    message: `${deletedItems.deletedCount} Cart items deleted successfully`,
  });
});