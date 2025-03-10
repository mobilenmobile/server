import express from "express"
import { authenticated } from "../middleware/auth.middleware"
import { allReviews, deleteReview, getSingleProductReview, newReview, updateReview } from "../controllers/review.controller"
import { cancellShipment, cancellShiprocketOrder, GetShiprocketCredentials, SaveShiprocketCredentials, scheduleOrderPickup, shipRocketAvailableDeliveryPartner, shipRocketCreateOrder, shipRocketGenerateAwb, shipRocketGenerateInvoice, shipRocketGenerateLabel, shipRocketGenerateManifest, shipRocketPrintManifest, trackShiprocketOrder } from "../controllers/shiprocket.controller"

const shipRocketRouter = express.Router()

shipRocketRouter.post("/checkpincodeservicable", shipRocketAvailableDeliveryPartner)
shipRocketRouter.post("/savecouriercredentials", SaveShiprocketCredentials)
shipRocketRouter.post("/admincreateorder", shipRocketCreateOrder)

shipRocketRouter.post("/admincancelshiprocketorder", cancellShiprocketOrder)

shipRocketRouter.post("/trackshipment", trackShiprocketOrder)
shipRocketRouter.post("/schedulepickup", scheduleOrderPickup)


shipRocketRouter.post("/admingenerateorderawb", shipRocketGenerateAwb)
shipRocketRouter.post("/admingeneratemanifest", shipRocketGenerateManifest)
shipRocketRouter.post("/adminprintmanifest", shipRocketPrintManifest)
shipRocketRouter.post("/admingeneratelabel", shipRocketGenerateLabel)
shipRocketRouter.post("/admingenerateinvoice", shipRocketGenerateInvoice)
shipRocketRouter.get("/getshiprocketcredential", GetShiprocketCredentials)

// shipRocketRouter.put("/updateReview/:id", authenticated, updateReview)
// shipRocketRouter.get("/allReviews/:id", allReviews)
// shipRocketRouter.get("/productReview/:id", authenticated, getSingleProductReview)
// shipRocketRouter.delete("/deleteReview/:id", authenticated, deleteReview)


export default shipRocketRouter
