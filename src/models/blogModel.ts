import mongoose, { Document, Schema } from 'mongoose';

interface IBlog extends Document {
    socialMediaUrl: string;
    thumbnailUrl: string;
    title: string;
    description: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    socialMediaType: 'facebook' | 'youtube' | 'instagram' | 'whatsapp' | "X";
}

const BlogSchema: Schema = new Schema({
    socialMediaUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    socialMediaType: {
        type: String,
        enum: ['facebook', 'youtube', 'instagram', 'whatsapp', "X"],
        required: true
    }
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema)
// const User = mongoose.models.users || mongoose.model("users", userSchema);

export default Blog;

// export default mongoose.model<IBlog>('Blog', BlogSchema);
