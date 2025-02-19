import express from "express"
import { cancellOrder, deleteOrder, getAdminSingleOrderDetails, getAllAdminOrders, getAllOrders, getSingleOrderDetails, newOrder, processOrder } from "../controllers/order.controller"
import { adminOnly, authenticated, EditorOnly } from "../middleware/auth.middleware"
import { newInvoice } from "../controllers/Invoice.controller"

const orderRouter = express.Router()

orderRouter.post("/createOrder", authenticated, newOrder)
orderRouter.get("/allOrders", authenticated, getAllOrders)
orderRouter.get("/orderDetails/:id", authenticated, getSingleOrderDetails)
orderRouter.post("/cancellOrder", authenticated, cancellOrder)

// -------------------- admin routes---------------------------
orderRouter.put("/processOrder/:id",EditorOnly, processOrder)
// orderRouter.put("/:id", processOrder)
orderRouter.post("/deleteOrder", deleteOrder)
orderRouter.get("/getAllAdminOrders", getAllAdminOrders)
orderRouter.get("/getOrderDetails/:id", getAdminSingleOrderDetails)

// -------------------------Invoice route-------------------------------
// This route is not working as we are using invoice of shiprocket 
orderRouter.post("/generateinvoice", newInvoice)

export default orderRouter