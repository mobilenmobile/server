import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { resetChatHistory, run } from "../gemini/chatbot";
import { asyncErrorHandler } from "../middleware/error.middleware";
import ErrorHandler from "../utils/errorHandler";



//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.getChatbotResponse
// 2.startNewChat

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------


let flag = 0;
// ------------------------- Api to get chatbot response----------------------------------------------------------
export const getChatbotResponse = asyncErrorHandler(async (req: Request, res: Response, next) => {
  try {
    const msg = req.body.msg;
    if (!msg) {
      // throw new ApiError(400, "Please provide a message!");
      return next(new ErrorHandler("Please provide a message!", 400));
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
    // throw new ApiError(500, "Failed to do response, Please try again later!");
    return next(new ErrorHandler("Failed to do response, Please try again later!", 500));
  }
});

// ------------------------- Api to start new chat ----------------------------------------------------------
export const startNewChat = asyncErrorHandler(async (req: Request, res: Response, next) => {
  try {
    resetChatHistory();
    flag = 0;
    return res
      .status(201)
      .json(new ApiResponse(200, flag, "Chat reset successfully!"));
  } catch (error) {
    // throw new ApiError(500, "Failed to reset chat, Please try again later!");
    return next(new ErrorHandler("Failed to reset chat, Please try again later!", 500));
  }
  
});


