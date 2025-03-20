import { asyncErrorHandler } from "../middleware/error.middleware";
import Banner from "../models/bannerModel";
import { Request, Response } from "express";

export const newBanner = asyncErrorHandler(async (req: Request, res) => {
    const { page, mainImage, otherImages } = req.body;
    const { bannerId } = req.query;

    let existingBanner;
    if (bannerId) {
        existingBanner = await Banner.findById(bannerId);
        if (!existingBanner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        if (page === "home") {
            if (mainImage) existingBanner.homeBanner.mainImage = mainImage;
            if (otherImages.length) existingBanner.homeBanner.otherImages = otherImages;
        } else if (page === "skin") {
            if (mainImage) existingBanner.skinBanner.mainImage = mainImage;
            if (otherImages.length) existingBanner.skinBanner.otherImages = otherImages;
        } else {
            if (mainImage) existingBanner.accessoriesBanner.mainImage = mainImage;
            if (otherImages.length) existingBanner.accessoriesBanner.otherImages = otherImages;
        }

        await existingBanner.save();
        return res.status(200).json({ success: true, message: "Banner updated successfully", banner: existingBanner });
    }

    const newBanner = {
        homeBanner: page === "home" ? { mainImage, otherImages } : undefined,
        skinBanner: page === "skin" ? { mainImage, otherImages } : undefined,
        accessoriesBanner: page === "accessories" ? { mainImage, otherImages } : undefined,
    };

    const banner = await Banner.create(newBanner);
    return res.status(201).json({ success: true, message: "Banner created successfully", banner });
});

export const getAllBanners = asyncErrorHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.query;
    const query = bannerId ? { _id: bannerId } : {};
    const banners = await Banner.find(query);
    return res.status(200).json({ success: true, banners });
});

export const getBannerById = asyncErrorHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }
    return res.status(200).json({ success: true, banner });
});

export const updateBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    const { mainImage, otherImages } = req.body;

    const banner = await Banner.findByIdAndUpdate(
        bannerId,
        { mainImage, otherImages },
        { new: true }
    );

    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    return res.status(200).json({ success: true, banner });
});

export const deleteBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    const { page, mainImage, otherImagesUrl } = req.body;

    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    if (page === "home") {
        if (mainImage) banner.homeBanner.mainImage = { imgUrl: "", redirectUrl: "" };
        if (otherImagesUrl) {
            banner.homeBanner.otherImages = banner.homeBanner.otherImages.filter(
                (img: { imgUrl: string }) => img.imgUrl !== otherImagesUrl
            );
        }
    } else if (page === "skin") {
        if (mainImage) banner.skinBanner.mainImage = { imgUrl: "", redirectUrl: "" };
        if (otherImagesUrl) {
            banner.skinBanner.otherImages = banner.skinBanner.otherImages.filter(
                (img: { imgUrl: string }) => img.imgUrl !== otherImagesUrl
            );
        }
    } else {
        if (mainImage) banner.accessoriesBanner.mainImage = { imgUrl: "", redirectUrl: "" };
        if (otherImagesUrl) {
            banner.accessoriesBanner.otherImages = banner.accessoriesBanner.otherImages.filter(
                (img: { imgUrl: string }) => img.imgUrl !== otherImagesUrl
            );
        }
    }

    await banner.save();
    return res.status(200).json({ success: true, banner });
});
