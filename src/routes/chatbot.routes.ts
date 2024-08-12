import express from "express";
import {
  getChatbotResponse,
  startNewChat,
} from "../controllers/chatbot.controllers";

const router = express.Router();

router.route("/customer-support").post(getChatbotResponse);
router.route("/start-new-chat").get(startNewChat);

export default router;  
 