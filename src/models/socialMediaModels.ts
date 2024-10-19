// models/SocialMedia.js
import mongoose, { Schema } from 'mongoose';

// Define the schema for individual social media links
const SocialMediaLinkSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    link: {
        type: String,
        default: ''
    },
    image: {  // New field for the image URL
        type: String,
        default: ''
    },
}, { _id: false }); // Disable auto-generated `_id` for each link

// Define the main schema for social media links
const SocialMediaSchema = new Schema({
    socialMediaLinks: {
        type: [SocialMediaLinkSchema],
        default: [],
    },
}, { timestamps: true });

// Create the model from the schema
const SocialMedia = mongoose.model('SocialMedia', SocialMediaSchema);

// Export the model for use in other parts of the application
export default SocialMedia;
