import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler.js";
import { ControllerType } from "../types/types.js";
import multer from "multer";

export const errorMiddleware = (
    err: ErrorHandler | Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error occurred:', err);

    // Multer-specific errors
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case "LIMIT_FILE_SIZE":
                return res.status(400).json({ 
                    success: false, 
                    message: "File size too large. Maximum size is 10 MB." 
                });
            case "LIMIT_FILE_COUNT":
                return res.status(400).json({ 
                    success: false, 
                    message: "Too many files uploaded. Maximum file count exceeded." 
                });
            case "LIMIT_UNEXPECTED_FILE":
                return res.status(400).json({ 
                    success: false, 
                    message: "Unexpected file field." 
                });
            default:
                return res.status(500).json({ 
                    success: false, 
                    message: "File upload error." 
                });
        }
    }

    // Custom ErrorHandler instance
    if (err instanceof ErrorHandler) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // Mongoose CastError
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format",
        });
    }

    // Generic error handling
    return res.status(500).json({
        success: false,
        message: err.message || "An unexpected error occurred during the operation",
    });
};

export const asyncErrorHandler = 
    (func: ControllerType) => 
    (req: Request, res: Response, next: NextFunction) => {
        return Promise.resolve(func(req, res, next)).catch(next);
    };