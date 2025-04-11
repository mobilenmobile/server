import express from 'express'
import {
    createBox, getAllBoxes,
    getBoxById,
    updateBox,
    deleteBox,
} from '../controllers/box.controller';
import { EditorOnly } from '../middleware/auth.middleware';

const router = express.Router()

router.post("/", EditorOnly, createBox);
router.get("/", EditorOnly, getAllBoxes);
router.get("/:id", EditorOnly, getBoxById);
router.put("/:id", EditorOnly, updateBox);
router.delete("/delete/:id", EditorOnly, deleteBox);

export default router;