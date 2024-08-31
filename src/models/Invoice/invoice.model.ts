const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, default: Date.now }, // Use default value
    customerName: { type: String, required: true },
    customerAddress: { type: String, required: true },
    items: [{
      name: String,
      description: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }],
    totalAmount: { type: Number, required: true }
  });

export const Invoice = mongoose.model('Invoice', InvoiceSchema);
