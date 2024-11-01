import { Request, Response, NextFunction } from "express";

import ErrorHandler from "../utils/errorHandler"; // Custom error handler
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Box } from "../models/boxModel";

// Create a new Box
export const createBox = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, length, breadth, height, weight } = req.body;

    const box = await Box.create({ name, length, breadth, height, weight });
    return res.status(201).json({ success: true, message: "Box created successfully", box });
  }
);

// Get all Boxes
export const getAllBoxes = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const boxes = await Box.find();
    return res.status(200).json({ success: true, boxes });
  }
);

// Get a single Box by ID
export const getBoxById = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const box = await Box.findById(req.params.id);
    if (!box) {
      return next(new ErrorHandler("Box not found", 404));
    }
    return res.status(200).json({ success: true, box });
  }
);

// Update a Box by ID
export const updateBox = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, length, breadth, height, weight } = req.body;

    let box = await Box.findById(req.params.id);
    if (!box) {
      return next(new ErrorHandler("Box not found", 404));
    }

    box.name = name || box.name;
    box.length = length !== undefined ? length : box.length;
    box.breadth = breadth !== undefined ? breadth : box.breadth;
    box.height = height !== undefined ? height : box.height;
    box.weight = weight !== undefined ? weight : box.weight;

    await box.save();
    return res.status(200).json({ success: true, message: "Box updated successfully", box });
  }
);

// Delete a Box by ID
export const deleteBox = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const boxId = req.params.id;
    const box = await Box.findById(boxId);
    
    if (!box) {
      return next(new ErrorHandler("Box not found", 404));
    }

    await Box.findByIdAndDelete(boxId); // Using findByIdAndDelete instead of remove
    return res.status(200).json({ success: true, message: "Box deleted successfully" });
  }
);

