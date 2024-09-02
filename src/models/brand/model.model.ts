import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
    modelName: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true }
});

export const Model = mongoose.model('Model', modelSchema);
