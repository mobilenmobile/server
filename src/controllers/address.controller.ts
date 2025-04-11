import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Address } from "../models/address/address.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";

//----------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.newAddress
// 2.updateAddress
// 3.allAddress
// 4.deleteAddress

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------

// ----------- api to create new address ------------------------------------
export const newAddress = asyncErrorHandler(
    async (req: Request, res, next) => {
        // console.log(req.body)
        const {
            fullName,
            mobileNo,
            houseNo,
            pinCode,
            area,
            city,
            state,
            place,
        } = req.body;

        // console.log(req.body)

        if (!pinCode || !state || !city) {
            return next(new ErrorHandler("Please Enter all Fields", 400));
        }
        if (!req.user._id) {
            return next(new ErrorHandler("unauthenticated", 400));
        }

        const newAddress = await Address.create({
            user: req.user._id,
            fullName,
            houseNo,
            pinCode,
            state,
            mobileNo,
            area,
            city,
            place,
        });
        return res.status(201).json({
            success: true,
            message: "New Address created successfully",
            newAddress,
        });
        
    }
);

//------------ api to update the existing address -------------------------------
export const updateAddress = asyncErrorHandler(
    async (req: Request, res, next) => {
        const id = (req.params as { id: string }).id;

        const {
            fullName,
            mobileNo,
            houseNo,
            pinCode,
            city,
            area,
            state,
            place,

        } = req.body;

        // console.log("req-body-", req.body);

        const address = await Address.findById(id);

        if (!address) {
            return next(new ErrorHandler("Address not found  ", 404));
        }
        if (req.user._id != address.user) {
            return next(new ErrorHandler("You are not authorized to update this address", 401));
        }

        if (fullName) address.fullName = fullName
        if (mobileNo) address.mobileNo = mobileNo
        if (houseNo) address.houseNo = houseNo
        if (pinCode) address.pinCode = pinCode
        if (area) address.area = area
        if (city) address.city = city
        if (state) address.state = state
        if (place) address.place = place

        const updatedAddress = await address.save();

        return res.status(201).json({
            success: true,
            message: "Product Updated Successfully",
            updatedAddress,
        });
    }
);

//--------------fetch all address of the user-------------------------------------
export const allAddress = asyncErrorHandler(async (req, res, next) => {
    const allAddress = await Address.find({ user: req.user._id })
    if (!req.user._id) {
        return next(new ErrorHandler("unauthenticated", 400));
    }
    return res.status(200).json({
        success: true,
        message: "all address fetched successfully",
        allAddress,
    });
});

//------------------delete address of the user-------------------------------------
export const deleteAddress = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const address = await Address.findById(id);
    if (!address) {
        return next(new ErrorHandler("address not found", 404));
    }
    if (req.user._id != address.user) {
        return next(new ErrorHandler("You are not authorized to delete this address", 401));
    }
    await address.deleteOne();
    return res.status(200).json({
        success: true,
        message: "Address Deleted Successfully",
    });
});