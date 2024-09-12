// console.log("user models")

import mongoose, { Schema } from "mongoose";
import validator from "validator";
import { OfferSchema } from "../offer/offer.model";
import { addressSchema } from "../address/address.model";




// Define the Address schema
const ProfileSchema = new Schema({
  profileImageUrl: { type: String, default: "/defaultprofileimage.png" },
  profileName: { type: String, default: "" },
  profileEmailId: { type: String, default: "" },
  profilePhoneNo: { type: String, default: "" },
  profileGender: { type: String, default: "" },
  profileLocation: { type: String, default: "" },
  profileAlternateMobileNo: { type: String, default: "" }
});
const DefaultProfileData = {
  profileImageUrl: "/defaultprofileimage.png",
  profileName: "",
  profileEmailId: "",
  profilePhoneNo: "",
  profileGender: "",
  profileLocation: "",
  profileAlternateMobileNo: ""
}

// interface IUser extends Document {
//   uid: string,
//   name: string,
//   email: string,
//   profile: typeof ProfileSchema,
//   coupon: typeof OfferSchema,
//   address: typeof addressSchema,
// }

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
    profile: { type: ProfileSchema, default: DefaultProfileData },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "offer",
      // 6686618cc97c745ba57d72d0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
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

export const User = mongoose.model("User", userSchema);

