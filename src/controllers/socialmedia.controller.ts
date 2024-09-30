import { asyncErrorHandler } from "../middleware/error.middleware";
import SocialMedia from "../models/socialMediaModels";

// Create or update multiple social media links
export const newSocialMedia = asyncErrorHandler(
    async (req, res, next) => {
        const { socialMediaLinks } = req.body; // Expecting an array of { name, link }
        if (!socialMediaLinks) {
            return
        }
        const socialMediaLinksParsed = JSON.parse(socialMediaLinks)
        console.log(socialMediaLinksParsed)
        // Find the existing social media document
        let socialMedia = await SocialMedia.findOne();

        // If no document exists, create one
        if (!socialMedia) {
            socialMedia = await SocialMedia.create({ socialMediaLinks: [] });
        }

        // Update or add new links
        // socialMediaLinksParsed.forEach(({ name, link }: { name: string, link: string }) => {
        //     const existingLinkIndex = socialMedia.socialMediaLinks.findIndex(sm => sm.name === name);

        //     if (existingLinkIndex !== -1) {
        //         // Update existing link
        //         socialMedia.socialMediaLinks[existingLinkIndex].link = link;
        //     } else {
        //         // Add new link
        //         socialMedia.socialMediaLinks.push({ name, link });
        //     }
        // });
        
        socialMedia.socialMediaLinks = socialMediaLinksParsed
        await socialMedia.save();
        return res.status(200).json({
            success: true,
            message: "Social media links updated successfully",
            socialMedia,
        });
    }
);

// Get all social media links
export const getAllSocialMedias = asyncErrorHandler(
    async (req, res, next) => {
        const socialMedia = await SocialMedia.findOne();
        return res.status(200).json({
            success: true,
            socialMediaLinks: socialMedia ? socialMedia.socialMediaLinks : [],
        });
    }
);

// Optionally, you can add a method to delete a social media link
// export const deleteSocialMedia = asyncErrorHandler(
//     async (req, res, next) => {
//         const { name } = req.params;

//         const socialMedia = await SocialMedia.findOne();
//         if (!socialMedia) {
//             return res.status(404).json({ success: false, message: "No social media links found." });
//         }

//         // Filter out the link to be deleted
//         socialMedia.socialMediaLinks = socialMedia.socialMediaLinks.filter(sm => sm.name !== name);
//         await socialMedia.save();

//         return res.status(200).json({
//             success: true,
//             message: "Social media link deleted successfully",
//             socialMedia,
//         });
//     }
// );
