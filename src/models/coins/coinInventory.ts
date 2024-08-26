import mongoose from "mongoose";

const coinInventorySchema = new mongoose.Schema({
    coin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coin',
        required: true
    },
    quantity: {
        type: mongoose.Types.Decimal128,
        required: true
    }
});

export const CoinInventory = mongoose.model('CoinInventory', coinInventorySchema);

