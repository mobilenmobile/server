import {
  addNewCategory,
  searchCategory,
  deleteCategory,
} from "../controllers/category.controllers";

import Express from "express";
import { fileUpload } from "../middleware/multer.middleware";
import { adminOnly } from "../middleware/auth.middleware";

const router = Express.Router();

router.get("/searchcategory", searchCategory);
router.post("/newcategory", fileUpload.single("categoryImage"), addNewCategory);
router.delete("/deletecategory",adminOnly, deleteCategory);

export default router;
