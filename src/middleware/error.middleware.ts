import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err);
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
