import express from "express"
import { allAddress, deleteAddress, newAddress, updateAddress } from "../controllers/address.controller"
import { authenticated } from "../middleware/auth.middleware"

const addressRouter = express.Router()

addressRouter.post("/newAddress", authenticated, newAddress)
addressRouter.put("/updateAddress/:id", authenticated, updateAddress)
addressRouter.get("/allAddress", authenticated, allAddress)
addressRouter.delete("/deleteAddress/:id", authenticated, deleteAddress)


export default addressRouter
