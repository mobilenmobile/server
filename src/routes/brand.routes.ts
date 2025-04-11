import {
  deleteBrand,
  getAllBrand,
  getAllBrandWithoutCategory,
  newBrand,
} from "../controllers/brand.controllers";

import express from "express";

import { deleteModel, getFormattedModels, getSingleModel, newModel, searchModelsv2, updateModel } from "../controllers/model.controller";
import { EditorOnly } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/searchbrand", getAllBrand);
router.get("/searchallCategorybrands", getAllBrandWithoutCategory)


// ---------------------- Archived routes -------------------------------
// router.post("/addnewbrandv2", fileUpload.single("brandImage"), newBrandv2);
// router.get("/searchbrandv2", getAllBrandv2);

// ------------------------- protected routes ---------------------
router.post("/addnewbrand", EditorOnly, newBrand);
router.delete("/:brandId", EditorOnly, deleteBrand);

// #################### models routes ##############################

// -------------------- new model--------------------
router.get('/searchmodels', searchModelsv2);
router.get('/getallmodels', getFormattedModels);
router.get('/getSingleModel/:id', getSingleModel);

// ---------------------- protected routes ---------------------------
router.post('/newmodel', EditorOnly, newModel);
router.put('/updatemodel/:id', EditorOnly, updateModel);
router.delete("/deletemodel/:modelId", EditorOnly, deleteModel);



export default router;
