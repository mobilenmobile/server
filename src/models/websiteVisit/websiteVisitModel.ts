import mongoose, { Schema, Document } from "mongoose";

interface IVisit extends Document {
    userId?: string | null;
    visitTime: Date;
    timeFrame: string; // Automatically generated as "6-12", "12-18", etc.
    visitCount: number;
    createdAt: Date;
}

const VisitSchema = new Schema<IVisit>(
    {
        userId: { type: String, default: null },
        visitTime: { type: Date, default: Date.now },
        timeFrame: { type: String, required: true },
        visitCount: { type: Number, default: 1 },
        createdAt: { type: Date, default: Date.now }, // Add createdAt for filtering
    },
    { timestamps: true }
);

export const WebsiteVisit = mongoose.model<IVisit>("WebsiteVisit", VisitSchema);
