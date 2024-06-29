import express from "express"
import { cancellOrder, deleteOrder, getAllAdminOrders, getAllOrders, newOrder, processOrder } from "../controllers/order.controller"
import { authenticated } from "../middleware/auth.middleware"

const orderRouter = express.Router()

orderRouter.post("/createOrder", authenticated, newOrder)

orderRouter.get("/allOrders", authenticated, getAllOrders)

orderRouter.get("/getAllAdminOrders", authenticated, getAllAdminOrders)

orderRouter.put("/processOrder/:id", authenticated, processOrder)

orderRouter.delete("/deleteOrder/:id", authenticated, deleteOrder)

orderRouter.put("/cancellOrder/:id", authenticated, cancellOrder)

orderRouter.route("/:id").put(processOrder)

export default orderRouter