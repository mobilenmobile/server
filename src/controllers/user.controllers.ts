import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { NewUserRequestBody } from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import { User } from "../models/auth/user.model";
import { Product } from "../models/product/product.model";
import { Wishlist } from "../models/wishlist/wishlist.model";
import { cart } from "../models/cart/cart.model";


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
  const user = await User.findOne({ uid });

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

  const existingItem = await Wishlist.findOne({ productId, selectedVarianceId });

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
  const existingItem = await cart.findOne({ productId, selectedVarianceId });

  if (existingItem) {
    return next(new ErrorHandler("This combination already exists in the cart.", 404));
  }

  if (!product) {
    return next(new ErrorHandler("No product found with this id", 404));
  }

  const newCartItem = await cart.create({
    user: req.user._id,
    productId,
    selectedVarianceId,
    quantity
  })

  return res.status(200).json({
    success: true,
    message: "Successfully added item to cart",
    newCartItem
  });

});


// api to get wishlist items 
export const getWishlistItems = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  
  const wishlistItems = await Wishlist.find({ user: req.user._id });
  return res.status(200).json({ success: true, wishlistItems });

});


// api to get cart items
export const getCartItems = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  const cartItems = await cart.find({ user: req.user._id });
  return res.status(200).json({ success: true, cartItems });

});
