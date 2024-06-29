import express from "express";

import { getCartItems, getUser, getWishlistItems, newUser, updateCart, updateProfile, updateProfileImage, updateWishlist } from "../controllers/user.controllers.js";
import { adminOnly, authenticated } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/new", newUser);
userRouter.get("/userDetails/:uid", adminOnly, getUser);
userRouter.get("/getwishlistitems", authenticated, getWishlistItems)
userRouter.get("/getcartitems", authenticated, getCartItems)
userRouter.put("/updateProfile", authenticated, updateProfile)
userRouter.put("/updateProfileImage", authenticated, updateProfileImage)
userRouter.post("/updateWishlist", authenticated, updateWishlist)
userRouter.post("/updateCart", authenticated, updateCart)


export default userRouter;
