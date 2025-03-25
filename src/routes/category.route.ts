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
import { addNewsubCategory, deletesubCategory } from "../controllers/subCategory.controller";

const router = Express.Router();

router.get("/", searchCategory);
router.post("/", addNewCategory);
router.post("/newSubCategory", addNewsubCategory);
router.post("/deleteSubCategory", deletesubCategory);
// http://192.168.1.8:3000/api/v1/category/deleteSubCategory/67e28c7e3c0a82b4c14137
router.get("/allSubCategory", getAllSubCategory);
router.delete("/:categoryId", deleteCategory);

export default router;
