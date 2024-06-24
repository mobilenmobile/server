// console.log("user models")

import mongoose, { Schema } from "mongoose";
import validator from "validator";

interface IUser extends Document {
  name: string;
  profile: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

// Define the Address schema
const ProfileSchema = new Schema({
  profileName: { type: String, required: true },
  profileEmailId: { type: String, required: true },
  profilePhoneNo: { type: String, required: true },
  profileGender: { type: String, required: true },
  profileLocation: { type: String, required: true },
  profileAlternateMobileNo: { type: String, required: true }
});


const userSchema = new Schema(
  {
    uid: {
      type: String,
      required: [true, "Please enter uid"],
    },
    name: {
      type: String,
      // required: [true, "Please enter name"]
    },
    email: {
      type: String,
      unique: [true, "Email already exists"],
      required: [true, "Please enter email"],
      validate: validator.default.isEmail,
    },
    profile: { type: ProfileSchema },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    reward: {
      type: Number,
    },
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    address: [
      {
        type: Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
  },

  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);

