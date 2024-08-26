

import express from "express";

import { getCoinAccount } from "../controllers/coin.controller";

const router = express.Router();

router.get("/getCoinAccountDetails", getCoinAccount);


export default router;
