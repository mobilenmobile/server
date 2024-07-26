import express from 'express'

import { getPaymentDetails, orderPayment } from '../controllers/payment.controllers'

const paymentRouter = express.Router()

paymentRouter.post("/orderpayment", orderPayment)
paymentRouter.get("/getpaymentdetails/:paymentId", getPaymentDetails)


export default paymentRouter