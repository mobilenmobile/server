import express from "express"
// import { newOrder } from "../controllers/order.controller"
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from "../controllers/order.controller"
import { authenticated } from "../middleware/auth.middleware"

// import { adminOnly } from "../middleware/auth.js"

const orderRouter = express.Router()

orderRouter.post("/createOrder", authenticated, newOrder)
orderRouter.get("/myOrders", authenticated, myOrders)
orderRouter.get("/allOrders", authenticated, allOrders)
orderRouter.route("/:id")
    .get(getSingleOrder)
    .put(processOrder)
    .delete(deleteOrder)

export default orderRouter