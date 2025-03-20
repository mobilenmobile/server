import mongoose, { Schema } from 'mongoose';

const bannerSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },

    homeBanner: {
        mainImage: { imgUrl: { type: String }, redirectUrl: { type: String } },
        otherImages: [{ imgUrl: { type: String }, redirectUrl: { type: String } }],
    },
    skinBanner: {
        mainImage: { imgUrl: { type: String }, redirectUrl: { type: String } },
        otherImages: [{ imgUrl: { type: String }, redirectUrl: { type: String } }],
    },
    accessoriesBanner: {
        mainImage: { imgUrl: { type: String }, redirectUrl: { type: String } },
        otherImages: [{ imgUrl: { type: String }, redirectUrl: { type: String } }],
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

export default Banner;
