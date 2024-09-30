import { asyncErrorHandler } from "../middleware/error.middleware";
import Banner from "../models/bannerModel";
import ErrorHandler from "../utils/errorHandler";

import { Request, Response } from "express";

export const newBanner = asyncErrorHandler(
    async (req: Request, res, next) => {
        const { label, pageUrl, mobileBanner } = req.body;
        const { bannerId } = req.query
        console.log(req.body, "body req")

        let existingBanner;
        if (bannerId) {
            existingBanner = await Banner.findById(bannerId)
        }

        if (existingBanner) {
            if (label) {
                existingBanner.label = label
            }
            if (pageUrl) {
                existingBanner.pageUrl = pageUrl
            }
            if (mobileBanner) {
                existingBanner.bannerImage = mobileBanner
            }

            await existingBanner.save()
            console.log(existingBanner, "banner result")
            return res.status(201).json({
                success: true,
                message: "Banner updated successfully",
                banner: existingBanner
            });

        }


        // if (!req.user._id) {
        //     return next(new ErrorHandler("unauthenticated", 400));
        // }
        const banner = await Banner.create({
            label,
            pageUrl,
            bannerImage: mobileBanner

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
        const { bannerId } = req.query
        const query: any = {}
        console.log(bannerId)
        if (bannerId) {
            if(typeof bannerId !=="string"){
                return
            }
            query._id = bannerId
        }
        const banners = await Banner.find(query);
        console.log(banners)

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
        console.log(bannerId, "bannerid")
        console.log(await Banner.find())

        console.log(await Banner.findOne({ _id: bannerId }))
        const findBanner = await Banner.findById(bannerId)
        if (!findBanner) {
            return res.json({ error: "no id found" })
        }
        const banner = await Banner.findByIdAndDelete(bannerId);


        return res.status(200).json({
            success: true,
            data: banner,
        });
    }
);
