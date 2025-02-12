import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler.js";
import { ControllerType } from "../types/types.js";
import multer from "multer";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err);
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File size too large. Maximum size is 10 MB." });
    }
  } else if (err) {
    // Other errors
    return res.status(500).json({ success: false, message: "An error occurred during the upload." });
  }
  err.message ||= "Some error occured while performing the operation";
  err.statusCode ||= 500;
  if (err.name === "CastError") {
    err.message = "Invalid Id";
  }
  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};


export const asyncErrorHandler =
  (func: ControllerType) =>
    (req: Request, res: Response, next: NextFunction) => {
      return Promise.resolve(func(req, res, next)).catch(next);
    };
