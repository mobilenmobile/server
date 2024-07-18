import express from 'express'
import { orderPayment } from '../controllers/payment.controllers'
// import { allCoupons, applyDiscount, createPayment, deleteCoupon, newCoupon } from '../controllers/payment.js'

const paymentRouter = express.Router()

paymentRouter.post("/orderpayment", orderPayment)
// paymentRouter.post("/coupon/new",newCoupon)
// paymentRouter.get("/coupon/apply",applyDiscount)
// paymentRouter.get("/coupon/all",allCoupons)

// paymentRouter.delete("/coupon/:id",deleteCoupon)

export default paymentRouter