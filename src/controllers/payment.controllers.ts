import Razorpay from "razorpay";
import { asyncErrorHandler } from "../middleware/error.middleware";

//api to process order payment
export const orderPayment = asyncErrorHandler(async (req, res, next) => {

    const razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    var options = {
        amount: 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    const razorpayOrderDetails = await razorpayInstance.orders.create(options);

    return res.status(200).json({
        success: true,
        message: "Order payment done Successfully",
        orderPaymentDetails: razorpayOrderDetails
    });

});
//api to process order payment
export const getPaymentDetails = asyncErrorHandler(async (req, res, next) => {

    const razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { paymentId } = req.params
    
    const razorpayPaymentDetails = await razorpayInstance.payments.fetch(paymentId);

    return res.status(200).json({
        success: true,
        message: "Order payment done Successfully",
        paymentDetails: razorpayPaymentDetails
    });

});



