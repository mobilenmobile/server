import express from "express";

import {
    changeUserRole,
    checkIfUserExist,
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
    updateRole,
    updateWishlist
} from "../controllers/user.controllers.js";

import { adminOnly, authenticated, EditorOnly, newUserOnly, UserInfo } from "../middleware/auth.middleware.js";
import { getCoinAccount, setUseCoinBalance } from "../controllers/coin.controller.js";
import { userOrderAnalytic } from "../controllers/Dashboard/userAnalytic.controller.js";


const userRouter = express.Router();

// --------------------------user routes-------------------------------------------
userRouter.post("/new", newUserOnly, newUser);
userRouter.get("/userDetails/:uid", authenticated, getUser);
userRouter.get("/userDetails", UserInfo);
userRouter.post("/userBasicInfo", findUser);
userRouter.post("/userExist", checkIfUserExist);

/**
 * Admin routes to change user role 
 */
userRouter.put("/updaterole", adminOnly, updateRole)

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

//unauthenticated user cart item details
userRouter.post("/getUnauthenticatedCartDetails", getUnAuthenticatedCartDetails)

//authenticated user cart routes
userRouter.post("/updateCart", authenticated, updateCart)
userRouter.get("/getcartitems", authenticated, getCartDetails)

//shift all offline cart item into db
userRouter.post("/storeCartItemInDb", authenticated, storeCartItemsInDb)

userRouter.post("/decreasecartproductquantity", authenticated, decreaseCartProductQuantity)
userRouter.delete("/removecartitem/:id", authenticated, removeCartItem)
userRouter.delete("/clearcart", authenticated, clearCart)

//remove combo and free product from cart
userRouter.post("/removeComboItem", authenticated, removeComboItem)
userRouter.post("/removeFreeItem", authenticated, removeFreeItem)

// ------------------------   buy now related routes-------------------------------------------

// userRouter.post("/getBuyNowCartDetails", authenticated, getBuyNowCartDetails)

// ====================== admin user =============================
userRouter.get("/getallusers", adminOnly, listAllUsers)
userRouter.post("/changeroles", adminOnly, changeUserRole);
userRouter.get("/userOrderAnalytic/:userId", userOrderAnalytic)


export default userRouter;
