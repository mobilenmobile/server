import { asyncErrorHandler } from "../../middleware/error.middleware";
import { User } from "../../models/auth/user.model";
import { Order } from "../../models/order/order.model";
import ErrorHandler from "../../utils/errorHandler";



export const userOrderAnalytic = asyncErrorHandler(async (req, res, next) => {
    const { userId } = req.params
    console.log(userId)
    const user = await User.findOne({ uid: userId })
    if (!user) return next(new ErrorHandler('User not found', 404))

    const orders = await Order.find({ user: user._id }).select('_id createdAt orderStatusState finalAmount')

    res.status(200).json({
        allOrders: orders,
        totalAmount: orders.reduce((acc, order) => acc + order.finalAmount, 0),
        totalOrders: orders.length,
        totalCompletedOrders: orders.filter(order => order.orderStatusState === 'delivered').length,
    })

})