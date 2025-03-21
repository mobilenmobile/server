import { asyncErrorHandler } from "../middleware/error.middleware";
import Banner from "../models/bannerModel";
import { Request, Response } from "express";

const isValidUrl = (url: string) => {
    if (!url) return true; // Allow empty redirectUrl
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

export const newBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const { page, mainImage, otherImages } = req.body;
    const { bannerId } = req.query;

    if (mainImage && (!mainImage.imgUrl || !isValidUrl(mainImage.imgUrl))) {
        return res.status(400).json({ success: false, message: "Invalid mainImage URL" });
    }
    if (mainImage?.redirectUrl && !isValidUrl(mainImage.redirectUrl)) {
        return res.status(400).json({ success: false, message: "Invalid mainImage redirect URL" });
    }
    if (otherImages && !Array.isArray(otherImages)) {
        return res.status(400).json({ success: false, message: "otherImages should be an array" });
    }
    for (let img of otherImages || []) {
        if (!img.imgUrl || !isValidUrl(img.imgUrl)) {
            return res.status(400).json({ success: false, message: "Invalid otherImages URL" });
        }
        if (img.redirectUrl && !isValidUrl(img.redirectUrl)) {
            return res.status(400).json({ success: false, message: "Invalid otherImages redirect URL" });
        }
    }

    let existingBanner;
    if (bannerId) {
        existingBanner = await Banner.findById(bannerId);
        if (!existingBanner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }
    } else {
        existingBanner = new Banner({});
    }

    const bannerField = `${page}Banner`;
    if (mainImage) existingBanner[bannerField].mainImage = mainImage;
    if (otherImages?.length) existingBanner[bannerField].otherImages = otherImages;

    await existingBanner.save();
    return res.status(200).json({ success: true, message: "Banner saved successfully", banner: existingBanner });
});

export const getAllBanners = asyncErrorHandler(async (req: Request, res: Response) => {
    const banners = await Banner.find();
    return res.status(200).json({ success: true, banners });
});

export const updateBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    const { page, mainImage, otherImages } = req.body;

    if (!page || !["home", "skin", "accessories"].includes(page)) {
        return res.status(400).json({ success: false, message: "Invalid page" });
    }
    if (mainImage && (!mainImage.imgUrl || !isValidUrl(mainImage.imgUrl))) {
        return res.status(400).json({ success: false, message: "Invalid mainImage URL" });
    }
    if (mainImage?.redirectUrl && !isValidUrl(mainImage.redirectUrl)) {
        return res.status(400).json({ success: false, message: "Invalid mainImage redirect URL" });
    }
    if (otherImages && !Array.isArray(otherImages)) {
        return res.status(400).json({ success: false, message: "otherImages should be an array" });
    }
    for (let img of otherImages || []) {
        if (!img.imgUrl || !isValidUrl(img.imgUrl)) {
            return res.status(400).json({ success: false, message: "Invalid otherImages URL" });
        }
        if (img.redirectUrl && !isValidUrl(img.redirectUrl)) {
            return res.status(400).json({ success: false, message: "Invalid otherImages redirect URL" });
        }
    }

    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const bannerField = `${page}Banner`;
    if (mainImage) banner[bannerField].mainImage = mainImage;
    if (otherImages?.length) banner[bannerField].otherImages = otherImages;

    await banner.save();
    return res.status(200).json({ success: true, banner });
});

export const deleteBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    const { page, mainImage, otherImagesUrl } = req.body;

    if (!page || !["home", "skin", "accessories"].includes(page)) {
        return res.status(400).json({ success: false, message: "Invalid page" });
    }
    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const bannerField = `${page}Banner`;
    if (mainImage) banner[bannerField].mainImage = { imgUrl: "", redirectUrl: "" };
    if (otherImagesUrl) {
        banner[bannerField].otherImages = banner[bannerField].otherImages.filter(
            (img:{imgUrl:string}) => img.imgUrl !== otherImagesUrl
        );
    }

    await banner.save();
    return res.status(200).json({ success: true, banner });
});
