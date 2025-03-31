import express from "express";
// import { checkServiceability } 
import { cancelShipment, createShipment, generatePackingLabel, generatePickup } from "../controllers/delhivery.controller.js";


const router = express.Router();

// Check if a pincode is serviceable
// router.get("/serviceability/:pinCode", checkServiceability);

// Create a shipment (Generate Waybill)
router.post("/createShipment", createShipment);
router.get("/generatePackageLabel/:waybillNumber", generatePackingLabel);
router.get("/generatePickup", generatePickup);
router.post("/cancelShipment", cancelShipment);




export default router;
