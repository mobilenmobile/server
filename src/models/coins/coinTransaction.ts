const mongoose = require('mongoose');
// userId,
//   orderId,
//   type: rewardType,
//     amountSpent: 0,
//       amountReceived: coinsTobeAdded,
//         notes: 'Coins added for purchase'

const cointransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order',
  },
  amountSpent: {
    type: Number,
    required: true
  },
  rewardType: {
    type: String,
  },
  amountReceived: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
});

export const CoinTransaction = mongoose.model('CoinTransaction', cointransactionSchema);

