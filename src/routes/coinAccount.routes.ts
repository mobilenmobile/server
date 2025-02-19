

import express from "express";

import { getCoinAccount } from "../controllers/coin.controller";
import { authenticated } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/getCoinAccountDetails",authenticated ,getCoinAccount);


export default router;
