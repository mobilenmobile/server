import mongoose, { Schema, Document } from 'mongoose';

// Define interface for Shipment document
export interface IShipment extends Document {
  orderId: mongoose.Types.ObjectId;
  waybillNumber: string;
  courierCompany: string;
  status: string;
  trackingUrl?: string;
  shipmentDate: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shipmentDetails: {
    packageDimensions: {
      width: number;
      height: number;
      weight: number;
    };
    deliveryAddress: {
      fullName: string;
      address: string;
      pinCode: string;
      city: string;
      state: string;
      country: string;
      mobileNo: string;
      addressType: string;
    };
    codAmount: number;
    totalAmount: number;
    totalQuantity: number;
    productDescriptions: string;
  };
  apiResponse: object;
  createdAt: Date;
  updatedAt: Date;
}

// Create shipment schema
const ShipmentSchema: Schema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true // Add index for better query performance
  },
  waybillNumber: {
    type: String,
    required: true,
    unique: true
  },
  courierCompany: {
    type: String,
    required: true,
    default: 'Delhivery'
  },
  status: {
    type: String,
    required: true,
    enum: ['NEW', 'PICKUP_SCHEDULED', 'PICKUP_GENERATED', 'PICKUP_DONE', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RTO', 'FAILED'],
    default: 'NEW'
  },
  trackingUrl: {
    type: String
  },
  shipmentDate: {
    type: Date,
    default: Date.now
  },
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  shipmentDetails: {
    packageDimensions: {
      width: {
        type: Number,
        required: true
      },
      height: {
        type: Number,
        required: true
      },
      weight: {
        type: Number,
        required: true
      }
    },
    deliveryAddress: {
      fullName: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      pinCode: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      country: {
        type: String,
        default: 'India'
      },
      mobileNo: {
        type: String,
        required: true
      },
      addressType: {
        type: String,
        default: 'home'
      }
    },
    codAmount: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    totalQuantity: {
      type: Number,
      required: true
    },
    productDescriptions: {
      type: String,
      required: true
    }
  },
  apiResponse: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Add method to count shipments by order ID
ShipmentSchema.statics.countShipmentsByOrderId = async function(orderId: string): Promise<number> {
  return this.countDocuments({ orderId });
};

// Add method to find all shipments for an order
ShipmentSchema.statics.findShipmentsByOrderId = async function(orderId: string) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

// Create the model
const ShipmentModel = mongoose.model<IShipment>('Shipment', ShipmentSchema);

export default ShipmentModel;