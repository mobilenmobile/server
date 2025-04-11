import Express from "express";
import { fileUpload } from "../middleware/multer.middleware";
import { adminOnly, EditorOnly } from "../middleware/auth.middleware";
import { addNewsubCategory, deletesubCategory, searchsubCategory } from "../controllers/subCategory.controller";

const router = Express.Router();

router.get("/searchsubcategory", searchsubCategory);
router.post("/newsubcategory", EditorOnly, fileUpload.single("categoryImage"), addNewsubCategory);
router.delete("/deletesubcategory", adminOnly, deletesubCategory);

export default router;
