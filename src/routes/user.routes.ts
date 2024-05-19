import express from "express";

import { getUser, newUser } from "../controllers/user.controllers.js";
import { adminOnly } from "../middleware/auth.middleware.js";
// import {Router} from "express"
// const router = Router()
const userRouter = express.Router();

// router.route("/login").post(loginUser)

userRouter.post("/new", newUser);
// userRouter.post("/login", Login);
// userRouter.get("/getcookie", getCookie);

// userRouter.get("/allUsers",adminOnly,getAllUsers)
userRouter.get("/userDetails/:uid", adminOnly, getUser);
// userRouter.put("/changeUserRole/:id",adminOnly,changeUserRole)
// userRouter.delete("/deleteUser/:id",adminOnly,deleteUser)

export default userRouter;
