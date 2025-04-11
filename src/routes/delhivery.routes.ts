import express from "express";

import { cancelShipment, createShipment, generatePackingLabel, generatePickup, trackPackage } from "../controllers/delhivery.controller.js";
import { authenticated, EditorOnly } from "../middleware/auth.middleware.js";


const router = express.Router();


router.get("/track/:shippingId", authenticated, trackPackage);

router.post("/createShipment", EditorOnly, createShipment);
router.get("/generatePackageLabel/:waybillNumber", EditorOnly, generatePackingLabel);
router.get("/generatePickup", EditorOnly, generatePickup);
router.post("/cancelShipment", EditorOnly, cancelShipment);


export default router;
