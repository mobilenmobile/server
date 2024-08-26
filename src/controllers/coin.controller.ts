import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { CoinAccount } from "../models/coins/coinAccount";
import { CoinTransaction } from "../models/coins/coinTransaction";
import ErrorHandler from "../utils/errorHandler";
import mongoose, { ObjectId } from "mongoose";
import { Timestamp, Transaction } from "firebase-admin/firestore";



const createNewCoinAccount = async (userId: any) => {
    // Create a new coin account for the user

    const exisitingCoinAccount = await CoinAccount.find({ userId: userId })
    if (exisitingCoinAccount) {
        throw new Error('Account already exist');
    }

    const coinAccount = await CoinAccount.create({
        userId: userId,
        coinAccountBalance: 1000  // Initial number of coins
    });

    // await coinAccount.save();
    return coinAccount

}

//-----------------Api to get all brand---------------------------------------------
export const getCoinAccount = asyncErrorHandler(
    async (req: Request, res, next) => {
        const coinAccountData = await CoinAccount.find({ userId: req.user._id })
        const coinAccountTransaction = await CoinTransaction.find({ userId: req.user._id }).populate("orderId")

        if (!coinAccountData) {
            return res.status(404).json({ message: "Coin account not found" });
        }

        console.log("-------------------------------- coin account transaction-------------------------", coinAccountTransaction)

        const transactionData = coinAccountTransaction?.map((transaction: any) => {
            if (transaction.orderId) {
                console.log("----------------------------------------entering orderid----------------------------------------------")
                console.log(transaction.orderId.orderItems)
                console.log("----------------------------------------entering orderid----------------------------------------------")

                const orderData = transaction.orderId?.orderItems?.map((productData: any) => {
                    return {
                        title: productData.productTitle,
                        thumbnail: productData.thumbnail
                    }
                })


                return {
                    _id: transaction._id,
                    notes: transaction.notes,
                    rewardType: transaction.rewardType,
                    amountSpent: transaction.amountSpent,
                    amountReceived: transaction.amountReceived,
                    timestamp: transaction.timestamp,
                    orderData
                }

            }
            return transaction
        })

        console.log("-------coinaccount-----", transactionData)
        const coinAccountCreditTransaction = transactionData.filter((Transaction: { amountReceived: number }) => Transaction.amountReceived > 0)
        const coinAccountRedeemedTransaction = transactionData.filter((Transaction: { amountSpent: number }) => Transaction.amountSpent > 0)

        return res.status(200).json({
            success: true,
            message: "coin Account feteced successfully",
            coinAccountData,
            coinAccountCreditTransaction,
            coinAccountRedeemedTransaction
            // coinAccountTransaction
        });
    }
);
//-----------------Api to get all brand---------------------------------------------
export const setUseCoinBalance = asyncErrorHandler(
    async (req: Request, res, next) => {

        const { coinforpayment } = req.body

        console.log('Received coinforpayment:', req.body, coinforpayment);
        console.log('Type of coinforpayment:', typeof coinforpayment);

        if (typeof coinforpayment !== 'boolean') {
            return res.status(400).json({ message: 'Send only boolean data' });
        }

        const coinAccountData = await CoinAccount.findOne({ userId: req.user._id })

        if (!coinAccountData) {
            return res.status(404).json({ message: "Coin account not found" });
        }

        coinAccountData.useCoinForPayment = coinforpayment

        await coinAccountData.save()

        return res.status(200).json({
            success: true,
            message: `coin ${coinAccountData.useCoinForPayment ? 'is now usable for payment' : 'is now not usable for payment'}`,
            // coinAccountTransaction
        });
    }
);


export const IncreaseCoins = async (userId: any, rewardType: string, orderId: string, coinsTobeAdded: number) => {
    // Start a session for transaction management
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log("-------------------------------------------------------------------------------")
    console.log(orderId)
    console.log("-------------------------------------------------------------------------------")
    try {
        // Find the existing coin account or create a new one if not found
        let coinAccount = await CoinAccount.findOne({ userId: userId }).session(session);

        if (!coinAccount) {
            // Create a new coin account if it doesn't exist
            coinAccount = new CoinAccount({ userId, coinAccountBalance: 0 });
            await coinAccount.save({ session });
        }

        // Update the coin account balance
        coinAccount.coinAccountBalance += coinsTobeAdded;
        await coinAccount.save({ session });

        console.log("rewardType:----->", rewardType)

        // Create a new transaction record
        const transaction = new CoinTransaction({
            userId,
            orderId: orderId !== "signup" ? orderId : null,
            rewardType: rewardType,
            amountSpent: 0,
            amountReceived: coinsTobeAdded,
            notes: `${rewardType}`
        });

        await transaction.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        console.log("Transaction successfully completed:", transaction);
    } catch (error) {
        // Abort the transaction in case of an error
        await session.abortTransaction();
        session.endSession();

        console.error("Error processing transaction:", error);
        throw error;
    }
};


export const ReduceCoins = async (userId: any, rewardType: string, orderId: string, coinsTobeReduced: number) => {
    // Start a session for transaction management
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the existing coin account or create a new one if not found
        let coinAccount = await CoinAccount.findOne({ userId: userId }).session(session);

        if (!coinAccount) {
            // Create a new coin account if it doesn't exist
            coinAccount = new CoinAccount({ userId, coinAccountBalance: 0 });
            await coinAccount.save({ session });
        }

        // Update the coin account balance
        coinAccount.coinAccountBalance -= coinsTobeReduced;
        await coinAccount.save({ session });

        console.log("rewardType:----->", rewardType)

        // Create a new transaction record
        const transaction = new CoinTransaction({
            userId,
            orderId,
            rewardType: rewardType,
            amountSpent: coinsTobeReduced,
            amountReceived: 0,
            notes: 'Coins reduced for purchase'
        });

        await transaction.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        console.log("Transaction successfully completed:", transaction);
    } catch (error) {
        // Abort the transaction in case of an error
        await session.abortTransaction();
        session.endSession();

        console.error("Error processing transaction:", error);
        throw error;
    }
};




