import {
  deleteBrand,
  getAllBrand,
  newBrand,
} from "../controllers/brand.controllers";

import express from "express";
import { fileUpload } from "../middleware/multer.middleware";
import { adminOnly } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/addnewbrand", fileUpload.single("brandImage"), newBrand);
router.get("/searchbrand", getAllBrand);
router.delete("/deletebrand",adminOnly, deleteBrand);

export default router;
