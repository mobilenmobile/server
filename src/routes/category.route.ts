import {
  addNewCategory,
  searchCategory,
  deleteCategory,
  getAllSubCategory,
} from "../controllers/category.controllers";

import Express from "express";

import { EditorOnly } from "../middleware/auth.middleware";
import { addNewsubCategory, deletesubCategory } from "../controllers/subCategory.controller";

const router = Express.Router();

// -------------------- category routes----------------------
router.get("/", searchCategory);
router.post("/", addNewCategory);

// ------------------ protected routes --------------------------------
router.delete("/:categoryId", EditorOnly, deleteCategory);

// -------------------- subcategory routes ---------------------
router.get("/allSubCategory", getAllSubCategory);
// ------------------- Protected routes ------------------------
router.post("/newSubCategory", EditorOnly, addNewsubCategory);
router.post("/deleteSubCategory", EditorOnly, deletesubCategory);

export default router;
