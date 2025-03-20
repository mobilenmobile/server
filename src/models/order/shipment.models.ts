import mongoose from 'mongoose';

const ShipmentSchema = new mongoose.Schema({
  name: String,
  add: String,
  pin: String,
  city: String,
  state: String,
  country: String,
  phone: String,
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  payment_mode: String,
  products_desc: String,
  cod_amount: String,
  order_date: Date,
  total_amount: String,
  seller_add: String,
  seller_name: String,
  seller_inv: String,
  quantity: String,
  waybill: String,
  shipment_width: String,
  shipment_height: String,
  weight: String,
  seller_gst_tin: String,
  shipping_mode: String,
  address_type: String,
  client: String,
  total_discount: String,
  mrp_total: String,
  net_total: String,
  delivery_charge: String,
  coupon_discount: String,
  tax_class: String,
  tax_breakup: String,
  invoice_number: String,
  invoice_date: Date,
}, { timestamps: true });

const PickupLocationSchema = new mongoose.Schema({
  name: String,
  add: String,
  city: String,
  pin_code: String,
  country: String,
  phone: String,
}, { _id: false });

const ShipmentDataSchema = new mongoose.Schema({
  shipments: [ShipmentSchema],
  pickup_location: PickupLocationSchema,
  waybill: String,
}, { timestamps: true });


ShipmentDataSchema.statics.saveShipment = async function (shipmentData) {
  try {
    const shipment = new this(shipmentData);
    await shipment.save();
    console.log("Shipment data saved successfully:", shipment);
    return shipment;
  } catch (error) {
    console.error("Error saving shipment data:", error);
    throw error;
  }
};

export default mongoose.model('ShipmentDataModel', ShipmentDataSchema);



const ShipmentDataModel = mongoose.models.ShipmentDataModel || mongoose.model("ShipmentDataModel", ShipmentDataSchema);
export { ShipmentDataModel };