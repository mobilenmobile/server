import {
  addNewCategory,
  searchCategory,
  deleteCategory,
  addNewSubCategory,
  getAllSubCategory,
} from "../controllers/category.controllers";

import Express from "express";
import { fileUpload } from "../middleware/multer.middleware";
import { adminOnly } from "../middleware/auth.middleware";
import { addNewsubCategory } from "../controllers/subCategory.controller";

const router = Express.Router();

router.get("/", searchCategory);
router.post("/", addNewCategory);
router.post("/newSubCategory", addNewsubCategory);
router.get("/allSubCategory", getAllSubCategory);
router.delete("/:categoryId", deleteCategory);

export default router;
