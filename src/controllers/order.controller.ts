import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Order } from "../models/order/order.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";
import { Review } from "../models/review/review.model.js";
import { IncreaseCoins } from "./coin.controller.js";
import { CoinAccount } from "../models/coins/coinAccount.js";
import { CoinTransaction } from "../models/coins/coinTransaction.js";
import mongoose, { startSession } from "mongoose";
import { ShipRocket } from "../models/shiprocket/shiprocket.model.js";
import { createOrderBody } from "./shiprocket.controller.js";
import axios from "axios";
import productSoldHistory from "../models/product/productSoldHistory.js";
import { User } from "../models/auth/user.model.js";



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
          return {
            order_id: newOrder._id,
            product_id: orderItem._id,
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

        // Use insertMany for better performance but handle validation errors
        try {
          if (productHistoryDocs.length > 0) {
            await productSoldHistory.insertMany(productHistoryDocs, { session });
            console.log("Product sold history created successfully");
          }
        } catch (error) {
          console.error("Error creating product sold history:", error);
          // You might want to log the documents that failed validation
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


//------------- api to create new order-----------------------------------------------------
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
  return res.status(200).json({
    success: true,
    message: "Order details fetched Successfully",
    orderDetails: order,
  });
});

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
  const validStages = [
    "placed",
    "packed",
    "shipped",
    "outfordelivery",
    "delivered"
  ] as const;

  type OrderStage = typeof validStages[number];

  // Type assertion: Ensure that 'stage' is one of the valid stages
  const typedStage = stage as OrderStage;

  if (!validStages.includes(typedStage)) {
    return next(new ErrorHandler("Invalid stage", 400));
  }

  // Add type assertion for currentStage
  const currentStage = orderStatus.status as OrderStage;

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
export const getAllAdminOrders = asyncErrorHandler(async (req, res, next) => {

  // const userId = req.user._id; // Assuming req.user.id contains the user's ID

  // Find all orders for the user
  const orders = await Order.find();

  if (!orders || orders.length === 0) {
    return res.status(404).json({ error: 'No orders found for the user' });
  }

  // placed packed shipped outfordelivery delivered cancelled
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
  orders.sort((a, b) => {
    let lastStatusA = getLastStatus(a);
    let lastStatusB = getLastStatus(b);
    console.log(lastStatusA, lastStatusB)
    // Sort orders based on the index of their last status in statusOrder
    return statusOrder.indexOf(lastStatusA) - statusOrder.indexOf(lastStatusB);
  });

  // console.log(orders)
  // console.log(sortedOrders)
  // res.json(jsonResponse);

  return res.status(200).json({
    success: true,
    message: "order fetched Successfully",
    orders
  });

})


// //api to get order details not needed !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// export const myOrders = asyncErrorHandler(async (req, res, next) => {
//   const { id } = req.query;

//   const orders = await Order.find({ id });

//   return res.status(200).json({
//     success: true,
//     message: "Order Fetched Successfully",
//     orders,
//   });
// });


// export const allOrders = asyncErrorHandler(async (req, res, next) => {
//   const orders = await Order.find({ user: req.user._id })
//     .populate('orderItems')
//   return res.status(200).json({
//     success: true,
//     orders,
//   });
// });