import axios from "axios";
import { asyncErrorHandler } from "../middleware/error.middleware";
import ErrorHandler from "../utils/errorHandler";
import { Order } from "../models/order/order.model";
import ShipmentModel from "../models/order/shipment.models";
import mongoose from "mongoose";

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY;
const BASE_URL = process.env.DELHIVERY_BASE_URL;


// step 2 
// export const createShipment = asyncErrorHandler(async (req, res, next) => {
//     const { orderId } = req.body;
//     console.log("token is :------------------------------------>", DELHIVERY_API_KEY);

//     // Fetch order from DB
//     const orderData = await Order.findById(orderId);
//     if (!orderData) {
//         return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     // Compute total weight (default 500g per item if missing)
//     const totalWeight = orderData.orderItems.reduce((sum: number, item: any) => sum + (item.boxPrice || 500), 0);

//     // Payment Mode
//     const paymentMode = orderData.paymentMethod.paymentMode.toLowerCase() === "cod" ? "COD" : "Prepaid";

//     // COD Amount
//     const codAmount = paymentMode === "COD" ? orderData.finalAmount : 0;

//     // Single Waybill Handling (For Multi-Item Single Shipment)
//     const waybillResponse = await axios.get(
//         "https://track.delhivery.com/waybill/api/bulk/json/?count=1",
//         { headers: { Authorization: `Token ${DELHIVERY_API_KEY}` } }
//     );

//     console.log("waybill res----------->", waybillResponse.data);
//     if (!waybillResponse.data.length) {
//         return res.status(500).json({ success: false, message: "Failed to generate waybill" });
//     }

//     const waybillNumber = waybillResponse.data; // Use single waybill
//     const totalAmount = orderData.finalAmount;

//     // IMPORTANT: The warehouse name must EXACTLY match what's registered in Delhivery's system
//     // You might need to store this in your environment variables or configuration
//     const REGISTERED_WAREHOUSE_NAME = "mobilenmobile.in"; // Update this to match exact registered name

//     // Construct Shipment Data
//     const shipmentData = {
//         shipments: [
//             {
//                 name: orderData.deliveryAddress.fullName,
//                 add: `${orderData.deliveryAddress.houseNo}, ${orderData.deliveryAddress.area}`,
//                 pin: orderData.deliveryAddress.pinCode,
//                 city: orderData.deliveryAddress.city,
//                 state: orderData.deliveryAddress.state,
//                 country: "India",
//                 phone: orderData.deliveryAddress.mobileNo,
//                 order: orderData._id.toString(),
//                 payment_mode: paymentMode,
//                 return_pin: "",
//                 return_city: "",
//                 return_phone: "",
//                 return_add: "",
//                 return_state: "",
//                 return_country: "",
//                 products_desc: "Multiple Items",
//                 hsn_code: "85171290", // Added a sample HSN code - update with actual code
//                 cod_amount: codAmount.toString(),
//                 order_date: new Date().toISOString(),
//                 total_amount: totalAmount.toString(),
//                 seller_add: "Shop No.1, Gaurav Tower, Station Road, Bijainagar",
//                 seller_name: REGISTERED_WAREHOUSE_NAME,
//                 seller_inv: "INV-" + orderData._id,
//                 quantity: orderData.orderItems.length.toString(),
//                 waybill: waybillNumber,
//                 shipment_width: "121",
//                 shipment_height: "121",
//                 weight: orderData.weight ? orderData.weight.toString() : "500",
//                 seller_gst_tin: "09AAACZ2717B1ZW", // Added a sample GST number - update with actual number
//                 shipping_mode: "Surface",
//                 address_type: "home",
//             },
//         ],
//         pickup_location: {
//             name: REGISTERED_WAREHOUSE_NAME, // This must match EXACTLY what's registered with Delhivery
//             add: "Shop No.1, Gaurav Tower, Station Road, Bijainagar",
//             city: "Ajmer",
//             pin_code: 305001,
//             country: "India",
//             phone: "8890095095",
//         },
//     };

//     try {
//         // Use the correct URL from the docs
//         const apiUrl = "https://track.delhivery.com/api/cmu/create.json"; // Production URL
//         // const apiUrl = "https://staging-express.delhivery.com/api/cmu/create.json"; // Staging URL

//         // IMPORTANT: The format and data must be sent as form data, not JSON
//         const formData = new URLSearchParams();
//         formData.append('format', 'json');
//         formData.append('data', JSON.stringify(shipmentData));

//         console.log("Sending request to:", apiUrl);
//         console.log("Request body:", formData.toString());

//         const response = await axios({
//             method: 'post',
//             url: apiUrl,
//             headers: {
//                 "Authorization": `Token ${DELHIVERY_API_KEY}`,
//                 "Content-Type": "application/x-www-form-urlencoded", // This is crucial
//                 "Accept": "application/json"
//             },
//             data: formData
//         });

//         console.log("Delhivery Response:", response.data);

//         return res.status(200).json({
//             success: true,
//             job_id: response.data.job_id,
//             data: response.data,
//             waybill: waybillNumber
//         });
//     } catch (error) {
//         console.error("Error creating shipment:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to create shipment",
//             error: `${error}`
//         });
//     }
// });

export const createShipment = asyncErrorHandler(async (req, res, next) => {
    const {
        orderId,
        fullName,
        address,
        pinCode,
        city,
        state,
        country,
        mobileNo,
        paymentMode,
        productDescriptions,
        codAmount,
        orderDate,
        totalAmount,
        totalQuantity,
        shipmentWidth,
        shipmentHeight,
        weight,
        addressType = 'home',
        totalDiscount,
        mrpTotal,
        netTotal,
        deliveryCharge = 0,
        couponDiscount
    } = req.body;

    // Validate required fields
    const requiredFields = [
        'orderId', 'fullName', 'address', 'pinCode', 'city', 'state',
        'mobileNo', 'paymentMode', 'productDescriptions', 'codAmount', 'orderDate',
        'totalAmount', 'totalQuantity', 'shipmentWidth', 'shipmentHeight', 'weight',
        'addressType', 'mrpTotal', 'netTotal', 'deliveryCharge'
    ];

    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                message: `Required field is empty: ${field}`
            });
        }
    }

    console.log("token is :------------------------------------>", DELHIVERY_API_KEY);

    // Fetch order from DB for validation
    const orderData = await Order.findById(orderId);
    if (!orderData) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Find the order
    const order = await Order.findById(orderId);


    // Check if order is already cancelled
    if (order.orderStatusState === 'cancelled' || order.orderStatusState === 'delivered' || order.orderStatusState === 'processed') {
        return res.status(400).json({
            success: false,
            message: 'Order is already processed/delivered/cancelled'
        });
    }

    // Single Waybill Handling (For Multi-Item Single Shipment)
    const waybillResponse = await axios.get(
        "https://track.delhivery.com/waybill/api/bulk/json/?count=1",
        { headers: { Authorization: `Token ${DELHIVERY_API_KEY}` } }
    );

    console.log("waybill res----------->", waybillResponse.data);
    if (!waybillResponse.data.length) {
        return res.status(500).json({ success: false, message: "Failed to generate waybill" });
    }

    const waybillNumber = waybillResponse.data; // Use single waybill

    // IMPORTANT: The warehouse name must EXACTLY match what's registered in Delhivery's system
    const REGISTERED_WAREHOUSE_NAME = "mobilenmobile.in"; // Update this to match exact registered name
    const WAREHOUSE_CLIENT_CODE = "ff052d-MOBILENMOBILE-do"; // Update with your client code from Delhivery

    // Construct Shipment Data
    const shipmentData = {
        shipments: [
            {
                name: fullName,
                add: `${address}`,
                pin: pinCode,
                city: city,
                state: state,
                country: country || "India",
                phone: mobileNo,
                order: orderId,
                payment_mode: paymentMode,
                products_desc: productDescriptions,
                cod_amount: codAmount,
                order_date: orderDate,
                total_amount: totalAmount,
                seller_add: "Shop No.1, Gaurav Tower, Station Road, Bijainagar",
                seller_name: REGISTERED_WAREHOUSE_NAME,
                seller_inv: "INV-" + orderId,
                quantity: totalQuantity,
                waybill: waybillNumber,
                shipment_width: shipmentWidth,
                shipment_height: shipmentHeight,
                weight: weight,
                seller_gst_tin: "08XXXXXXXXXXXX", // Replace with your actual GST number
                shipping_mode: "Surface",
                address_type: addressType,
                client: WAREHOUSE_CLIENT_CODE,

                // Add explicit total price breakdown
                total_discount: totalDiscount,
                mrp_total: mrpTotal,
                net_total: netTotal,
                delivery_charge: deliveryCharge,
                coupon_discount: couponDiscount,

                // If you use Delhivery's tax calculation
                tax_class: "default",
                tax_breakup: "igst:0",

                // Invoice details
                invoice_number: `INV-${orderId}`,
                invoice_date: new Date().toISOString().split('T')[0]
            },
        ],
        pickup_location: {
            name: REGISTERED_WAREHOUSE_NAME,
            add: "Shop No.1, Gaurav Tower, Station Road, Bijainagar",
            city: "Ajmer",
            pin_code: 305001,
            country: "India",
            phone: "8890095095",
        },
    };

    try {
        // Use the correct URL from the docs
        const apiUrl = "https://track.delhivery.com/api/cmu/create.json"; // Production URL

        // IMPORTANT: The format and data must be sent as form data, not JSON
        const formData = new URLSearchParams();
        formData.append('format', 'json');
        formData.append('data', JSON.stringify(shipmentData));

        console.log("Sending request to:", apiUrl);
        console.log("Request body:", formData.toString());

        const response = await axios({
            method: 'post',
            url: apiUrl,
            headers: {
                "Authorization": `Token ${DELHIVERY_API_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded", // This is crucial
                "Accept": "application/json"
            },
            data: formData
        });

        console.log("Delhivery Response:", response.data);

        // Save the shipment details to our database
        const newShipment = new ShipmentModel({
            orderId,
            waybillNumber,
            courierCompany: 'Delhivery',
            status: 'NEW',
            shipmentDetails: {
                packageDimensions: {
                    width: shipmentWidth,
                    height: shipmentHeight,
                    weight: weight
                },
                deliveryAddress: {
                    fullName,
                    address,
                    pinCode,
                    city,
                    state,
                    country: country || 'India',
                    mobileNo,
                    addressType
                },
                codAmount,
                totalAmount,
                totalQuantity,
                productDescriptions
            },
            apiResponse: response.data
        });

        await newShipment.save();
        console.log(`Shipment ${waybillNumber} created and saved to database`);

        // Update order with shipping info
        await Order.findByIdAndUpdate(orderId, {
            shippingId: waybillNumber,
            courierOrderDetails: {
                order_id: response.data.job_id || "",
                channel_order_id: orderId,
                shipment_id: response.data.data?.packages?.[0]?.waybill || waybillNumber,
                status: "NEW",
                awb_code: waybillNumber,
                courier_company_id: "delhivery",
                courier_name: "Delhivery"
            }
        });

        // if (response.data && response.data.success) {
        //     // Save shipment data to database
        //     const savedShipment = await ShipmentDataModel.saveShipment(shipmentData);
        //     console.log("Shipment data saved to DB:", savedShipment);

        // }

        if (response.data.success) {
            order.orderStatusState = 'processed';

            // Push the new status to the order's status list
            order.orderStatuses.push({
                date: new Date(),
                status: 'processed'
            });
            await order.save()
        }

        return res.status(200).json({
            success: response.data.success,
            // data: response.data.data || response.data,
            data: response.data,
            waybill: waybillNumber
        });
    } catch (error) {
        console.error("Error creating shipment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create shipment",
            error: `${error}`
        });
    }

});

//generate label
export const generatePackingLabel = asyncErrorHandler(async (req, res, next) => {
    const { waybillNumber } = req.params;

    if (!waybillNumber) {
        return res.status(400).json({ success: false, message: "Waybill number is required" });
    }

    try {
        const response = await axios.get(
            `https://track.delhivery.com/api/p/packing_slip?wbns=${waybillNumber}&pdf=false`,
            {
                headers: {
                    "Authorization": `Token ${DELHIVERY_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Delhivery Packing Slip Response:", response.data);
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error generating packing slip:", error);
        return res.status(500).json({ success: false, message: "Failed to generate packing slip" });
    }
});

//generate pickup
export const generatePickup = asyncErrorHandler(async (req, res, next) => {
    try {
        const { pickup_location, expected_package_count, pickup_date, pickup_time } = req.body;

        if (!pickup_location || !expected_package_count || !pickup_date || !pickup_time) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const response = await axios.post(
            'https://track.delhivery.com/fm/request/new/',
            {
                pickup_location,
                expected_package_count,
                pickup_date,
                pickup_time,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Token ${process.env.DELHIVERY_API_KEY}`,
                },
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error creating pickup request:', error);
        res.status(500).json({
            message: 'Failed to create pickup request',
            error: "failed to create pickupo request"
        });
    }
});


export const cancelShipment = asyncErrorHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            orderId,
            cancellationReason = 'User requested cancellation',
            cancellationSource = 'user_request'
        } = req.body;

        // Validate orderId is provided
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required for cancellation'
            });
        }

        // Find the order
        const order = await Order.findById(orderId);

        // Check if order exists
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order is already cancelled
        if (order.orderStatusState === 'cancelled' || order.cancellationDetails.isCancelled) {
            return res.status(400).json({
                success: true,
                message: 'Order is already cancelled'
            });
        }

        // Check if order is in a state that can be cancelled
        const cancelableStates = ['placed', 'processing', 'pending'];
        if (!cancelableStates.includes(order.orderStatusState)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        // Attempt to cancel shipment with Delhivery
        const response = await axios.post(
            'https://track.delhivery.com/api/p/edit',
            {
                waybill: order.shippingId,
                cancellation: 'True'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Token ${process.env.DELHIVERY_API_KEY}`,
                },
            }
        );

        // Update order details
        order.orderStatuses.push({
            status: 'cancelled',
            date: new Date()
        });
        order.orderStatusState = 'cancelled';

        // Update cancellation-specific fields
        order.cancellationDetails = {
            isCancelled: true,
            cancellationReason: cancellationReason,
            cancellationInitiatedBy: 'user', // or determine dynamically
            cancellationDate: new Date(),
            cancellationSource: cancellationSource,
        };


        // Save the updated order
        await order.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order: order
        });

    } catch (error) {
        console.error('Error cancelling shipment:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to cancel shipment',
            error: 'some err occured '
        });
    }
});


export const trackPackage = asyncErrorHandler(async (req, res, next) => {
    try {
        // Get waybill from query parameters
        const { shippingId } = req.params;
        const waybill = shippingId

        // Validate waybill is provided
        if (!waybill) {
            return res.status(400).json({
                success: false,
                message: 'Waybill number is required for tracking'
            });
        }

        // Construct the URL with query parameters
        let trackingUrl = `${process.env.DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${waybill}`;


        // Make request to Delhivery API
        const response = await axios.get(
            trackingUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Token ${process.env.DELHIVERY_API_KEY}`,
                },
            }
        );

        // Check if the response contains package data
        if (!response.data || response.data.Error) {
            return res.status(404).json({
                success: false,
                message: 'Package information not found',
                error: response.data?.Error || 'No data returned from tracking service'
            });
        }

        // Return tracking information
        res.status(200).json({
            success: true,
            message: 'Package information retrieved successfully',
            trackingData: response.data
        });

    } catch (error) {
        console.error('Error tracking package:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process tracking request',
            error: 'Internal server error'
        });
    }
});


// --------------------------------- Archived controllers-----------------------------------------------------------

// export const cancelShipment = asyncErrorHandler(async (req, res, next) => {
//     try {
//         const { orderId, shipmentId } = req.body;

//         const waybill = shipmentId

//         // Validate waybill is provided
//         if (!waybill || !orderId) {
//             return res.status(400).json({
//                 message: 'orderid and shipmentid is required'
//             });
//         }


//         // Find the order
//         const order = await Order.findById(orderId);

//         // Check if order exists
//         if (!order) {
//             return res.status(404).json({
//                 message: 'Order not found'
//             });
//         }

//         // Check if order is already cancelled
//         if (order.orderStatusState === 'cancelled') {
//             return res.status(400).json({
//                 message: 'Order is already cancelled'
//             });
//         }

//         // Check if order is in a state that can be cancelled
//         const cancelableStates = ['placed', 'processed'];
//         if (!cancelableStates.includes(order.orderStatusState)) {
//             return res.status(400).json({
//                 message: 'Order cannot be cancelled at this stage'
//             });
//         }
//         // Make API call to Delhivery to cancel shipment
//         const response = await axios.post(
//             'https://track.delhivery.com/api/p/edit',
//             {
//                 waybill: waybill,
//                 cancellation: 'True'
//             },
//             {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json',
//                     'Authorization': `Token ${process.env.DELHIVERY_API_KEY}`,
//                 },
//             }
//         );

//         // Check the response and send appropriate status
//         if (response.data.status) {
//             res.status(200).json({
//                 message: 'Shipment cancelled successfully',
//                 data: response.data
//             });
//         } else {
//             res.status(400).json({
//                 message: 'Failed to cancel shipment',
//                 error: response.data
//             });
//         }
//     } catch (error) {
//         console.error('Error cancelling shipment:', error);
//         res.status(400).json({
//             message: 'Failed to cancel shipment',
//             error: 'some err occured '
//         });
//     }
// });


