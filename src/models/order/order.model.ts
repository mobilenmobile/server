import mongoose, { Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "user",
    // },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },
    status: {
      type: String,
      enum: ["delivered", "pending", "canceled", "exchanged", "processing"],
    },
    amount: {
      type: Number,
      requried: [true, "amount is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.order || mongoose.model("order", OrderSchema);
export { Order };
