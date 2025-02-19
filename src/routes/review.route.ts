import express from "express"
import { authenticated } from "../middleware/auth.middleware"
import { allReviews, deleteReview, getSingleProductReview, newReview, updateReview } from "../controllers/review.controller"

const reviewRouter = express.Router()

//provide prductid
reviewRouter.post("/newReview/:id", authenticated, newReview)

//provide review id
reviewRouter.put("/updateReview/:id", authenticated, updateReview)

//provide product id
reviewRouter.get("/allReviews/:id", allReviews)

//get review of user of a specific product like logged in user will be able to get his reviews
reviewRouter.get("/productReview/:id", authenticated,getSingleProductReview)

reviewRouter.delete("/deleteReview/:id", authenticated, deleteReview)


export default reviewRouter
