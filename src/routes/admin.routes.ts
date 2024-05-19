import Express from "express";
import { verifyAdmin } from "../controllers/verifyAdmin.controllers";

const router = Express.Router();

router.post("/verifyadmin", verifyAdmin);

export default router;
