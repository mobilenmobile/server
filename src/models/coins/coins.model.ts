const mongoose = require('mongoose');

const coinSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  image_url: {
    type: String,
    trim: true
  }
});

export const Coin = mongoose.model('Coin', coinSchema);
// module.exports = Coin;
