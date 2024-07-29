import express from "express"
import { cancellOrder, deleteOrder, getAllAdminOrders, getAllOrders, getSingleOrderDetails, newOrder, processOrder } from "../controllers/order.controller"
import { adminOnly, authenticated } from "../middleware/auth.middleware"

const orderRouter = express.Router()

orderRouter.post("/createOrder", authenticated, newOrder)
orderRouter.get("/allOrders", authenticated, getAllOrders)
orderRouter.get("/orderDetails/:id", authenticated, getSingleOrderDetails)
orderRouter.put("/processOrder/:id", authenticated, processOrder)
orderRouter.put("/cancellOrder/:id", authenticated, cancellOrder)

// -------------------- admin routes---------------------------
orderRouter.put("/:id", adminOnly, processOrder)
orderRouter.delete("/deleteOrder/:id", adminOnly, deleteOrder)
orderRouter.get("/getAllAdminOrders", adminOnly, getAllAdminOrders)

export default orderRouter