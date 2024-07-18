import express from "express";

import { decreaseCartProductQuantity, getAppliedCoupon, getCartDetails, getCartItems, getUser, getWishlistItems, newUser, removeCartItem, removeCouponCode, removeWishlistItem, updateCart, updateCouponCode, updateProfile, updateProfileImage, updateWishlist } from "../controllers/user.controllers.js";
import { adminOnly, authenticated } from "../middleware/auth.middleware.js";


const userRouter = express.Router();
userRouter.post("/new", newUser);
userRouter.get("/userDetails/:uid", adminOnly, getUser);
userRouter.get("/getAppliedCoupon", adminOnly, getAppliedCoupon);
userRouter.get("/getwishlistitems", authenticated, getWishlistItems)
userRouter.get("/getcartitems", authenticated, getCartDetails)
userRouter.put("/updateProfile", authenticated, updateProfile)
userRouter.put("/updateProfileImage", authenticated, updateProfileImage)
userRouter.put("/updateCoupon", authenticated, updateCouponCode)
userRouter.put("/removeCoupon", authenticated, removeCouponCode)
userRouter.post("/decreasecartproductquantity", authenticated, decreaseCartProductQuantity)
userRouter.post("/updateWishlist", authenticated, updateWishlist)
userRouter.post("/updateCart", authenticated, updateCart)
userRouter.put("/removewishlistitem", authenticated, removeWishlistItem)
userRouter.delete("/removecartitem/:id", authenticated, removeCartItem)


export default userRouter;
