import {
  deleteBrand,
  getAllBrand,
  newBrand,
} from "../controllers/brand.controllers";

import express from "express";
import { fileUpload } from "../middleware/multer.middleware";
import { adminOnly } from "../middleware/auth.middleware";
import { deleteModel, newModel, searchModels, searchModelsv2 } from "../controllers/model.controller";

const router = express.Router();

router.post("/addnewbrand", fileUpload.single("brandImage"), newBrand);
// router.post("/addnewbrandv2", fileUpload.single("brandImage"), newBrandv2);
// -------------------- new model--------------------
router.post('/newmodel', newModel);
router.get('/searchmodels', searchModelsv2);


// router.get("/searchbrandv2", getAllBrandv2);
router.get("/searchbrand", getAllBrand);
router.delete("/deletebrand",  deleteBrand);

// ----------- delete model -----------------------
router.delete("/deletemodel", adminOnly, deleteModel  );

export default router;
