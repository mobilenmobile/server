import {
  addNewCategory,
  searchCategory,
  deleteCategory,
  addNewSubCategory,
} from "../controllers/category.controllers";

import Express from "express";
import { fileUpload } from "../middleware/multer.middleware";
import { adminOnly } from "../middleware/auth.middleware";

const router = Express.Router();

router.get("/", searchCategory);
router.post("/", addNewCategory);
router.post("/newSubCategory", addNewSubCategory);
router.delete("/:categoryId", deleteCategory);

export default router;
