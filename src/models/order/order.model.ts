import mongoose, { Schema } from "mongoose";

// Define the Address schema
// const ramAndStorageSchema = new Schema({
//   id: { type: String },
//   ram: { type: String },
//   storage: { type: String },
// })

// const varianceTypeSchema = new Schema({
//   id: { type: String, required: true },
//   color: { type: String, required: true },
//   ramAndStorage: { type: ramAndStorageSchema },
//   boxPrice: { type: String, required: true },
//   sellingPrice: { type: String, required: true },
//   quantity: { type: String, required: true },
//   thumbnail: { type: String, required: true },
//   productImages: { type: [String], required: true },
// })

// const orderItemSchema = new Schema({
//   id: { type: String, required: true },
//   productTitle: { type: String, required: true },
//   product: { type: String, required: true },
//   selectedVariance: { type: varianceTypeSchema, required: true },
// })

// Define the Address schema
const addressSchema = new Schema({
  fullName: { type: String, required: true },
  houseNo: { type: String, required: true },
  pinCode: { type: String, required: true },
  state: { type: String, required: true },
  mobileNo: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  place: {
    type: String,
    enum: ['home', 'office'],
    required: true
  },
  default: { type: Boolean, default: false },
});


// orderItems,
// orderStatuses,
// total,
// couponcode,
// paymentMethod,
// paymentStatus,
// deliveryAddress,
// discount,


const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: {
    type: [Object],
    required: true
  },
  deliveryAddress: { type: addressSchema, required: true },
  orderStatuses: {
    type: [Object],
  },
  total: {
    type: Number,
    required: true
  },
  couponcode: {
    type: String,
  },
  discount: {
    type: Number
  },
  paymentMethod: {
    type: Object,
  },
  paymentStatus: {
    type: Boolean,
    default: false
  }

});

const Order = mongoose.models.order || mongoose.model("order", orderSchema);
export { Order };

