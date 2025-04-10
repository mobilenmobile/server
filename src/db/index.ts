import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import { Product } from "../models/product/product.model.js";
import { User } from "../models/auth/user.model.js";
import { logger } from "../logger.js";

//---------- connect to mongodb database--------------

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(
      `\n mongoDb connected !! DB Host ${connectionInstance.connection.host}`
    );

    // updateProductSubcategory("6710c6b578cda963664cb012","67d914cfdc31c2998f01db5d")
    // updateUserRole('67f0f026526937c5ef6d5823','67245191ce1c9fdf5de1ab21')
  
  } catch (error) {
    // console.log("Mongodb connection error", error);
    logger.error("Mongodb connection error", error)
    process.exit(1);
  }
};


const updateUserRole = async (userId: string, roleId: string) => {
  try {
    // Validate inputs
    if (!userId || !roleId) {
      throw new Error('Both userId and roleId are required');
    }
    
    // Convert string IDs to ObjectId if they're not already
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
        
    const roleObjectId = mongoose.Types.ObjectId.isValid(roleId)
      ? new mongoose.Types.ObjectId(roleId)
      : roleId;
    
    // Perform the update
    const result = await User.findByIdAndUpdate(
      userObjectId,
      {
        $set: {
          role: roleObjectId,
          updatedAt: new Date()
        }
      },
      { new: true } // This returns the updated document
    );
    
    console.log(`Updated role for user ${userId}`);
    return result;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};


export default connectDB;
