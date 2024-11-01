import express from 'express'
import {
    createBox, getAllBoxes,
    getBoxById,
    updateBox,
    deleteBox,
} from '../controllers/box.controller';

const router = express.Router()


router.post("/", createBox);
router.get("/", getAllBoxes);
router.get("/:id", getBoxById);
router.put("/:id", updateBox);
router.delete("/delete/:id", deleteBox);

export default router;