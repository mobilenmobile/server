import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Order } from "../models/order/order.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";
import { Review } from "../models/review/review.model.js";
import { IncreaseCoins } from "./coin.controller.js";
import { CoinAccount } from "../models/coins/coinAccount.js";
import { CoinTransaction } from "../models/coins/coinTransaction.js";
import mongoose, { PipelineStage, startSession } from "mongoose";
import { ShipRocket } from "../models/shiprocket/shiprocket.model.js";
import { createOrderBody } from "./shiprocket.controller.js";
import axios from "axios";
import productSoldHistory from "../models/product/productSoldHistory.js";
import { User } from "../models/auth/user.model.js";
import ShipmentModel from "../models/order/shipment.models.js";



//------------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// 1.newOrder
// 2.getSingleOrderDetails
// 3.processOrder
// 4.cancellOrder
// 5.deleteOrder
// 6.getAllOrders
// 7.getAllAdminOrders

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------------


export const newOrder = asyncErrorHandler(
  async (req: Request, res, next) => {

    console.log("new order--------------->----------------------------------------------------------")
    console.log(req.body)
    console.log("new order--------------->----------------------------------------------------------")

    const {
      orderItems,
      orderStatuses,
      total,
      couponcode,
      paymentMethod,
      paymentStatus,
      deliveryAddress,
      discount,
      discountedTotal,
      finalAmount,
      usableCoins,
      deliveryCharges
    } = req.body;

    if (!deliveryAddress || !orderItems || !total || !finalAmount) {
      return next(new ErrorHandler("Please Enter all Fields", 400));
    }

    console.log(JSON.parse(deliveryAddress))

    if (!req.user._id) {
      return next(new ErrorHandler("unauthenticated user", 400));
    }

    // Start a session for transaction management
    const session = await mongoose.startSession();
    session.startTransaction();
    try {

      const newOrder = new Order({
        user: req.user._id,
        orderItems: JSON.parse(orderItems),
        orderStatuses: JSON.parse(orderStatuses),
        total,
        couponcode,
        paymentMethod: JSON.parse(paymentMethod),
        paymentStatus,
        deliveryAddress: JSON.parse(deliveryAddress),
        discount,
        discountedTotal,
        finalAmount,
        usableCoins,
        deliveryCharges,
      });

      const ItemCategory = newOrder.orderItems.some((item: { category: string }) => item.category === "accessories") ? "accessories" : "smartphone";

      // Find the existing coin account or create a new one if not found
      let coinAccount = await CoinAccount.findOne({ userId: req.user._id }).session(session);

      if (!coinAccount) {
        // Create a new coin account if it doesn't exist
        coinAccount = new CoinAccount({ userId: req.user._id, coinAccountBalance: 0 });
        await coinAccount.save({ session });
      }

      const deductCoins = usableCoins | 0;
      coinAccount.coinAccountBalance -= coinAccount.useCoinForPayment ? deductCoins : 0

      // Create a new transaction record for deducting coins
      const reducetransaction = new CoinTransaction({
        userId: req.user._id,
        orderId: newOrder._id,
        rewardType: `purchase of ${ItemCategory}`,
        amountSpent: deductCoins,
        amountReceived: 0,
        notes: 'Coins reduced for purchase'
      });

      await reducetransaction.save({ session });

      // Update coin account balance after deduction
      await coinAccount.save({ session });

      // Calculate coins to be added based on item category
      let coinPercentage = 0;
      if (ItemCategory === "accessories") {
        coinPercentage = (10 / 100) * newOrder.finalAmount;
      } else {
        coinPercentage = (1 / 100) * newOrder.finalAmount;
      }

      const coinsTobeAdded = Math.floor(coinPercentage);
      coinAccount.coinAccountBalance += coinsTobeAdded;

      // Create a new transaction record for adding coins
      const addtransaction = new CoinTransaction({
        userId: req.user._id,
        orderId: newOrder._id,
        rewardType: `purchase of ${ItemCategory}`,
        amountSpent: 0,
        amountReceived: coinsTobeAdded,
        notes: 'Coins added for purchase'
      });

      await addtransaction.save({ session });

      //       const coinAccountData = await CoinAccount.findOne({ userId: req.user._id })
      newOrder.coinsCredited = coinsTobeAdded;
      newOrder.coinsDebited = coinAccount.useCoinForPayment ? deductCoins : 0;
      coinAccount.useCoinForPayment = false;

      await coinAccount.save({ session });
      await newOrder.save({ session });

      console.log("Order created successfully:", newOrder);

      // ----------------------------------- !!!! shiprocket order creation !!!!!-----------------------------------


      // const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
      // if (!ShipRocketCredentials) {
      //   return res.status(404).json({ message: "ShipRocket credentials not found" })
      // }
      // const config = {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${ShipRocketCredentials.token}`
      //   }
      // };
      // const createOrderUrl = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc"

      // const creatorderbodydata = createOrderBody(newOrder)

      // console.log("createorderbodydata------------>", creatorderbodydata)
      try {

        // const response = await axios.post(createOrderUrl, creatorderbodydata, config)
        // console.log({ success: true, message: 'shipRocket Order Created', data: response.data })
        // Store courier order details in the order
        // newOrder.courierOrderDetails = {
        //   order_id: response.data.order_id,
        //   channel_order_id: response.data.channel_order_id,
        //   shipment_id: response.data.shipment_id,
        //   status: response.data.status,
        //   awb_code: response.data.awb_code,
        //   courier_company_id: response.data.courier_company_id,
        //   courier_name: response.data.courier_name
        // };
        // ------------------------------------------ shiprocket order creation ends here -----------------------------------------------

        await newOrder.save({ session });
        //remove user coupon after order
        const user = await User.findById(req.user._id);

        if (!user) {
          return next(new ErrorHandler("No user found by this id", 404));
        }

        user.coupon = null
        await user.save({ session });

        //Dashboard Analytic
        //store order history to maintain
        // Create all product sold history documents in a single batch operation

        const productHistoryDocs = newOrder.orderItems.map((orderItem: any) => {
          // Ensure all fields have proper MongoDB ObjectId types
          console.log("creating history of order for analytic purpose ", orderItem.productId)
          return {
            order_id: newOrder._id,
            product_id: orderItem.productId,
            product_title: orderItem.productTitle,
            product_thumbnail: orderItem.thumbnail,
            variant_id: orderItem.selectedVarianceId ? orderItem.selectedVarianceId : null,
            user_id: req.user._id,
            coupon_used_id: newOrder.couponcode ? newOrder.couponcode : null,
            coin_used: newOrder.coinsDebited,
            product_qty_sold: orderItem.quantity,
            amount_at_which_prod_sold: Number(orderItem.sellingPrice || 0),
            discount_applied: Number(orderItem.boxPrice - orderItem.sellingPrice || 0),
            payment_method: JSON.parse(paymentMethod).type === "online" ? "online" : "COD",
            category_id: orderItem.categoryId,
            subcategory_id: orderItem.subCategoryId ? orderItem.subCategoryId : null,
            sold_at: new Date()
          };
        });

        // Use insertMany for bulk updates
        try {
          if (productHistoryDocs.length > 0) {
            await productSoldHistory.insertMany(productHistoryDocs, { session });
            console.log("Product sold history created successfully");
          }
        } catch (error) {
          console.error("Error creating product sold history:", error);
          //failed insertion of the data
          console.error("Failed documents:", JSON.stringify(productHistoryDocs));
          throw error; // This will trigger the transaction rollback
        }


      } catch (error: any) {
        console.log("error occured in creating shiprocket order------------>", error)
        //abort the transaction if shiprocket order does not create
        await session.abortTransaction();

      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      console.log("------------------------------ new order-----------------------------------")
      console.log(newOrder)
      console.log("------------------------------ new order-----------------------------------")
      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: newOrder,
      });

    } catch (error) {
      // Abort the transaction in case of an error
      await session.abortTransaction();
      session.endSession();

      console.error("Error processing transaction:", error);
      throw error;
    }
  }
);


// -----------------------!!!!!!!!!!!!! Track shipment !!!!!!!!!!!--------------------------
export const trackOrder = asyncErrorHandler(async (req, res, next) => {

  const { orderId } = req.body
  if (!orderId) {
    return res.status(400).send({ success: false, message: 'order id is required' })
  }

  const order = await Order.findById(orderId)

  if (!order) {
    return res.status(400).send({ success: false, message: 'order not found' })
  }


  const trackshipmentUrl = `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${order.courierOrderDetails.order_id}&channel_id=${order.courierOrderDetails.channel_id}`

  // const UserOrder = await Order.findOne({ _id: orderId }).populate("user")
  const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" })
  if (!ShipRocketCredentials) {
    return res.status(404).json({ success: false, message: "ShipRocket credentials not found" })
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ShipRocketCredentials.token}`
    }
  };
  // console.log("awbdata------------>", cancellShipmetBodyData)
  try {
    const response = await axios.get(trackshipmentUrl, config)
    console.log('Response data for track shipment:', response.data);
    return res.status(200).json({ success: true, message: "successfully tracked shipment", data: response.data })
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
    return res.status(400).json({ success: false, message: "Error in tracking order" })
  }

});


//------------- Archived for reference:api to create new order-----------------------------------------------------
// export const newOrder = asyncErrorHandler(
//   async (req: Request, res, next) => {

//     console.log("new order--------------->----------------------------------------------------------")
//     console.log(req.body)
//     console.log("new order--------------->----------------------------------------------------------")

//     const {
//       orderItems,
//       orderStatuses,
//       total,
//       couponcode,
//       paymentMethod,
//       paymentStatus,
//       deliveryAddress,
//       discount,
//       discountedTotal,
//       finalAmount,
//       usableCoins,
//       deliveryCharges
//     } = req.body;

//     if (!deliveryAddress || !orderItems || !total || !finalAmount) {
//       return next(new ErrorHandler("Please Enter all Fields", 400));
//     }

//     console.log(JSON.parse(deliveryAddress))

//     if (!req.user._id) {
//       return next(new ErrorHandler("unauthenticated user", 400));
//     }
//     // Start a session for transaction management
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     try {

//       const newOrder = new Order({
//         user: req.user._id,
//         orderItems: JSON.parse(orderItems),
//         orderStatuses: JSON.parse(orderStatuses),
//         total,
//         couponcode,
//         paymentMethod: JSON.parse(paymentMethod),
//         paymentStatus,
//         deliveryAddress: JSON.parse(deliveryAddress),
//         discount,
//         discountedTotal,
//         finalAmount,
//         usableCoins,
//         deliveryCharges,
//       });



//       const ItemCategory = newOrder.orderItems.some((item: { category: string }) => item.category === "smartphone") ? "smartphone" : "accessories";

//       const coinAccountData = await CoinAccount.findOne({ userId: req.user._id })
//       const deductCoins = usableCoins | 0
//       coinAccountData.coinAccountBalance -= coinAccountData.useCoinForPayment ? deductCoins : 0

//       // Find the existing coin account or create a new one if not found
//       let coinAccount = await CoinAccount.findOne({ userId: req.user._id }).session(session);

//       if (!coinAccount) {
//         // Create a new coin account if it doesn't exist
//         coinAccount = new CoinAccount({ userId: req.user._id, coinAccountBalance: 0 });
//         await coinAccount.save({ session });
//       }

//       // Update the coin account balance
//       coinAccount.coinAccountBalance -= deductCoins;
//       await coinAccount.save({ session });

//       // console.log("rewardType:----->", rewardType)

//       // Create a new transaction record
//       const reducetransaction = new CoinTransaction({
//         userId: req.user._id,
//         orderId: newOrder._id,
//         rewardType: `purchase of ${ItemCategory}`,
//         amountSpent: deductCoins,
//         amountReceived: 0,
//         notes: 'Coins reduced for purchase'
//       });

//       await reducetransaction.save({ session }); // Update the coin account balance


//       // give coins for new purchase
//       let coinPercentage = 0;
//       if (ItemCategory == "smartphone") {
//         coinPercentage = (1 / 100) * newOrder.finalAmount;
//         // await IncreaseCoins(req.user._id, "Purchase of Smartphone", newOrder._id, Math.floor(coinPercentage))
//       }

//       if (ItemCategory == "accessories") {
//         coinPercentage = (10 / 100) * newOrder.finalAmount;
//         // await IncreaseCoins(req.user._id, "Purchase of Accessories", newOrder._id, Math.floor(coinPercentage))
//       }


//       const coinsTobeAdded = Math.floor(coinPercentage)
//       coinAccount.coinAccountBalance += coinsTobeAdded;
//       await coinAccount.save({ session });

//       // console.log("rewardType:----->", rewardType)

//       // Create a new transaction record
//       const addtransaction = new CoinTransaction({
//         userId: req.user._id,
//         orderId: newOrder._id,
//         rewardType: `purchase of ${ItemCategory}`,
//         amountSpent: 0,
//         amountReceived: coinsTobeAdded,
//         notes: 'Coins added for purchase'
//       });

//       await addtransaction.save({ session });

//       newOrder.coinsCredited = coinsTobeAdded
//       newOrder.coinsDebited = coinAccountData.useCoinForPayment ? deductCoins : 0
//       coinAccountData.useCoinForPayment = false

//       await coinAccountData.save({ session })
//       await newOrder.save({ session })
//       console.log("new order--------------->", newOrder)
//       //also give coin for purchase
//       // Commit the transaction
//       await session.commitTransaction();
//       session.endSession();
//       console.log(newOrder, "....................newOrder//////////")

//       return res.status(201).json({
//         success: true,
//         message: "Order cr successfully",
//         newMsg: "just checking",
//         order: newOrder,
//       });
//       // console.log("Transaction successfully completed:", transaction);
//     } catch (error) {
//       // Abort the transaction in case of an error
//       await session.abortTransaction();
//       session.endSession();

//       console.error("Error processing transaction:", error);
//       throw error
//     }


//   }
// );

//--------------------api to get single order details---------------------------------------
export const getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate("user", "name");
  if (!order) {
    return next(new ErrorHandler("Order Not Found", 404));
  }
  // Fetch reviews for all items in the current order
  const orderItemsWithReviews = await Promise.all(order.orderItems.map(async (item: any) => {
    console.log("item", item)
    // Find reviews based on userId and productId
    const reviews = await Review.find({
      reviewUser: req.user._id,
      reviewProduct: item.productId
    });
    console.log("reviews", reviews)
    // Return an object with item details and associated reviews
    return {
      ...item,
      review: reviews?.length > 0 ? reviews[0] : {}
    };
  }));
  const orderDetails = {
    orderId: order._id,
    deliveryAddress: order.deliveryAddress,
    orderStatuses: order.orderStatuses,
    total: order.total,
    couponcode: order.couponcode,
    discount: order.discount,
    paymentMode: order.paymentMethod?.paymentMode,
    paymentStatus: order.paymentStatus,
    discountedTotal: order.discountedTotal,
    finalAmount: order.finalAmount,
    deliveryCharges: order.deliveryCharges,
    coinsCredited: order.coinsCredited,
    coinsDebited: order.coinsDebited,
    shipmentId: order?.courierOrderDetails?.shipment_id,
    shipmentDetails: order?.courierOrderDetails,
    orderItems: orderItemsWithReviews
  }

  console.log("orderItemwithreviews", orderItemsWithReviews)
  return res.status(200).json({
    success: true,
    message: "Order details fetched Successfully",
    orderDetails,
  });
});



export const getAdminSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate("user");
  if (!order) {
    return next(new ErrorHandler("Order Not Found", 404));
  }
  // Look for existing shipment in MongoDB using the order ID
  const shipment = await ShipmentModel.findOne({ orderId: id });
  // Check if the order has a shipment
  let shipmentDetails = order?.courierOrderDetails || {};
  let shipmentStatus = order?.orderStatuses || [];
  const lastStatus = shipmentStatus[shipmentStatus.length - 1]?.status || '';

  if (shipment) {
    // Use the shipment details from MongoDB
    shipmentDetails = shipment.shipmentDetails || {};

    // Only check for status updates if the order is not delivered or cancelled
    if (lastStatus !== 'delivered' && lastStatus !== 'cancelled') {
      try {
        const waybill = shipment.waybillNumber;

        if (waybill) {
          // Construct the URL with query parameters
          const trackingUrl = `${process.env.DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${waybill}`;

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

          // Update shipment details with the latest information
          if (response.data && response.data.trackingData.ShipmentData && response.data.trackingData.ShipmentData.length > 0) {
            const latestShipmentDataStatus = response.data.trackingData.ShipmentData.Shipment.Status;



            // Update shipment in MongoDB
            await ShipmentModel.findByIdAndUpdate(shipment._id, {
              status: latestShipmentDataStatus,
              lastUpdated: new Date()
            });

            // Map Delhivery status to your order status
            if (latestShipmentDataStatus.toLowerCase() == 'delivered') {
              await Order.findByIdAndUpdate(id, {
                $push: { orderStatuses: { status: 'delivered', timestamp: new Date() } }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching shipment tracking:", error);
        // Continue with the existing shipment details if API call fails
      }
    }
  }

  return res.status(200).json({
    success: true,
    message: "Order details fetched Successfully",
    orderDetails: order,
    shipmentDetails: shipment
  });
});


// export const getSinglesOrderDetails = asyncErrorHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const order = await Order.findById(id).populate("user", "name");

//   if (!order) {
//     return next(new ErrorHandler("Order Not Found", 404));
//   }

//   // Fetch reviews for all items in the current order
//   const orderItemsWithReviews = await Promise.all(order.orderItems.map(async (item) => {
//     console.log("item", item);
//     // Find reviews based on userId and productId
//     const reviews = await Review.find({
//       reviewUser: req.user._id,
//       reviewProduct: item.productId
//     });
//     console.log("reviews", reviews);
//     // Return an object with item details and associated reviews
//     return {
//       ...item,
//       review: reviews?.length > 0 ? reviews[0] : {}
//     };
//   }));

//   // Check if the order has a shipment
//   let shipmentDetails = order?.courierOrderDetails || {};
//   let shipmentStatus = order?.orderStatuses || [];
//   const lastStatus = shipmentStatus[shipmentStatus.length - 1]?.status || '';

//   // Look for existing shipment in MongoDB using the order ID
//   const shipment = await ShipmentModel.findOne({ orderId: id });

//   if (shipment) {
//     // Use the shipment details from MongoDB
//     shipmentDetails = shipment.shipmentDetails || {};

//     // Only check for status updates if the order is not delivered or cancelled
//     if (lastStatus !== 'delivered' && lastStatus !== 'cancelled') {
//       try {
//         const waybill = shipmentDetails.waybill || shipmentDetails.shipment_id;

//         if (waybill) {
//           // Construct the URL with query parameters
//           const trackingUrl = `${process.env.DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${waybill}`;

//           // Make request to Delhivery API
//           const response = await axios.get(
//             trackingUrl,
//             {
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json',
//                 'Authorization': `Token ${process.env.DELHIVERY_API_KEY}`,
//               },
//             }
//           );

//           // Update shipment details with the latest information
//           if (response.data && response.data.ShipmentData && response.data.ShipmentData.length > 0) {
//             const latestShipmentData = response.data.ShipmentData[0];

//             // Update shipment details
//             shipmentDetails = {
//               ...shipmentDetails,
//               tracking_data: latestShipmentData
//             };

//             // Update shipment in MongoDB
//             await Shipment.findByIdAndUpdate(shipment._id, {
//               shipmentDetails: shipmentDetails,
//               lastUpdated: new Date()
//             });

//             // Update order status if needed
//             const delhiveryStatus = latestShipmentData.Status || '';
//             let orderStatus = '';

//             // Map Delhivery status to your order status
//             if (delhiveryStatus.toLowerCase().includes('delivered')) {
//               orderStatus = 'delivered';
//             } else if (delhiveryStatus.toLowerCase().includes('cancelled')) {
//               orderStatus = 'cancelled';
//             } else if (delhiveryStatus.toLowerCase().includes('in transit')) {
//               orderStatus = 'shipped';
//             }

//             // Update order status in DB if there's a new status
//             if (orderStatus && lastStatus !== orderStatus) {
//               await Order.findByIdAndUpdate(id, {
//                 $push: { orderStatuses: { status: orderStatus, timestamp: new Date() } }
//               });

//               // Update local shipmentStatus for the response
//               shipmentStatus.push({ status: orderStatus, timestamp: new Date() });
//             }
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching shipment tracking:", error.message);
//         // Continue with the existing shipment details if API call fails
//       }
//     }
//   }

//   const orderDetails = {
//     orderId: order._id,
//     deliveryAddress: order.deliveryAddress,
//     orderStatuses: shipmentStatus,
//     total: order.total,
//     couponcode: order.couponcode,
//     discount: order.discount,
//     paymentMode: order.paymentMethod?.paymentMode,
//     paymentStatus: order.paymentStatus,
//     discountedTotal: order.discountedTotal,
//     finalAmount: order.finalAmount,
//     deliveryCharges: order.deliveryCharges,
//     coinsCredited: order.coinsCredited,
//     coinsDebited: order.coinsDebited,
//     shipmentId: shipmentDetails?.shipment_id,
//     shipmentDetails: shipmentDetails,
//     orderItems: orderItemsWithReviews
//   };

//   console.log("orderItemwithreviews", orderItemsWithReviews);

//   return res.status(200).json({
//     success: true,
//     message: "Order details fetched Successfully",
//     orderDetails,
//   });
// });



//--------------------api to process order------------------------------------------------

export const processOrder = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { stage } = req.query;

  if (!stage || typeof stage != "string") {
    return next(new ErrorHandler("Stage is Not Valid", 404));
  }

  const order = await Order.findById(id);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  console.log(order, "------and---------", order.orderStatuses.length);
  let orderStatus = order.orderStatuses[order.orderStatuses.length - 1];
  console.log(orderStatus);

  if (!orderStatus) {
    return next(new ErrorHandler("Status not found", 404));
  }

  // Define valid stages as a literal type
  const validStages = ["placed", "processed", "delivered", "cancelled"] as const;

  type OrderStage = typeof validStages[number];

  // Type assertion: Ensure that 'stage' is one of the valid stages
  const typedStage = stage as OrderStage;

  if (!validStages.includes(typedStage)) {
    return next(new ErrorHandler("Invalid stage", 400));
  }

  // Add type assertion for currentStage
  const currentStage = order.orderStatusState as OrderStage;
  // Prevent changes if the order is already delivered or cancelled
  if (currentStage === "delivered" || currentStage === "cancelled") {
    return next(new ErrorHandler("Cannot change status of a delivered or cancelled order", 400));
  }

  //change order status
  order.orderStatusState = typedStage
  // Push the new status to the order's status list
  order.orderStatuses.push({
    date: new Date(),
    status: typedStage
  });

  await order.save();
  return res.status(200).json({
    success: true,
    message: "Order processed successfully",
  });
});

// export const processOrder = asyncErrorHandler(async (req, res, next) => {
//   const { id,stage } = req.params;
//   const order = await Order.findById(id);

//   if (!order) {
//     return next(new ErrorHandler("order not found", 404));
//   }
//   console.log(order, "------and---------", order.orderStatuses.length)

//   let orderStatus = order.orderStatuses[order.orderStatuses.length - 1]
//   console.log(orderStatus)

//   if (!orderStatus) {
//     return next(new ErrorHandler("status not found", 404));
//   }

//   switch (stage) {
//     case "pending":
//       order.orderStatuses.push({
//         date: new Date(),
//         status: 'packed'
//       });
//       break;
//     case "placed":
//       order.orderStatuses.push({
//         date: new Date(),
//         status: 'packed'
//       });
//       break;
//     case "packed":
//       order.orderStatuses.push({
//         date: new Date(),
//         status: 'shipped'
//       });
//       break;
//     case "shipped":
//       order.orderStatuses.push({
//         date: new Date(),
//         status: 'outfordelivery'
//       });
//       break;
//     case "outfordelivery":
//       order.orderStatuses.push({
//         date: new Date(),
//         status: 'delivered'
//       });
//       break;
//     case "delivered":
//       break;
//     // default:
//     //   order.orderStatuses.push({
//     //     date: new Date(),
//     //     status: 'delivered'
//     //   });
//     //   break;
//   }
//   await order.save();
//   return res.status(200).json({
//     success: true,
//     message: "Order processed Successfully",
//   });
// });

//--------------------api to cancell order---------------------------------------------------


export const cancellOrder = asyncErrorHandler(async (req, res, next) => {
  console.log("order cancellation called")
  const { shipRocketId, orderId } = req.body;
  console.log(req.body)

  if (!orderId || !shipRocketId) {
    return res.status(400).send({ success: false, message: 'orderId is required' });
  }

  const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" });
  if (!ShipRocketCredentials) {
    return res.status(404).json({ success: false, message: "ShipRocket credentials not found" });
  }

  const cancellOrderUrl = "https://apiv2.shiprocket.in/v1/external/orders/cancel";
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ShipRocketCredentials.token}`
    }
  };

  const cancellOrderBodyData = {
    "ids": [shipRocketId]
  };

  const session = await startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler("Order not found", 404));
    }

    // Attempt to cancel the order on Shiprocket first
    const response = await axios.post(cancellOrderUrl, cancellOrderBodyData, config);
    console.log('Response data for cancel order:', response.data);

    // If Shiprocket cancellation is successful, cancel the order in MongoDB
    order.orderStatuses.push({
      date: new Date(),
      status: 'cancelled'
    });
    order.orderStatusState = "cancelled"
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Order cancelled and deleted successfully",
      data: response.data
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }

    return res.status(500).json({ success: false, message: "Error in cancelling Shiprocket order", error });
  }
});


// export const cancellOrder = asyncErrorHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const order = await Order.findById(id);

//   if (!order) {
//     return next(new ErrorHandler("order not found", 404));
//   }

//   order.orderStatuses.push({
//     date: new Date(),
//     status: 'cancelled'
//   });

//   await order.save();

//   return res.status(200).json({
//     success: true,
//     message: "Order Cancelled Successfully",
//   });
// });

//-------------------api to delete order------------------------------------------------------
// export const deleteOrder = asyncErrorHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const order = await Order.findById(id);
//   if (!order) {
//     return next(new ErrorHandler("order not found", 404));
//   }
//   await order.deleteOne();
//   return res.status(200).json({
//     success: true,
//     message: "Order Deleted Successfully",
//   });
// });


export const deleteOrder = asyncErrorHandler(async (req, res, next) => {

  const { shipRocketId, orderId } = req.body;
  console.log(req.body)

  if (!orderId || !shipRocketId) {
    return res.status(400).send({ success: false, message: 'Both orderId is required' });
  }

  const orderInDb = await Order.findById(orderId)

  if (!orderInDb) {
    return res.status(400).send({ success: false, message: 'order does not exist in db' });
  }


  const ShipRocketCredentials = await ShipRocket.findOne({ email: "mobilenmobilebjnr1@gmail.com" });

  if (!ShipRocketCredentials) {
    return res.status(404).json({ success: false, message: "ShipRocket credentials not found" });
  }

  const cancellOrderUrl = "https://apiv2.shiprocket.in/v1/external/orders/cancel";
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ShipRocketCredentials.token}`
    }
  };

  const cancellOrderBodyData = {
    "ids": [shipRocketId]
  };

  const session = await startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return next(new ErrorHandler("Order not found", 404));
    }

    // Attempt to cancel the order on Shiprocket first
    const response = await axios.post(cancellOrderUrl, cancellOrderBodyData, config);
    console.log('Response data for cancel order:', response.data);

    // If Shiprocket cancellation is successful, delete the order from MongoDB
    await order.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Order cancelled and deleted successfully",
      data: response.data
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Error response data:', error.response.data.errors || error.response.data.message || error.response.data || 'No error message');
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }

    return res.status(500).json({ success: false, message: "Error in cancelling Shiprocket order", error });
  }
});

//-----------------api to get all orders for the user logged in---------------------------------------------
export const getAllOrders = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id; // Assuming req.user.id contains the user's ID
  // Find all orders for the user
  const orders = await Order.find({ user: userId });
  if (!orders || orders.length === 0) {
    return next(new ErrorHandler("order not found", 404));
  }

  // Create an array to store promises for fetching reviews for all items in all orders
  const reviewPromises = orders.map(async (order) => {
    const orderId = order._id;

    // Fetch reviews for all items in the current order
    const orderItemsWithReviews = await Promise.all(order.orderItems.map(async (item: any) => {

      console.log("item", item)

      // Find reviews based on userId and productId
      const reviews = await Review.find({
        reviewUser: userId,
        reviewProduct: item.productId
      });
      console.log("reviews", reviews)
      // Return an object with item details and associated reviews
      return {
        item,
        reviews: reviews
      };
    }));
    console.log("orderItemwithreviews", orderItemsWithReviews)
    // Return an object with order details and items with reviews
    return {
      _id: orderId,
      deliveryAddress: order.deliveryAddress,
      discount: order.discount,
      orderStatuses: order.orderStatuses,
      orderItems: orderItemsWithReviews
    };
  });

  // Execute all review promises concurrently
  const ordersWithReviews = await Promise.all(reviewPromises);
  // Define the desired order of statuses
  const statusOrder = ['placed', 'packed', 'shipped', 'outfordelivery', 'delivered', 'cancelled'];

  // Function to determine the last status of an order

  function getLastStatus(order: any) {
    if (order.orderStatuses.length > 0) {
      return order.orderStatuses[order.orderStatuses.length - 1].status;
    }
    return null; // Return null if no statuses are present
  }


  // Sorting orders based on the last status
  ordersWithReviews.sort((a, b) => {
    let lastStatusA = getLastStatus(a);
    let lastStatusB = getLastStatus(b);
    console.log(lastStatusA, lastStatusB)
    // Sort orders based on the index of their last status in statusOrder
    return statusOrder.indexOf(lastStatusA) - statusOrder.indexOf(lastStatusB);
  });
  // res.json(jsonResponse);
  return res.status(200).json({
    success: true,
    message: "orders fetched Successfully",
    orders: ordersWithReviews
  });

})

//-------------------api to get all orders----------------------------------------------------------------

// export const getAllAdminOrders = asyncErrorHandler(async (req, res, next) => {
//   console.log("Order controller called");
//   const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//   console.log(`Incoming request from IP: ${ip} to ${req.originalUrl}`);
//   const { startDate, endDate, page = 1, orderStatus, searchText } = req.query;
//   const limit = 20;

//   // Parse and validate page
//   const parsedPage = (page && typeof page === "string") ? parseInt(page, 10) : 1;

//   if (isNaN(parsedPage) || parsedPage < 1) {
//     return res.status(400).json({ error: "Invalid page value" });
//   }
//   const skip = (parsedPage - 1) * limit;

//   // Helper function for date validation
//   const validateDate = (dateStr: string): Date | null => {
//     const date = new Date(dateStr);
//     return !isNaN(date.getTime()) ? date : null;
//   };


//   let start: Date | null = validateDate(startDate as string);
//   let end: Date | null = validateDate(endDate as string);

//   // Default to one-month range if dates are missing
//   if (!start && !end) {
//     end = new Date();
//     start = new Date();
//     start.setMonth(start.getMonth() - 1);
//   } else if (!start || !end) {
//     return res.status(400).json({ error: "Invalid start or end date provided" });
//   }

//   // Previous time frame calculation
//   const previousEnd = new Date(start);
//   const previousStart = new Date(previousEnd);
//   previousStart.setMonth(previousStart.getMonth() - 1);

//   // Define the structure of `orderStatuses`
//   interface OrderStatus {
//     status: string;
//     date: string;
//   }

//   type OrderDocument = {
//     orderStatuses: OrderStatus[];
//     createdAt: Date;
//     [key: string]: any;
//   };

//   try {
//     // Combine filters
//     const dateFilter = { "orderStatuses.date": { $gte: start.toISOString(), $lte: end.toISOString() } };

//     let statusFilter: Record<string, any> = {};
//     if (orderStatus) {
//       statusFilter["orderStatusState"] = orderStatus as string;
//     }

//     let searchFilter: Record<string, any> = {};
//     if (typeof searchText === "string" && searchText.trim()) {
//       searchFilter = {
//         "orderItems.productTitle": { $regex: searchText.trim(), $options: "i" }
//       };
//     }

//     const filter = { ...dateFilter, ...statusFilter, ...searchFilter };

//     // Fetch orders and total products
//     const [orders, totalProducts] = await Promise.all([
//       Order.find(filter)
//         .sort("-createdAt")
//         .populate("user", "profile")
//         .skip(skip)
//         .limit(limit),
//       Order.countDocuments(filter)
//     ]);

//     // Total products in the current page
//     const currentPageTotalProducts = orders.length;


//     // --------------------------------------------- order stats ----------------------------------------

//     // Helper function for status counts
//     const getStatusCounts = async (start: Date, end: Date) => {
//       try {
//         const pipeline: PipelineStage[] = [
//           // Unwind the entire orderStatuses array
//           { $unwind: "$orderStatuses" },

//           // Match statuses within the date range
//           {
//             $match: {
//               "orderStatuses.date": {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           },

//           // Group by status
//           {
//             $group: {
//               _id: "$orderStatuses.status",
//               count: { $sum: 1 },
//               orderIds: { $addToSet: "$_id" }
//             }
//           },

//           // Sort by count
//           {
//             $sort: { count: -1 }
//           }
//         ];

//         // Execute the aggregation
//         const statusCounts = await Order.aggregate(pipeline);

//         // Convert to a more usable format
//         const counts: Record<string, number> = {};
//         statusCounts.forEach(status => {
//           counts[status._id] = status.count;
//         });

//         console.log(' Detailed Status Counts:', JSON.stringify(counts, null, 2));
//         console.log('Status Aggregation Full Details:', JSON.stringify(statusCounts, null, 2));

//         return counts;
//       } catch (error) {
//         console.error('Error calculating status counts:', error);
//         return {};
//       }
//     };




//     const getPlacedOrderCount = async (startDate: Date, endDate: Date) => {
//       try {
//         const pipeline = [
//           {
//             $match: {
//               "orderStatuses": {
//                 $elemMatch: {
//                   status: "placed",
//                   date: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                   }
//                 }
//               }
//             }
//           },
//           {
//             $count: "placedOrdersCount"
//           }
//         ];

//         const result = await Order.aggregate(pipeline);
//         console.log('########### result is', result)
//         return result.length > 0 ? result[0].placedOrdersCount : 0;
//       } catch (error) {
//         console.error("Error fetching placed orders count:", error);
//         return 0;
//       }
//     };



//     // Comprehensive debugging function
//     const thoroughStatusDebug = async (start: Date, end: Date) => {
//       try {
//         // Find all orders with statuses in the date range
//         const orders = await Order.find({
//           "orderStatuses": {
//             $elemMatch: {
//               date: {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           }
//         });

//         console.log('Total Orders in Range:', orders.length);

//         // Detailed status tracking
//         const statusTracker: Record<string, number> = {};

//         orders.forEach(order => {
//           console.log('Order ID:', order._id);
//           console.log('Full Order Statuses:', order.orderStatuses);

//           // Track all statuses in the date range
//           order.orderStatuses.forEach((status: any) => {
//             const statusDate = new Date(status.date);
//             if (statusDate >= start && statusDate <= end) {
//               console.log(`Status Found: ${status.status}, Date: ${status.date}`);
//               statusTracker[status.status] = (statusTracker[status.status] || 0) + 1;
//             }
//           });
//         });

//         console.log('Comprehensive Status Tracking:', statusTracker);
//         return statusTracker;
//       } catch (error) {
//         console.error('Thorough Debug Error:', error);
//         return {};
//       }
//     };

//     // Modified status changes calculation
//     const calculateStatusChanges = (currentCounts: Record<string, number>, previousCounts: Record<string, number>, statuses: string[]) => {
//       return statuses.map((status) => {
//         const currentInterval = currentCounts[status] || 0;
//         const previousInterval = previousCounts[status] || 0;
//         const difference = currentInterval - previousInterval;
//         const growth = previousInterval === 0
//           ? (currentInterval > 0 ? 100 : 0)
//           : Math.round(((currentInterval - previousInterval) / previousInterval) * 100);

//         return {
//           status,
//           currentInterval,
//           previousInterval,
//           difference,
//           growth
//         };
//       });
//     };

//     // Usage in your controller
//     const thoroughDebug = await thoroughStatusDebug(start, end);
//     const currentCounts = await getStatusCounts(start, end);
//     const previousCounts = await getStatusCounts(previousStart, previousEnd);

//     // Use all possible statuses from both current and previous counts
//     const allStatuses = Array.from(new Set([
//       ...Object.keys(currentCounts),
//       ...Object.keys(previousCounts)
//     ]));

//     const statusChangess = calculateStatusChanges(currentCounts, previousCounts, allStatuses);

//     // Debugging function to verify status entries
//     const debugOrderStatuses = async (start: Date, end: Date) => {
//       try {
//         const orders = await Order.find({
//           "orderStatuses": {
//             $elemMatch: {
//               date: {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           }
//         });

//         console.log('Total Orders in Range:', orders.length);
//         orders.forEach(order => {
//           console.log('Order ID:', order._id);
//           console.log('Full Order Statuses:', order.orderStatuses);

//           // Filter statuses within the date range
//           const filteredStatuses = order.orderStatuses.filter((status: any) => {
//             const statusDate = new Date(status.date);
//             return statusDate >= start && statusDate <= end;
//           });

//           console.log('Filtered Statuses:', filteredStatuses);
//         });
//       } catch (error) {
//         console.error('Debug Error:', error);
//       }
//     };

//     await debugOrderStatuses(start, end);
//     console.log("###########placed########", await getPlacedOrderCount(start, end))
//     // Usage
//     // const currentCounts = await getStatusCounts(start, end);
//     // // Fetch status counts for the current and previous time frames
//     // const previousCounts = await getStatusCounts(previousStart, previousEnd);

//     // Calculate changes for each status
//     const statuses = ["placed", "processed", "delivered", "cancelled"];

//     const statusChanges = statuses.map((status) => {
//       const currentInterval = currentCounts[status] || 0;
//       const previousInterval = previousCounts[status] || 0;
//       const difference = currentInterval - previousInterval;
//       const growth = previousInterval === 0 ? (currentInterval > 0 ? 100 : 0) : Math.round(((currentInterval - previousInterval) / previousInterval) * 100);
//       return { status, currentInterval, previousInterval, difference, growth };
//     });

//     // Order Statistics
//     const orderStatistics = {
//       statusChanges,
//       totalProducts,
//       currentPageTotalProducts
//     };
//     // Success response
//     return res.status(200).json({
//       success: true,
//       message: "Orders fetched successfully",
//       totalProducts,
//       currentPageTotalProducts,
//       page: parsedPage,
//       orders,
//       orderStatistics
//     });
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error"
//     });
//   }
// });



// export const getAllAdminOrders = asyncErrorHandler(async (req, res, next) => {
//   console.log("Order controller called");
//   const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//   console.log(`Incoming request from IP: ${ip} to ${req.originalUrl}`);
//   const { startDate, endDate, page = 1, orderStatus, searchText } = req.query;
//   const limit = 20;

//   // Parse and validate page
//   const parsedPage = (page && typeof page === "string") ? parseInt(page, 10) : 1;

//   if (isNaN(parsedPage) || parsedPage < 1) {
//     return res.status(400).json({ error: "Invalid page value" });
//   }
//   const skip = (parsedPage - 1) * limit;

//   // Helper function for date validation
//   const validateDate = (dateStr: string): Date | null => {
//     const date = new Date(dateStr);
//     return !isNaN(date.getTime()) ? date : null;
//   };


//   let start: Date | null = validateDate(startDate as string);
//   let end: Date | null = validateDate(endDate as string);

//   // Default to one-month range if dates are missing
//   if (!start && !end) {
//     end = new Date();
//     start = new Date();
//     start.setMonth(start.getMonth() - 1);
//   } else if (!start || !end) {
//     return res.status(400).json({ error: "Invalid start or end date provided" });
//   }

//   // Previous time frame calculation
//   const previousEnd = new Date(start);
//   const previousStart = new Date(previousEnd);
//   previousStart.setMonth(previousStart.getMonth() - 1);

//   // Define the structure of `orderStatuses`
//   interface OrderStatus {
//     status: string;
//     date: string;
//   }

//   type OrderDocument = {
//     orderStatuses: OrderStatus[];
//     createdAt: Date;
//     [key: string]: any;
//   };

//   try {
//     // Combine filters
//     const dateFilter = { "orderStatuses.date": { $gte: start.toISOString(), $lte: end.toISOString() } };

//     let statusFilter: Record<string, any> = {};
//     if (orderStatus) {
//       statusFilter["orderStatusState"] = orderStatus as string;
//     }

//     let searchFilter: Record<string, any> = {};
//     if (typeof searchText === "string" && searchText.trim()) {
//       searchFilter = {
//         "orderItems.productTitle": { $regex: searchText.trim(), $options: "i" }
//       };
//     }

//     const filter = { ...dateFilter, ...statusFilter, ...searchFilter };

//     // Fetch orders and total products
//     const [orders, totalProducts] = await Promise.all([
//       Order.find(filter)
//         .sort("-createdAt")
//         .populate("user", "profile")
//         .skip(skip)
//         .limit(limit),
//       Order.countDocuments(filter)
//     ]);

//     // Total products in the current page
//     const currentPageTotalProducts = orders.length;

//     // Calculate pagination metadata
//     const totalPages = Math.ceil(totalProducts / limit);
//     const hasNextPage = parsedPage < totalPages;
//     const hasPreviousPage = parsedPage > 1;

//     // --------------------------------------------- order stats ----------------------------------------

//     // Helper function for status counts
//     const getStatusCounts = async (start: Date, end: Date) => {
//       try {
//         const pipeline: PipelineStage[] = [
//           // Unwind the entire orderStatuses array
//           { $unwind: "$orderStatuses" },

//           // Match statuses within the date range
//           {
//             $match: {
//               "orderStatuses.date": {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           },

//           // Group by status
//           {
//             $group: {
//               _id: "$orderStatuses.status",
//               count: { $sum: 1 },
//               orderIds: { $addToSet: "$_id" }
//             }
//           },

//           // Sort by count
//           {
//             $sort: { count: -1 }
//           }
//         ];

//         // Execute the aggregation
//         const statusCounts = await Order.aggregate(pipeline);

//         // Convert to a more usable format
//         const counts: Record<string, number> = {};
//         statusCounts.forEach(status => {
//           counts[status._id] = status.count;
//         });

//         console.log(' Detailed Status Counts:', JSON.stringify(counts, null, 2));
//         console.log('Status Aggregation Full Details:', JSON.stringify(statusCounts, null, 2));

//         return counts;
//       } catch (error) {
//         console.error('Error calculating status counts:', error);
//         return {};
//       }
//     };




//     const getPlacedOrderCount = async (startDate: Date, endDate: Date) => {
//       try {
//         const pipeline = [
//           {
//             $match: {
//               "orderStatuses": {
//                 $elemMatch: {
//                   status: "placed",
//                   date: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                   }
//                 }
//               }
//             }
//           },
//           {
//             $count: "placedOrdersCount"
//           }
//         ];

//         const result = await Order.aggregate(pipeline);
//         console.log('########### result is', result)
//         return result.length > 0 ? result[0].placedOrdersCount : 0;
//       } catch (error) {
//         console.error("Error fetching placed orders count:", error);
//         return 0;
//       }
//     };



//     // Comprehensive debugging function
//     const thoroughStatusDebug = async (start: Date, end: Date) => {
//       try {
//         // Find all orders with statuses in the date range
//         const orders = await Order.find({
//           "orderStatuses": {
//             $elemMatch: {
//               date: {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           }
//         });

//         console.log('Total Orders in Range:', orders.length);

//         // Detailed status tracking
//         const statusTracker: Record<string, number> = {};

//         orders.forEach(order => {
//           console.log('Order ID:', order._id);
//           console.log('Full Order Statuses:', order.orderStatuses);

//           // Track all statuses in the date range
//           order.orderStatuses.forEach((status: any) => {
//             const statusDate = new Date(status.date);
//             if (statusDate >= start && statusDate <= end) {
//               console.log(`Status Found: ${status.status}, Date: ${status.date}`);
//               statusTracker[status.status] = (statusTracker[status.status] || 0) + 1;
//             }
//           });
//         });

//         console.log('Comprehensive Status Tracking:', statusTracker);
//         return statusTracker;
//       } catch (error) {
//         console.error('Thorough Debug Error:', error);
//         return {};
//       }
//     };

//     // Modified status changes calculation
//     const calculateStatusChanges = (currentCounts: Record<string, number>, previousCounts: Record<string, number>, statuses: string[]) => {
//       return statuses.map((status) => {
//         const currentInterval = currentCounts[status] || 0;
//         const previousInterval = previousCounts[status] || 0;
//         const difference = currentInterval - previousInterval;
//         const growth = previousInterval === 0
//           ? (currentInterval > 0 ? 100 : 0)
//           : Math.round(((currentInterval - previousInterval) / previousInterval) * 100);

//         return {
//           status,
//           currentInterval,
//           previousInterval,
//           difference,
//           growth
//         };
//       });
//     };

//     // Usage in your controller
//     const thoroughDebug = await thoroughStatusDebug(start, end);
//     const currentCounts = await getStatusCounts(start, end);
//     const previousCounts = await getStatusCounts(previousStart, previousEnd);

//     // Use all possible statuses from both current and previous counts
//     const allStatuses = Array.from(new Set([
//       ...Object.keys(currentCounts),
//       ...Object.keys(previousCounts)
//     ]));

//     const statusChangess = calculateStatusChanges(currentCounts, previousCounts, allStatuses);

//     // Debugging function to verify status entries
//     const debugOrderStatuses = async (start: Date, end: Date) => {
//       try {
//         const orders = await Order.find({
//           "orderStatuses": {
//             $elemMatch: {
//               date: {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           }
//         });

//         console.log('Total Orders in Range:', orders.length);
//         orders.forEach(order => {
//           console.log('Order ID:', order._id);
//           console.log('Full Order Statuses:', order.orderStatuses);

//           // Filter statuses within the date range
//           const filteredStatuses = order.orderStatuses.filter((status: any) => {
//             const statusDate = new Date(status.date);
//             return statusDate >= start && statusDate <= end;
//           });

//           console.log('Filtered Statuses:', filteredStatuses);
//         });
//       } catch (error) {
//         console.error('Debug Error:', error);
//       }
//     };

//     await debugOrderStatuses(start, end);
//     console.log("###########placed########", await getPlacedOrderCount(start, end))

//     // Usage
//     // const currentCounts = await getStatusCounts(start, end);
//     // // Fetch status counts for the current and previous time frames
//     // const previousCounts = await getStatusCounts(previousStart, previousEnd);

//     // Calculate changes for each status
//     const statuses = ["placed", "processed", "delivered", "cancelled"];

//     const statusChanges = statuses.map((status) => {
//       const currentInterval = currentCounts[status] || 0;
//       const previousInterval = previousCounts[status] || 0;
//       const difference = currentInterval - previousInterval;
//       const growth = previousInterval === 0 ? (currentInterval > 0 ? 100 : 0) : Math.round(((currentInterval - previousInterval) / previousInterval) * 100);
//       return { status, currentInterval, previousInterval, difference, growth };
//     });

//     // Order Statistics

//     // Success response with pagination metadata
//     return res.status(200).json({
//       success: true,
//       message: "Orders fetched successfully",
//       totalProducts,
//       currentPageTotalProducts,
//       page: parsedPage,
//       totalPages,
//       hasNextPage,
//       hasPreviousPage,
//       orderStatistics: statusChanges,
//       orders,
//     });
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error"
//     });
//   }
// });



// export const getAllAdminOrders = asyncErrorHandler(async (req, res, next) => {
//   console.log("Order controller called");
//   const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//   console.log(`Incoming request from IP: ${ip} to ${req.originalUrl}`);
//   const { startDate, endDate, page = 1, orderStatus, searchText } = req.query;
//   const limit = 20;

//   // Parse and validate page
//   const parsedPage = (page && typeof page === "string") ? parseInt(page, 10) : 1;

//   if (isNaN(parsedPage) || parsedPage < 1) {
//     return res.status(400).json({ error: "Invalid page value" });
//   }
//   const skip = (parsedPage - 1) * limit;

//   // Helper function for date validation
//   const validateDate = (dateStr: string): Date | null => {
//     const date = new Date(dateStr);
//     return !isNaN(date.getTime()) ? date : null;
//   };

//   let start: Date | null = validateDate(startDate as string);
//   let end: Date | null = validateDate(endDate as string);

//   // Default to one-month range if dates are missing
//   if (!start && !end) {
//     end = new Date();
//     start = new Date();
//     start.setMonth(start.getMonth() - 1);
//   } else if (!start || !end) {
//     return res.status(400).json({ error: "Invalid start or end date provided" });
//   }

//   // Previous time frame calculation
//   const previousEnd = new Date(start);
//   const previousStart = new Date(previousEnd);
//   previousStart.setMonth(previousStart.getMonth() - 1);

//   // Define the structure of `orderStatuses`
//   interface OrderStatus {
//     status: string;
//     date: string;
//   }

//   type OrderDocument = {
//     orderStatuses: OrderStatus[];
//     createdAt: Date;
//     [key: string]: any;
//   };

//   try {
//     // Create two separate filters - one for orders and one for statistics
//     // For orders, we'll apply all filters (date, status, search)
//     // For statistics, we'll only use the date filter

//     // Date filter applied to both orders and statistics
//     const dateFilter = { "orderStatuses.date": { $gte: start.toISOString(), $lte: end.toISOString() } };

//     // Status and search filters only applied to orders query
//     let statusFilter: Record<string, any> = {};
//     if (orderStatus) {
//       statusFilter["orderStatusState"] = orderStatus as string;
//     }

//     let searchFilter: Record<string, any> = {};
//     if (typeof searchText === "string" && searchText.trim()) {
//       searchFilter = {
//         "orderItems.productTitle": { $regex: searchText.trim(), $options: "i" }
//       };
//     }

//     // Combine filters for the orders query
//     const ordersFilter = { ...dateFilter, ...statusFilter, ...searchFilter };

//     // Fetch orders with all filters applied
//     const [orders, totalFilteredProducts] = await Promise.all([
//       Order.find(ordersFilter)
//         .sort("-createdAt")
//         .populate("user", "profile")
//         .skip(skip)
//         .limit(limit),
//       Order.countDocuments(ordersFilter)
//     ]);

//     // Total products in the current page
//     const currentPageTotalProducts = orders.length;

//     // Calculate pagination metadata based on filtered results
//     const totalPages = Math.ceil(totalFilteredProducts / limit);
//     const hasNextPage = parsedPage < totalPages;
//     const hasPreviousPage = parsedPage > 1;

//     // --------------------------------------------- order stats ----------------------------------------

//     // Helper function for status counts - using only the date filter
//     const getStatusCounts = async (start: Date, end: Date) => {
//       try {
//         const pipeline: PipelineStage[] = [
//           // Unwind the entire orderStatuses array
//           { $unwind: "$orderStatuses" },

//           // Match statuses within the date range (no status filter)
//           {
//             $match: {
//               "orderStatuses.date": {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           },

//           // Group by status
//           {
//             $group: {
//               _id: "$orderStatuses.status",
//               count: { $sum: 1 },
//               orderIds: { $addToSet: "$_id" }
//             }
//           },

//           // Sort by count
//           {
//             $sort: { count: -1 }
//           }
//         ];

//         // Execute the aggregation
//         const statusCounts = await Order.aggregate(pipeline);

//         // Convert to a more usable format
//         const counts: Record<string, number> = {};
//         statusCounts.forEach(status => {
//           counts[status._id] = status.count;
//         });

//         console.log(' Detailed Status Counts:', JSON.stringify(counts, null, 2));
//         console.log('Status Aggregation Full Details:', JSON.stringify(statusCounts, null, 2));

//         return counts;
//       } catch (error) {
//         console.error('Error calculating status counts:', error);
//         return {};
//       }
//     };

//     const getPlacedOrderCount = async (startDate: Date, endDate: Date) => {
//       try {
//         const pipeline = [
//           {
//             $match: {
//               "orderStatuses": {
//                 $elemMatch: {
//                   status: "placed",
//                   date: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                   }
//                 }
//               }
//             }
//           },
//           {
//             $count: "placedOrdersCount"
//           }
//         ];

//         const result = await Order.aggregate(pipeline);
//         console.log('########### result is', result)
//         return result.length > 0 ? result[0].placedOrdersCount : 0;
//       } catch (error) {
//         console.error("Error fetching placed orders count:", error);
//         return 0;
//       }
//     };

//     // Comprehensive debugging function - using only date filter
//     const thoroughStatusDebug = async (start: Date, end: Date) => {
//       try {
//         // Find all orders with statuses in the date range (no status filter)
//         const orders = await Order.find({
//           "orderStatuses": {
//             $elemMatch: {
//               date: {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           }
//         });

//         console.log('Total Orders in Range:', orders.length);

//         // Detailed status tracking
//         const statusTracker: Record<string, number> = {};

//         orders.forEach(order => {
//           console.log('Order ID:', order._id);
//           console.log('Full Order Statuses:', order.orderStatuses);

//           // Track all statuses in the date range
//           order.orderStatuses.forEach((status: any) => {
//             const statusDate = new Date(status.date);
//             if (statusDate >= start && statusDate <= end) {
//               console.log(`Status Found: ${status.status}, Date: ${status.date}`);
//               statusTracker[status.status] = (statusTracker[status.status] || 0) + 1;
//             }
//           });
//         });

//         console.log('Comprehensive Status Tracking:', statusTracker);
//         return statusTracker;
//       } catch (error) {
//         console.error('Thorough Debug Error:', error);
//         return {};
//       }
//     };

//     // Modified status changes calculation
//     const calculateStatusChanges = (currentCounts: Record<string, number>, previousCounts: Record<string, number>, statuses: string[]) => {
//       return statuses.map((status) => {
//         const currentInterval = currentCounts[status] || 0;
//         const previousInterval = previousCounts[status] || 0;
//         const difference = currentInterval - previousInterval;
//         const growth = previousInterval === 0
//           ? (currentInterval > 0 ? 100 : 0)
//           : Math.round(((currentInterval - previousInterval) / previousInterval) * 100);

//         return {
//           status,
//           currentInterval,
//           previousInterval,
//           difference,
//           growth
//         };
//       });
//     };

//     // Get the total count of all orders in the date range for statistics
//     const totalOrdersInDateRange = await Order.countDocuments(dateFilter);

//     // Usage in your controller - using only date filter for statistics
//     const thoroughDebug = await thoroughStatusDebug(start, end);
//     const currentCounts = await getStatusCounts(start, end);
//     const previousCounts = await getStatusCounts(previousStart, previousEnd);

//     // Use all possible statuses from both current and previous counts
//     const allStatuses = Array.from(new Set([
//       ...Object.keys(currentCounts),
//       ...Object.keys(previousCounts)
//     ]));

//     const statusChangess = calculateStatusChanges(currentCounts, previousCounts, allStatuses);

//     // Debugging function to verify status entries - using only date filter
//     const debugOrderStatuses = async (start: Date, end: Date) => {
//       try {
//         const orders = await Order.find({
//           "orderStatuses": {
//             $elemMatch: {
//               date: {
//                 $gte: start.toISOString(),
//                 $lte: end.toISOString()
//               }
//             }
//           }
//         });

//         console.log('Total Orders in Range:', orders.length);
//         orders.forEach(order => {
//           console.log('Order ID:', order._id);
//           console.log('Full Order Statuses:', order.orderStatuses);

//           // Filter statuses within the date range
//           const filteredStatuses = order.orderStatuses.filter((status: any) => {
//             const statusDate = new Date(status.date);
//             return statusDate >= start && statusDate <= end;
//           });

//           console.log('Filtered Statuses:', filteredStatuses);
//         });
//       } catch (error) {
//         console.error('Debug Error:', error);
//       }
//     };

//     await debugOrderStatuses(start, end);
//     console.log("###########placed########", await getPlacedOrderCount(start, end))

//     // Calculate changes for each status - using independent counts (not filtered by orderStatus)
//     const statuses = ["placed", "processed", "delivered", "cancelled"];

//     const statusChanges = statuses.map((status) => {
//       const currentInterval = currentCounts[status] || 0;
//       const previousInterval = previousCounts[status] || 0;
//       const difference = currentInterval - previousInterval;
//       const growth = previousInterval === 0 ? (currentInterval > 0 ? 100 : 0) : Math.round(((currentInterval - previousInterval) / previousInterval) * 100);
//       return { status, currentInterval, previousInterval, difference, growth };
//     });

//     // Order Statistics - including total across all statuses
//     const orderStatistics = {
//       statusChanges,
//       totalProducts: totalOrdersInDateRange,  // Total orders across all statuses in date range
//       filteredProducts: totalFilteredProducts, // Total orders matching all filters
//       currentPageTotalProducts
//     };

//     // Success response with pagination metadata
//     return res.status(200).json({
//       success: true,
//       message: "Orders fetched successfully",
//       totalProducts: totalFilteredProducts, // This is for the filtered count
//       currentPageTotalProducts,
//       page: parsedPage,
//       totalPages,
//       hasNextPage,
//       hasPreviousPage,
//       orders,
//       orderStatistics
//     });
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error"
//     });
//   }
// });


export const getAllAdminOrders = asyncErrorHandler(async (req, res, next) => {
  // console.log("Order controller called");
  // const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  // console.log(`Incoming request from IP: ${ip} to ${req.originalUrl}`);
  const { startDate, endDate, page = 1, orderStatus, searchText } = req.query;
  const limit = 20;

  // Parse and validate page
  const parsedPage = (page && typeof page === "string") ? parseInt(page, 10) : 1;

  if (isNaN(parsedPage) || parsedPage < 1) {
    return res.status(400).json({ error: "Invalid page value" });
  }
  const skip = (parsedPage - 1) * limit;

  // Helper function for date validation
  const validateDate = (dateStr: string): Date | null => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date : null;
  };

  let start: Date | null = validateDate(startDate as string);
  let end: Date | null = validateDate(endDate as string);

  // Default to one-month range if dates are missing
  if (!start && !end) {
    end = new Date();
    start = new Date();
    start.setMonth(start.getMonth() - 1);
  } else if (!start || !end) {
    return res.status(400).json({ error: "Invalid start or end date provided" });
  }

  // Previous time frame calculation
  const previousEnd = new Date(start);
  const previousStart = new Date(previousEnd);
  previousStart.setMonth(previousStart.getMonth() - 1);

  // Define the structure of `orderStatuses`
  interface OrderStatus {
    status: string;
    date: string;
  }

  type OrderDocument = {
    orderStatuses: OrderStatus[];
    createdAt: Date;
    [key: string]: any;
  };

  try {
    // Create two separate filters - one for orders and one for statistics
    const dateFilter = { "orderStatuses.date": { $gte: start.toISOString(), $lte: end.toISOString() } };

    let statusFilter: Record<string, any> = {};
    if (orderStatus) {
      statusFilter["orderStatusState"] = orderStatus as string;
    }

    let searchFilter: Record<string, any> = {};
    if (typeof searchText === "string" && searchText.trim()) {
      searchFilter = {
        "orderItems.productTitle": { $regex: searchText.trim(), $options: "i" }
      };
    }

    // Combine filters for the orders query
    const ordersFilter = { ...dateFilter, ...statusFilter, ...searchFilter };

    // Fetch orders with all filters applied
    const [orders, totalFilteredProducts] = await Promise.all([
      Order.find(ordersFilter)
        .sort("-createdAt")
        .populate("user", "profile")
        .skip(skip)
        .limit(limit),
      Order.countDocuments(ordersFilter)
    ]);

    // Total products in the current page
    const currentPageTotalProducts = orders.length;

    // Calculate pagination metadata based on filtered results
    const totalPages = Math.ceil(totalFilteredProducts / limit);
    const hasNextPage = parsedPage < totalPages;
    const hasPreviousPage = parsedPage > 1;

    // --------------------------------------------- order stats ----------------------------------------

    // // Comprehensive status tracking function - this is working correctly
    const thoroughStatusDebug = async (start: Date, end: Date) => {
      try {
        // Find all orders with statuses in the date range (no status filter)
        const orders = await Order.find({
          "orderStatuses": {
            $elemMatch: {
              date: {
                $gte: start.toISOString(),
                $lte: end.toISOString()
              }
            }
          }
        });

        console.log('Total Orders in Range:', orders.length);

        // Detailed status tracking
        const statusTracker: Record<string, number> = {};

        orders.forEach(order => {
          console.log('Order ID:', order._id);
          console.log('Full Order Statuses:', order.orderStatuses);

          // Track all statuses in the date range
          order.orderStatuses.forEach((status: any) => {
            const statusDate = new Date(status.date);
            if (statusDate >= start && statusDate <= end) {
              console.log(`Status Found: ${status.status}, Date: ${status.date}`);
              statusTracker[status.status] = (statusTracker[status.status] || 0) + 1;
            }
          });
        });

        console.log('Comprehensive Status Tracking:', statusTracker);
        return statusTracker;
      } catch (error) {
        console.error('Thorough Debug Error:', error);
        return {};
      }
    };

    // Get the total count of all orders in the date range for statistics
    const totalOrdersInDateRange = await Order.countDocuments(dateFilter);
    const totalReadyToShipOrder = await Order.countDocuments({ orderStatusState: 'placed' })
    // Get current and previous period status counts using thoroughStatusDebug
    const currentStatusCounts = await thoroughStatusDebug(start, end);
    const previousStatusCounts = await thoroughStatusDebug(previousStart, previousEnd);

    // Calculate changes for each status - using thoroughStatusDebug results
    const statuses = ["placed", "processed", "delivered", "cancelled"];

    const statusChanges = statuses.map((status) => {
      const currentInterval = currentStatusCounts[status] || 0;
      const previousInterval = previousStatusCounts[status] || 0;
      const difference = currentInterval - previousInterval;
      const growth = previousInterval === 0
        ? (currentInterval > 0 ? 100 : 0)
        : Math.round(((currentInterval - previousInterval) / previousInterval) * 100);

      return {
        status,
        currentInterval,
        previousInterval,
        difference,
        growth
      };
    });

    // Order Statistics object
    const orderStatistics = {
      statusChanges,
      totalProducts: totalOrdersInDateRange,
      filteredProducts: totalFilteredProducts,
      currentPageTotalProducts
    };

    // Success response with pagination metadata
    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      totalProducts: totalFilteredProducts,
      currentPageTotalProducts,
      page: parsedPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      totalReadyToShipOrder,
      orders,
      orderStatistics
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});