import {
  deleteBrand,
  getAllBrand,
  getAllBrandWithoutCategory,
  newBrand,
} from "../controllers/brand.controllers";

import express from "express";
import { fileUpload } from "../middleware/multer.middleware";
import { adminOnly, EditorOnly } from "../middleware/auth.middleware";
import { deleteModel, getFormattedModels, newModel, searchModels, searchModelsv2, updateModel } from "../controllers/model.controller";

const router = express.Router();

router.post("/addnewbrand", newBrand);
// router.post("/addnewbrandv2", fileUpload.single("brandImage"), newBrandv2);

// router.get("/searchbrandv2", getAllBrandv2);
router.get("/searchbrand", getAllBrand);
router.get("/searchallCategorybrands", getAllBrandWithoutCategory)
router.delete("/:brandId",EditorOnly, deleteBrand);


// -------------------- new model--------------------
router.post('/newmodel', newModel);
router.put('/updatemodel/:id', updateModel);
router.get('/searchmodels', searchModelsv2);
router.get('/getallmodels', getFormattedModels);
router.delete("/deletemodel/:modelId",EditorOnly, deleteModel);



export default router;
