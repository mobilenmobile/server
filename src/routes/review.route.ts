import express from "express"
import { authenticated } from "../middleware/auth.middleware"
import { allReviews, deleteReview, newReview, updateReview } from "../controllers/review.controller"

const addressRouter = express.Router()

addressRouter.post("/newReview/:id", authenticated, newReview)
addressRouter.put("/updateReview/:id", authenticated, updateReview)
addressRouter.get("/allReviews/:id",  allReviews)
addressRouter.delete("/deleteReview/:id", authenticated, deleteReview)

//some data
export default addressRouter
