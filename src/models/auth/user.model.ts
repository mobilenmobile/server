// console.log("user models")

import mongoose, { Schema } from "mongoose";
import validator from "validator";



// interface IUser extends Document {
//   name: string;
//   profile: typeof ProfileSchema;
//   email: string;
//   role: "admin" | "user";
//   createdAt: Date;
//   updatedAt: Date;
// }

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

export const User = mongoose.model("User", userSchema);

