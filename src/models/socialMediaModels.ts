// models/SocialMedia.js
import mongoose, { Schema } from 'mongoose';

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
}, { _id: false }); // Disable auto-generated `_id` for each link

const SocialMediaSchema = new Schema({
    socialMediaLinks: {
        type: [SocialMediaLinkSchema],
        default: [],
    },
}, { timestamps: true });

const SocialMedia = mongoose.model('SocialMedia', SocialMediaSchema);

export default SocialMedia;
