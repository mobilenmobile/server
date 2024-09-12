import { Timestamp } from "firebase-admin/firestore";

const mongoose = require('mongoose');

const coinAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coinAccountBalance: {
    type: Number,
    required: true,
    default: 0
  },
  useCoinForPayment: {
    type: Boolean,
    required: true,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const CoinAccount = mongoose.model('CoinAccount', coinAccountSchema);

