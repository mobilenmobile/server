import mongoose, { Schema } from "mongoose";


const statuses = ["placed", "processed", "delivered", "cancelled"];

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
    enum: ['home', 'work'],
    required: true
  },
  default: { type: Boolean, default: false },
});

// Define the Courier Order Details schema with default values
const courierOrderDetailsSchema = new Schema({
  order_id: { type: Number, default: null },
  channel_order_id: { type: String, default: "" },
  shipment_id: { type: Number, default: null },
  status: { type: String, default: "" },
  awb_code: { type: String, default: "" },
  courier_company_id: { type: String, default: "" },
  courier_name: { type: String, default: "" },
});


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
  deliveryCharges: { type: Number, default: 0 },
  orderStatuses: {
    type: [Object],
  },
  orderStatusState: {
    type: String,
    enum: statuses,
    default: 'placed',
  },
  cancellationDetails: {
    type: Object, default: {
      isCancelled: false,
      cancellationReason: '',
      cancellationInitiatedBy: '', // or determine dynamically
      cancellationDate: '',
      cancellationSource: '',
    }
  },
  total: {
    type: Number,
    required: true
  },
  couponcode: {
    type: String,
    default: ''
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
  },
  discountedTotal: {
    type: Number
  },
  finalAmount: {
    type: Number
  },
  usableCoins: {
    type: Number,
    default: 0,
  },
  coinsCredited: {
    type: Number,
    default: 0
  },
  coinsDebited: {
    type: Number,
    default: 0
  },
  shippingId: {
    type: String,
    default: ""
  },
  courierOrderDetails: {
    type: courierOrderDetailsSchema,
    default: () => ({}) // Default to an empty object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
});

const Order = mongoose.models.order || mongoose.model("order", orderSchema);
export { Order };

