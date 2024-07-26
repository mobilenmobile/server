import express from "express";

import {
    clearCart,
    decreaseCartProductQuantity,
    getAppliedCoupon,
    getCartDetails,
    getUser,
    getWishlistItems,
    newUser,
    removeCartItem,
    removeCouponCode,
    removeWishlistItem,
    updateCart, updateCouponCode,
    updateProfile,
    updateProfileImage,
    updateWishlist
} from "../controllers/user.controllers.js";

import { authenticated } from "../middleware/auth.middleware.js";


const userRouter = express.Router();

// --------------------------user routes-------------------------------------------
userRouter.post("/new", newUser);
userRouter.get("/userDetails/:uid", authenticated, getUser);
userRouter.put("/updateProfile", authenticated, updateProfile)
userRouter.put("/updateProfileImage", authenticated, updateProfileImage)

// --------------------- user coupon related routes ------------------------------
userRouter.get("/getAppliedCoupon", authenticated, getAppliedCoupon);
userRouter.put("/updateCoupon", authenticated, updateCouponCode)
userRouter.put("/removeCoupon", authenticated, removeCouponCode)

// -------------------------wishlist related routes------------------------------
userRouter.get("/getwishlistitems", authenticated, getWishlistItems)
userRouter.post("/updateWishlist", authenticated, updateWishlist)
userRouter.put("/removewishlistitem", authenticated, removeWishlistItem)

// -------------------------- cart related routes --------------------------------
userRouter.get("/getcartitems", authenticated, getCartDetails)
userRouter.post("/updateCart", authenticated, updateCart)
userRouter.delete("/removecartitem/:id", authenticated, removeCartItem)
userRouter.post("/decreasecartproductquantity", authenticated, decreaseCartProductQuantity)
userRouter.delete("/clearcart", authenticated, clearCart)


export default userRouter;
