// console.log("user models")

import mongoose, { Schema } from "mongoose";
import validator from "validator";

interface IUser extends Document {
  name: string;
  photo: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

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
    // photo: {
    //     type: String,
    //     required: [true, "Please enter photo"]
    // },
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
