import { Request, Response } from "express";

import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

import { resetChatHistory, run } from "../gemini/chatbot";

let flag = 0;

const getChatbotResponse = asyncHandler(async (req: Request, res: Response) => {
  try {
    const msg = req.body.msg;
    if (!msg) {
      throw new ApiError(400, "Please provide a message!");
    }

    const chatBotResponse = await run(msg);

    if (chatBotResponse) flag++;

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { chatBotResponse, flag },
          "Response send successfully!"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to do response, Please try again later!");
  }
});

const startNewChat = asyncHandler(async (req: Request, res: Response) => {
  try {
    resetChatHistory();

    flag = 0;

    return res
      .status(201)
      .json(new ApiResponse(200, flag, "Chat reset successfully!"));
  } catch (error) {
    throw new ApiError(500, "Failed to reset chat, Please try again later!");
  }
});

export { getChatbotResponse, startNewChat };
