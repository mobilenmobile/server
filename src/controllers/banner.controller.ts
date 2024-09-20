import { asyncErrorHandler } from "../middleware/error.middleware";
import Banner from "../models/bannerModel";
import ErrorHandler from "../utils/errorHandler";

import { Request, Response } from "express";

export const newBanner = asyncErrorHandler(
    async (req: Request, res, next) => {
        const { label, imageUrl, pageUrl } = req.body;

        // if (!req.user._id) {
        //     return next(new ErrorHandler("unauthenticated", 400));
        // }
        const banner = await Banner.create({
            label,
            imageUrl,
            pageUrl,
        });

        return res.status(201).json({
            success: true,
            message: "Banner created successfully",
            banner
        });
    }
);

export const getAllBanners = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const banners = await Banner.find();

        return res.status(200).json({
            success: true,
            data: banners,
        });
    }
);
/**
 * Get Banner
 * @route   GET /api/banners/:bannerId
 * @desc    Get banner by ID
 * @access  Public
 */
export const getBanners = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const { bannerId } = req.params;

        if (!bannerId) {
            return res.status(400).json({
                success: false,
                message: "Banner ID is required",
            });
        }

        const banner = await Banner.findById(bannerId);

        return res.status(200).json({
            success: true,
            data: banner,
        });
    }
);

/**
 * Update Banner
 * @route   PATCH /api/banners/:bannerId
 * @desc    Update banner
 * @access  Private
 */
export const updateBanner = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const { bannerId } = req.params;
        const { userId } = req.user;
        const { label, imageUrl, pageUrl } = req.body;

        if (!userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthenticated",
            });
        }

        if (!label) {
            return res.status(400).json({
                success: false,
                message: "Label is required",
            });
        }

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required",
            });
        }

        if (!bannerId) {
            return res.status(400).json({
                success: false,
                message: "Banner ID is required",
            });
        }

        const banner = await Banner.findByIdAndUpdate(
            bannerId,
            { label, imageUrl, pageUrl },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            data: banner,
        });
    }
);

/**
 * Delete Banner
 * @route   DELETE /api/banners/:bannerId
 * @desc    Delete banner
 * @access  Private
 */
export const deleteBanner = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const { bannerId } = req.params;

        if (!bannerId) {
            return res.status(400).json({
                success: false,
                message: "Banner ID is required",
            });
        }

        const banner = await Banner.findByIdAndDelete(bannerId);

        return res.status(200).json({
            success: true,
            data: banner,
        });
    }
);
