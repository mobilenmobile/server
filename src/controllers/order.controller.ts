import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Order } from "../models/order/order.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";
import { Review } from "../models/review/review.model.js";


// api to create new order
export const newOrder = asyncErrorHandler(
  async (req: Request, res, next) => {

    console.log(req.body)

    const {
      orderItems,
      orderStatuses,
      total,
      couponcode,
      paymentMethod,
      paymentStatus,
      deliveryAddress,
      discount,
    } = req.body;

    if (!deliveryAddress || !orderItems || !total) {
      return next(new ErrorHandler("Please Enter all Fields", 400));
    }

    console.log(JSON.parse(deliveryAddress))

    if (!req.user._id) {
      return next(new ErrorHandler("unauthenticated user", 400));
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: JSON.parse(orderItems),
      orderStatuses: JSON.parse(orderStatuses),
      total,
      couponcode,
      paymentMethod: JSON.parse(paymentMethod),
      paymentStatus,
      deliveryAddress: JSON.parse(deliveryAddress),
      discount,
    });
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  }
);


// //api to get single order details
// export const getSingleOrder = asyncErrorHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const key = `order-${id}`;
//   let order;
//   if (myCache.has(key)) {
//     order = JSON.parse(myCache.get(key) as string);
//   } else {
//     order = await Order.findById(id).populate("user", "name");
//     if (!order) {
//       return next(new ErrorHandler("Order Not Found", 404));
//     }
//     myCache.set(key, JSON.stringify(order));
//   }
//   return res.status(200).json({
//     success: true,
//     message: "Order Fetched Successfully",
//     order,
//   });
// });


//api to process order
export const processOrder = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) {
    return next(new ErrorHandler("order not found", 404));
  }
  console.log(order, "------and---------", order.orderStatuses.length)

  let orderStatus = order.orderStatuses[order.orderStatuses.length - 1]
  console.log(orderStatus)

  if (!orderStatus) {
    return next(new ErrorHandler("status not found", 404));
  }

  switch (orderStatus.status) {
    case "pending":
      order.orderStatuses.push({
        date: new Date(),
        status: 'packed'
      });
      break;
    case "placed":
      order.orderStatuses.push({
        date: new Date(),
        status: 'packed'
      });
      break;
    case "packed":
      order.orderStatuses.push({
        date: new Date(),
        status: 'shipped'
      });
      break;
    case "shipped":
      order.orderStatuses.push({
        date: new Date(),
        status: 'outfordelivery'
      });
      break;
    case "outfordelivery":
      order.orderStatuses.push({
        date: new Date(),
        status: 'delivered'
      });
      break;
    case "delivered":
      break;
    // default:
    //   order.orderStatuses.push({
    //     date: new Date(),
    //     status: 'delivered'
    //   });
    //   break;
  }
  await order.save();
  return res.status(200).json({
    success: true,
    message: "Order processed Successfully",
  });
});



//api to cancell order
export const cancellOrder = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) {
    return next(new ErrorHandler("order not found", 404));
  }
  
  order.orderStatuses.push({
    date: new Date(),
    status: 'cancelled'
  });

  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order Cancelled Successfully",
  });
});


//api to delete order
export const deleteOrder = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(new ErrorHandler("order not found", 404));
  }
  await order.deleteOne();
  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});


//api to get all orders for the user logged in 
export const getAllOrders = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id; // Assuming req.user.id contains the user's ID

  // Find all orders for the user
  const orders = await Order.find({ user: userId });

  if (!orders || orders.length === 0) {
    return res.status(404).json({ error: 'No orders found for the user' });
  }

  // Create an array to store promises for fetching reviews for all items in all orders
  const reviewPromises = orders.map(async (order) => {
    const orderId = order._id;

    // Fetch reviews for all items in the current order
    const orderItemsWithReviews = await Promise.all(order.orderItems.map(async (item: any) => {
      const productId = item.product;

      // Find reviews based on userId and productId
      const reviews = await Review.find({
        reviewUser: userId,
        reviewProduct: productId
      });

      // Return an object with item details and associated reviews
      return {
        item,
        reviews: reviews
      };
    }));

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

  // res.json(jsonResponse);
  return res.status(200).json({
    success: true,
    message: "order fetched Successfully",
    orders: ordersWithReviews
  });

})


//api to get all orders
export const getAllAdminOrders = asyncErrorHandler(async (req, res, next) => {

  const userId = req.user._id; // Assuming req.user.id contains the user's ID

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



// //api to get order details
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