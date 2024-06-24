import { rm as removeFile } from "fs";
import { asyncErrorHandler } from "../middleware/error.middleware.js";
import { Order } from "../models/order/order.model.js";
import { NewOrderRequestBody, } from "../types/types.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Request } from "express";
import { myCache } from "../app.js";
import { ClearCache, reduceStock } from "../utils/features.js";
import mongoose from "mongoose";

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

export const myOrders = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.query;
  const key = `my-orders-${id}`;
  let orders = [];
  if (myCache.has(key)) {
    orders = JSON.parse(myCache.get(key) as string);
  } else {
    orders = await Order.find({ id });
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    message: "Order Fetched Successfully",
    orders,
  });
});

export const allOrders = asyncErrorHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('orderItems')
  return res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;
  let order;
  if (myCache.has(key)) {
    order = JSON.parse(myCache.get(key) as string);
  } else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) {
      return next(new ErrorHandler("Order Not Found", 404));
    }
    myCache.set(key, JSON.stringify(order));
  }
  return res.status(200).json({
    success: true,
    message: "Order Fetched Successfully",
    order,
  });
});

export const processOrder = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(new ErrorHandler("order not found", 404));
  }
  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }
  await order.save();

  await ClearCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
  });
  return res.status(200).json({
    success: true,
    message: "Order processed Successfully",
  });
});
export const deleteOrder = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(new ErrorHandler("order not found", 404));
  }

  await order.deleteOne();

  await ClearCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });
  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});

