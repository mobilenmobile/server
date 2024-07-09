import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { NewUserRequestBody } from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import { User } from "../models/auth/user.model";
import { Product } from "../models/product/product.model";
import { Wishlist } from "../models/wishlist/wishlist.model";
import { cart } from "../models/cart/cart.model";
import { CouponDocument, Offer } from "../models/offer/offer.model";
import { userInfo } from "os";
import { calculateDiscount } from "./product.controllers";

//api to create new user
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
    return res.status(200).json({ success: true, user });
  }
);

export const getCookie = (req: any, res: any) => {
  console.log("cookie", req.get("Cookie"));
  console.log(req.headers);
  return res.status(200).json({ success: true });
};

export const getUser = asyncErrorHandler(async (req: Request, res, next) => {
  const uid = req.params.uid;
  const user = await User.findOne({ uid }).populate("coupon")

  if (!user) {
    return next(new ErrorHandler("user doesnt exist", 400));
  }

  return res.status(200).json({ success: true, user });
});

//api to update profile 
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

//api to update profile image
export const updateProfileImage = asyncErrorHandler(async (req, res, next) => {
  const { profileImageUrl } = req.body
  console.log(req.body)
  if (!profileImageUrl) {
    return next(new ErrorHandler("enter profile image url", 404));
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }
  user.profile.profileImageUrl = profileImageUrl
  await user.save();
  return res.status(200).json({
    success: true,
    message: "Successfully changed user profile image url",
  });
});

//api to add coupon code for cart
export const updateCouponCode = asyncErrorHandler(async (req, res, next) => {
  const { couponId } = req.body
  if (!couponId) {
    return next(new ErrorHandler("enter coupon code", 404));
  }
  console.log(couponId)
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

//api to add coupon code for cart
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

//api to add coupon code for cart
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

//api to update wislist
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
  console.log("----------existingitem---------", existingItem)
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


//api to update cart
export const updateCart = asyncErrorHandler(async (req, res, next) => {

  const { productId, selectedVarianceId, quantity } = req.body

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("please enter all fields", 404));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("No product found with this id", 404));
  }

  const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });

  console.log(cartItem)

  if (cartItem && cartItem.quantity < 10) {
    cartItem.quantity = cartItem.quantity + 1
    await cartItem.save()
  }

  if (!cartItem) {
    await cart.create({
      user: req.user._id,
      productId,
      selectedVarianceId,
      quantity
    })
  }

  return res.status(200).json({
    success: true,
    message: "Successfully updated cart",
    cartItem
  });

});

//api to decrease product quantity in cart
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

  console.log(cartItem)

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


// api to get wishlist items 
export const getWishlistItems = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  const wishlistItems = await Wishlist.find({ user: req.user._id }).populate("productId");

  console.log("-------------wishlistitems--------------", wishlistItems)
  const wishlistItemsData = wishlistItems.map((item) => {
    if (item.productId.productVariance) {
      const variantData = item.productId.productVariance.find((variant: any) => {
        console.log("variant id ----------------------", variant.id, item.selectedVarianceId)
        if (variant.id == item.selectedVarianceId) {
          return variant
        }
      })
      console.log("variantData", variantData)
      const productDiscount = calculateDiscount(variantData[0]?.boxPrice, variantData[0]?.sellingPrice)
      return {

        _id: item._id,
        productId: item.productId._id,
        selectedVarianceId: item.selectedVarianceId,
        productTitle: item.productId.productTitle,
        thumbnail: variantData?.thumbnail || '',
        boxPrice: variantData?.boxPrice || '',
        sellingPrice: variantData?.$sellingPrice || '',
        productRating: item.productId.productRating,
        discount: productDiscount,
      }
    }
  })
  console.log(wishlistItemsData)
  return res.status(200).json({ success: true, wishlistItemsData });

});

// api to get wishlist items 
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
  console.log(cartItemsData)
  return res.status(200).json({ success: true, cartItemsData });
});


// api to get cart items
// export const getCartItems = asyncErrorHandler(async (req: Request, res, next) => {
//   if (!req.user?._id) {
//     return next(new ErrorHandler("unauthenticated", 400));
//   }
//   const cartItems = await cart.find({ user: req.user._id });
//   return res.status(200).json({ success: true, cartItems });

// });
// api to remove wishlist items
export const removeWishlistItem = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  if (!req.params.id) {
    return next(new ErrorHandler("no id", 400));
  }
  const wishlistItem = await Wishlist.findOne({ user: req.user._id, _id: req.params.id });
  if (!wishlistItem) {
    return next(new ErrorHandler("wishlistitem not found", 400));
  }

  await Wishlist.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: "successfully deleted item from wishlist" });

});
// api to get cart items
// export const getCartItems = asyncErrorHandler(async (req: Request, res, next) => {
//   if (!req.user?._id) {
//     return next(new ErrorHandler("unauthenticated", 400));
//   }
//   const cartItems = await cart.find({ user: req.user._id });
//   return res.status(200).json({ success: true, cartItems });

// });
// api to remove wishlist items
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



// api to get wishlist items 
export const getCartDetails = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  const cartItems = await cart.find({ user: req.user._id }).populate("productId");
  const user = await User.findOne({ _id: req.user._id })
  const appliedCoupon = await Offer.findOne({ _id: user?.coupon })

  //mapping through cartItems to structure the data
  const cartItemsData = cartItems.map((item) => {
    // console.log(item)
    if (item.productId.productVariance) {

      const variantData = item.productId.productVariance.find((variant: any) => {
        console.log(variant.id.replace(/\s+/g, ""), (item.selectedVarianceId))
        if ((variant.id.replace(/\s+/g, "")) == (item.selectedVarianceId.replace(/\s+/g, ""))) {
          return variant
        }
      })
      console.log("variantData", variantData)
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
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
  }
  const finalCartTotal = totals.DiscountedTotal - (couponDiscount)

  console.log(totals)
  console.log(cartItemsData)
  return res.status(200).json({
    success: true,
    cartItemsData,
    cartDetails: { ...totals, finalCartTotal, couponDiscount },
    offer: user?.coupon,
  });
});



// 667e538fc550fe679870bbe2