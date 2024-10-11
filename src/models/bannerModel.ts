import mongoose, { Schema } from 'mongoose';
// import { Store } from './Store';

const bannerSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },

    homeBanner: {
        mainImage: {
            type: String
        },
        otherImages: [{ type: String }]

    },
    skinBanner: {
        mainImage: {
            type: String
        },
        otherImages: [{ type: String }]

    },
    accessoriesBanner: {
        mainImage: {
            type: String
        },
        otherImages: [{ type: String }]

    },


    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema)
// const User = mongoose.models.users || mongoose.model("users", userSchema);

export default Banner;