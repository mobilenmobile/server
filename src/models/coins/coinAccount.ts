const mongoose = require('mongoose');

const coinAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coinAccountBalance: {
    type:Number,
    required: true,
    default: 0
  },
  useCoinForPayment:{
    type:Boolean,
    required:true,
    default:false
  }
});

export const CoinAccount = mongoose.model('CoinAccount', coinAccountSchema);

