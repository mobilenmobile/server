import { asyncErrorHandler } from "../middleware/error.middleware";
import axios from 'axios';
import cron from 'node-cron';
import { ShipRocket } from "../models/shiprocket/shiprocket.model";
import { Order } from "../models/order/order.model";
import { credential } from "firebase-admin";

// Store user credentials
// export const SaveShiprocketCredentials = asyncErrorHandler(async (req, res, next) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).send('User ID and password are required');
//     }



//     try {
//         const token = await fetchToken(email, password);
//         const newUser = new ShipRocket({
//             email,
//             password, // Password will be hashed before saving
//             token,
//             tokenUpdatedAt: new Date()
//         });
//         await newUser.save();
//         res.status(201).send('User credentials stored');
//     } catch (error) {
//         res.status(500).json({ success: false, error: error })
//     }

// });
export const SaveShiprocketCredentials = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        const token = await fetchToken(email, password);

        // Check if the user already exists
        let user = await ShipRocket.findOne({ email });

        if (user) {
            // User exists, update their record
            user.password = password; // Password should be hashed before saving
            user.token = token;
            user.tokenUpdatedAt = new Date();
        } else {
            // User does not exist, create a new record
            user = new ShipRocket({
                email,
                password, // Password should be hashed before saving
                token,
                tokenUpdatedAt: new Date()
            });
        }

        await user.save();
        res.status(200).json({ success: true, message: "user data updated successfully" })
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export const GetShiprocketCredentials = asyncErrorHandler(async (req, res, next) => {
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }
    return res.status(200).json({ credential: {} })
});

//shiprocket show Available delivery partners
export const shipRocketAvailableDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPincode, productWeight, orderId } = req.body
    console.log("pincode servicable --------->")
    console.log(req.body)

    // const params = {
    //     "pickup_postcode": "305624",
    //     "delivery_postcode": deliveryPincode,
    //     "weight": productWeight,
    //     "cod": 0
    // }
    let params
    if (orderId) {
        params = {
            "order_id": orderId
        }
    } else {
        params = {
            "pickup_postcode": "305624",
            "delivery_postcode": deliveryPincode,
            "weight": productWeight,
            "cod": 0
        }
    }
    console.log("params === >", params)
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        },
        params: params  // Include query parameters here
    };

    const availabilityurl = "https://apiv2.shiprocket.in/v1/external/courier/serviceability"

    try {
        // Make the GET request
        const response = await axios.get(availabilityurl, config)
        // console.log('Response data:', response.data.data);

        const mainData = response.data.data
        console.log("maindata------------->", response, mainData)
        const courier = mainData?.available_courier_companies?.find((c: any) => {
            console.log("every company ---> ", c?.courier_company_id, mainData?.recommended_by.id)
            return c.courier_company_id === mainData?.recommended_by.id
        });

        console.log("courier-------->", courier)

        return res.status(200).json({ success: true, message: "all courier partner fetched successfully", recommended: mainData?.recommended_by, recommendedCourier: courier, data: mainData?.available_courier_companies, recommended_courier_company_id: mainData?.recommended_courier_company_id })

    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response data:', error.response.data.message || error.response.data || 'No error message');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        return res.status(500).json({ message: "Error in creating order" })
    }

});

export function createOrderBody(orderData: any) {
    // To format the date as "Mon Sep 09 2024 12:46:58"
    const formatDate = (date: Date) => date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    // Conversion function
    const convertItems = (items: any) => {
        return items.map((item: any) => ({
            name: item.productTitle,
            sku: item.selectedVarianceId,
            units: item.quantity.toString(),
            selling_price: item.sellingPrice,
            discount: item.discount.toString(),
            tax: "",  // Assuming no tax information is provided
            hsn: ""   // Assuming no HSN information is provided
        }));
    };


    const orderItems = convertItems(orderData.orderItems)

    const orderBodyData = {
        "order_id": `${orderData._id}`,
        "order_date": formatDate(orderData.createdAt),
        "pickup_location": "primary",
        "channel_id": "3141019",
        "comment": "MnM order",
        "billing_customer_name": orderData.deliveryAddress.fullName,
        "billing_last_name": "",
        "billing_address": orderData.deliveryAddress.place,
        "billing_address_2": "",
        "billing_city": orderData.deliveryAddress.city,
        "billing_pincode": orderData.deliveryAddress.pinCode,
        "billing_state": orderData.deliveryAddress.state,
        "billing_country": "india",
        "billing_email": orderData.user.email,
        "billing_phone": orderData.deliveryAddress.mobileNo,
        "shipping_is_billing": 1,
        "shipping_customer_name": "",
        "shipping_last_name": "",
        "shipping_address": "",
        "shipping_address_2": "",
        "shipping_city": "",
        "shipping_pincode": "",
        "shipping_country": "",
        "shipping_state": "",
        "shipping_email": "",
        "shipping_phone": "",
        "order_items": orderItems,
        "payment_method": orderData.paymentMethod.paymentMode === "cod" ? "COD" : "Prepaid",
        // "payment_method": "COD",
        "shipping_charges": "",
        "giftwrap_charges": "",
        "transaction_charges": "",
        "total_discount": "",
        "sub_total": `${orderData.finalAmount}`,
        "length": "34",
        "breadth": "30",
        "height": "1",
        "weight": "0.20"
    }

    return orderBodyData

}
// -----------------!!!!!!!!!!!!!!!!!!!!!! Step 1 of shiprocket !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!--------------------------------------
//shiprocket create order
export const shipRocketCreateOrder = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.body
    const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        }
    };
    const createOrderUrl = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc"
    const creatorderbodydata = createOrderBody(UserOrder)
    console.log("createorderbodydata------------>", creatorderbodydata)
    try {
        const response = await axios.post(createOrderUrl, creatorderbodydata, config)
        return res.status(201).send({ success: true, message: 'shipRocket Order Created', data: response.data });

    } catch (error: any) {
        console.log("error occured in creating shiprocket order------------>", error)
    }
});

//generate awb

//schedule pickup

//generate manifest

//print manifest

//generate label

//generate invoice
// -----------------!!!!!!!!!!!!!!!!!!!!!! Step 1 of shiprocket !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!--------------------------------------
//shiprocket create order
export const shipRocketGenerateAwb = asyncErrorHandler(async (req, res, next) => {
    const { shipmentId, courierId } = req.body
    if (!shipmentId || !courierId) {
        return res.status(400).send({ message: 'shipmentId and courierId are required' })
    }
    // const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        }
    };

    const createAwbUrl = "https://apiv2.shiprocket.in/v1/external/courier/assign/awb"
    // const creatorderbodydata = createOrderBody(UserOrder)
    // Make the Order POST request
    // Make the Order POST request
    const generateAwbBodyData = {
        "shipment_id": shipmentId,
        "courier_id": courierId,
    }
    console.log("awbdata------------>", generateAwbBodyData)
    try {
        const response = await axios.post(createAwbUrl, generateAwbBodyData, config)
        console.log('Response data for create order:', response.data);
        return res.status(500).json({ message: "successfully generated awb", data: response.data })
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        return res.status(500).json({ message: "Error in creating order" })
    }

});
export const shipRocketGenerateManifest = asyncErrorHandler(async (req, res, next) => {
    const { shipmentId, courierId } = req.body
    if (!shipmentId) {
        return res.status(400).send({ message: 'shipmentId and courierId are required' })
    }
    // const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        }
    };

    const createAwbUrl = "https://apiv2.shiprocket.in/v1/external/manifests/generate"
    // const creatorderbodydata = createOrderBody(UserOrder)
    // Make the Order POST request
    // Make the Order POST request
    const generateAwbBodyData = {
        "shipment_id": [
            shipmentId
        ]
    }
    console.log("awbdata------------>", generateAwbBodyData)
    try {
        const response = await axios.post(createAwbUrl, generateAwbBodyData, config)
        console.log('Response data for create order:', response.data);
        return res.status(500).json({ message: "successfully generated manifest", data: response.data })
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        return res.status(500).json({ message: "Error in creating order" })
    }

});
export const shipRocketPrintManifest = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.body
    if (!orderId) {
        return res.status(400).send({ message: 'shipmentId and courierId are required' })
    }
    // const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        }
    };

    const createAwbUrl = "https://apiv2.shiprocket.in/v1/external/manifests/print"
    // const creatorderbodydata = createOrderBody(UserOrder)
    // Make the Order POST request
    // Make the Order POST request
    const generateAwbBodyData = {
        "order_ids": [
            orderId
        ]
    }
    console.log("awbdata------------>", generateAwbBodyData)
    try {
        const response = await axios.post(createAwbUrl, generateAwbBodyData, config)
        console.log('Response data for create order:', response.data);
        return res.status(500).json({ message: "successfully generated awb", data: response.data })
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        return res.status(500).json({ message: "Error in creating order" })
    }

});
export const shipRocketGenerateLabel = asyncErrorHandler(async (req, res, next) => {
    const { shipmentId, courierId } = req.body
    if (!shipmentId) {
        return res.status(400).send({ message: 'shipmentId and courierId are required' })
    }
    // const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        }
    };

    const createAwbUrl = "https://apiv2.shiprocket.in/v1/external/courier/generate/label"
    // const creatorderbodydata = createOrderBody(UserOrder)
    // Make the Order POST request
    // Make the Order POST request
    const generateAwbBodyData = {
        "shipment_id": [
            shipmentId
        ]
    }
    console.log("awbdata------------>", generateAwbBodyData)
    try {
        const response = await axios.post(createAwbUrl, generateAwbBodyData, config)
        console.log('Response data for create order:', response.data);
        return res.status(500).json({ message: "successfully generated awb", data: response.data })
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        return res.status(500).json({ message: "Error in creating order" })
    }

});
export const shipRocketGenerateInvoice = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.body
    if (!orderId) {
        return res.status(400).send({ message: 'shipmentId and courierId are required' })
    }
    // const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        }
    };

    const createAwbUrl = "https://apiv2.shiprocket.in/v1/external/orders/print/invoice"
    // const creatorderbodydata = createOrderBody(UserOrder)
    // Make the Order POST request
    // Make the Order POST request
    const generateAwbBodyData = {
        "ids": [
            orderId
        ]
    }
    console.log("awbdata------------>", generateAwbBodyData)
    try {
        const response = await axios.post(createAwbUrl, generateAwbBodyData, config)
        console.log('Response data for create order:', response.data);
        return res.status(500).json({ message: "successfully generated awb", data: response.data })
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        return res.status(500).json({ message: "Error in creating order" })
    }

});


// -----------------------!!!!!!!!!!!!! cancell shipment !!!!!!!!!!!--------------------------
export const cancellShipment = asyncErrorHandler(async (req, res, next) => {
    //create order 
    //https://apiv2.shiprocket.in/v1/external/orders/cancel/shipment/awbs
    // {
    //     "awbs": [
    //   19041633365341
    //     ]
    //   }

    const { Awb } = req.body
    if (!Awb) {
        return res.status(400).send({ message: 'Awb are required' })
    }
    const cancellShipmetUrl = "https://apiv2.shiprocket.in/v1/external/orders/cancel/shipment/awbs"

    // const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
    const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
    if (!ShipRocketCredentials) {
        return res.status(404).json({ message: "ShipRocket credentials not found" })
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ShipRocketCredentials.token}`
        }
    };

    const cancellShipmetBodyData = {

        "awbs": [
            Awb
        ]

    }
    console.log("awbdata------------>", cancellShipmetBodyData)
    try {
        const response = await axios.post(cancellShipmetUrl, cancellShipmetBodyData, config)
        console.log('Response data for cancell shipment:', response.data);
        return res.status(500).json({ message: "successfully cancelled awb", data: response.data })
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        return res.status(500).json({ message: "Error in creating order" })
    }


    res.status(201).send('Shipment cancelled successfully');
});

export const cancellOrder = asyncErrorHandler(async (req, res, next) => {
    //create order 
    // https://apiv2.shiprocket.in/v1/external/orders/cancel
    // {
    // {
    //     "ids": [
    //   634614506
    //     ]
    //   }
    res.status(201).send('Order Cancelled successfully');
});






// Fetch new token from API
const fetchToken = async (email: string, password: string) => {
    try {
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', { email, password });
        console.log(response)
        return response.data.token;
    } catch (error) {
        throw new Error('Error fetching token');
    }
};

// // Update tokens every 3 days
// const updateTokens = async () => {
//     try {
//         const users = await User.find();
//         for (const user of users) {
//             const newToken = await fetchToken(user.userId, user.password);
//             user.token = newToken;
//             user.tokenUpdatedAt = new Date();
//             await user.save();
//         }
//         console.log('Tokens updated successfully');
//     } catch (error) {
//         console.error('Error updating tokens:', error);
//     }
// };

// Schedule the token update job to run every 3 days
// cron.schedule('0 0 */3 * *', () => {
//     updateTokens();
// });
