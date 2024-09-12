import mongoose, { Schema } from "mongoose";
import { User } from "../auth/user.model";

// Define the Address schema
export const addressSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: User },
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Address = mongoose.models.address || mongoose.model("address", addressSchema);
export { Address };