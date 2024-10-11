import { asyncErrorHandler } from "../middleware/error.middleware";
import Banner from "../models/bannerModel";
import ErrorHandler from "../utils/errorHandler";

import { Request, Response } from "express";

export const newBanner = asyncErrorHandler(
    async (req: Request, res, next) => {
        const { page, mainImage, otherImages } = req.body;
        const { bannerId } = req.query
        console.log(req.body, "body req")

        let existingBanner;
        if (bannerId) {
            existingBanner = await Banner.findById(bannerId)
            console.log(existingBanner, "existing banner")


            if (page === "home") {

                if (mainImage) {
                    existingBanner.homeBanner.mainImage = mainImage
                }
                if (otherImages.length !== 0) {
                    existingBanner.homeBanner.otherImages = otherImages
                }

            }
            else if (page === "skin") {
                if (mainImage) {
                    existingBanner.skinBanner.mainImage = mainImage
                }
                if (otherImages.length !== 0) {
                    existingBanner.skinBanner.otherImages = otherImages
                }
            }
            else {
                if (mainImage) {
                    existingBanner.accessoriesBanner.mainImage = mainImage
                }
                if (otherImages.length !== 0) {
                    existingBanner.accessoriesBanner.otherImages = otherImages
                }
            }

            await existingBanner.save()
            return res.status(201).json({
                success: true,
                message: "Banner created successfully",
                banner: existingBanner
            });
        }
        else {
            let homeBanner;
            let accessoriesBanner;
            let skinBanner
            if (page === "home") {
                homeBanner = {
                    mainImage: mainImage,
                    otherImages: otherImages
                }

            }
            else if (page === "skin") {
                skinBanner = {
                    mainImage: mainImage,
                    otherImages: otherImages
                }
            }
            else {
                accessoriesBanner = {
                    mainImage: mainImage,
                    otherImages: otherImages
                }
            }
            const banner = await Banner.create({
                homeBanner,
                skinBanner,
                accessoriesBanner

            });

            return res.status(201).json({
                success: true,
                message: "Banner created successfully",
                banner
            });

        }





    }
);

export const getAllBanners = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const { bannerId } = req.query
        const query: any = {}
        console.log(bannerId)
        if (bannerId) {
            if (typeof bannerId !== "string") {
                return
            }
            query._id = bannerId
        }
        const banners = await Banner.find(query);
        console.log(banners)

        return res.status(200).json({
            success: true,
            banner: banners,
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
        console.log("hey")

        const { bannerId } = req.params;
        const { page, mainImage, otherImagesUrl } = req.body;

        console.log(bannerId, "bannerid banner id")
        console.log(otherImagesUrl)

        if (!bannerId) {
            return res.status(400).json({
                success: false,
                message: "Banner ID is required",
            });
        }
        console.log(bannerId, "bannerid")



        console.log(await Banner.findOne({ _id: bannerId }))
        const findBanner = await Banner.findById(bannerId)
        if (!findBanner) {
            return res.json({ error: "no id found" })
        }
        console.log(otherImagesUrl, "other")


        const banner = await Banner.findById(bannerId);

        if (page === "home") {

            if (mainImage) {
                banner.homeBanner.mainImage = ""
            }
            if (otherImagesUrl) {
                const otherImage = banner.homeBanner.otherImages.filter((item: string) => item !== otherImagesUrl)
                console.log(otherImage, "other image")
                banner.homeBanner.otherImages = otherImage
            }

        }
        else if (page === "skin") {
            if (mainImage) {
                banner.skinBanner.mainImage = ""
            }
            if (otherImagesUrl) {
                banner.skinBanner.otherImages.filter((item: string) => item !== otherImagesUrl)
            }
        }

        else {
            if (mainImage) {
                banner.accessoriesBanner.mainImage = ""
            }
            if (otherImagesUrl) {
                banner.accessoriesBanner.otherImages.filter((item: string) => item !== otherImagesUrl)
            }
        }

        await banner.save()


        return res.status(200).json({
            success: true,
            banner,
        });
    }
);
