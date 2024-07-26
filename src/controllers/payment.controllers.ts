import Razorpay from "razorpay";
import { asyncErrorHandler } from "../middleware/error.middleware";
import ErrorHandler from "../utils/errorHandler";


//------------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.orderPayment
// 2.getPaymentDetails

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------------



//--------------api to create order id for payment ----------------------------------------
export const orderPayment = asyncErrorHandler(async (req, res, next) => {

    const razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });


    console.log("req.body.amount", req.body.amount)

    var options = {
        amount: Number(req.body.amount) * 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    const razorpayOrderDetails = await razorpayInstance.orders.create(options);

    return res.status(200).json({
        success: true,
        message: "Order id created successfully",
        orderPaymentDetails: razorpayOrderDetails
    });

});

//--------------api to get payment details from payment id ------------------------------------------
export const getPaymentDetails = asyncErrorHandler(async (req, res, next) => {

    const razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { paymentId } = req.params
    if (!paymentId) {
        return next(new ErrorHandler("no payment id found", 400));
    }

    const razorpayPaymentDetails = await razorpayInstance.payments.fetch(paymentId);

    return res.status(200).json({
        success: true,
        message: "payment details fetched successfully",
        paymentDetails: razorpayPaymentDetails
    });

});



