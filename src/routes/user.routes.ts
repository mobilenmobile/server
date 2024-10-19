import express from "express";

import {
    changeUserRole,
    clearCart,
    decreaseCartProductQuantity,
    findUser,
    getAppliedCoupon,
    getBuyNowCartDetails,
    getCartDetails,
    getUnAuthenticatedCartDetails,
    getUser,
    getWishlistItems,
    listAllUsers,
    newUser,
    removeCartItem,
    removeComboItem,
    removeCouponCode,
    removeFreeItem,
    removeWishlistItem,
    storeCartItemsInDb,
    updateCart, updateCouponCode,
    updateProfile,
    updateProfileImage,
    updateWishlist
} from "../controllers/user.controllers.js";

import { authenticated, EditorOnly, newUserOnly, UserInfo } from "../middleware/auth.middleware.js";
import { getCoinAccount, setUseCoinBalance } from "../controllers/coin.controller.js";


const userRouter = express.Router();

// --------------------------user routes-------------------------------------------
userRouter.post("/new", newUserOnly, newUser);
userRouter.get("/userDetails/:uid", authenticated, getUser);
userRouter.get("/userDetails", UserInfo);
userRouter.post("/userBasicInfo", findUser);

//----------------------- USER COIN SECTION --------------------------------
userRouter.get("/getCoinAccountDetails", authenticated, getCoinAccount);
userRouter.post("/coinForPayment", authenticated, setUseCoinBalance);

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
userRouter.post("/getUnauthenticatedCartDetails", getUnAuthenticatedCartDetails)
userRouter.post("/storeCartItemInDb", authenticated, storeCartItemsInDb)
userRouter.get("/getcartitems", authenticated, getCartDetails)
userRouter.post("/updateCart", authenticated, updateCart)
userRouter.post("/removeComboItem", authenticated, removeComboItem)

userRouter.post("/removeFreeItem", authenticated, removeFreeItem)

userRouter.delete("/removecartitem/:id", authenticated, removeCartItem)
userRouter.post("/decreasecartproductquantity", authenticated, decreaseCartProductQuantity)
userRouter.delete("/clearcart", authenticated, clearCart)

// ------------------------   buy now related routes-------------------------------------------

userRouter.post("/getBuyNowCartDetails", authenticated, getBuyNowCartDetails)


// ====================== admin user =============================
userRouter.get("/getallusers", listAllUsers)
userRouter.post("/changeroles", changeUserRole);


export default userRouter;
