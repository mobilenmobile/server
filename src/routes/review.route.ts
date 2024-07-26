import express from "express"
import { authenticated } from "../middleware/auth.middleware"
import { allReviews, deleteReview, getSingleProductReview, newReview, updateReview } from "../controllers/review.controller"

const addressRouter = express.Router()

addressRouter.post("/newReview/:id", authenticated, newReview)
addressRouter.put("/updateReview/:id", authenticated, updateReview)
addressRouter.get("/allReviews/:id", allReviews)
addressRouter.get("/productReview/:id", authenticated,getSingleProductReview)
addressRouter.delete("/deleteReview/:id", authenticated, deleteReview)


export default addressRouter
