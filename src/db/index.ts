import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import { Product } from "../models/product/product.model.js";

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
  
  } catch (error) {
    console.log("Mongodb connection error", error);
    process.exit(1);
  }
};


const updateProductSubcategory = async (categoryId:string, subcategoryId:string) => {
  try {
    // Validate inputs
    if (!categoryId || !subcategoryId) {
      throw new Error('Both categoryId and subcategoryId are required');
    }

    // Convert string IDs to ObjectId if they're not already
    const categoryObjectId = mongoose.Types.ObjectId.isValid(categoryId) 
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;
      
    const subcategoryObjectId = mongoose.Types.ObjectId.isValid(subcategoryId)
      ? new mongoose.Types.ObjectId(subcategoryId)
      : subcategoryId;

    // Perform the update
    const result = await Product.updateMany(
      { productCategory: categoryObjectId },
      { 
        $set: { 
          productSubCategory: subcategoryObjectId,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} products`);
    return result;
  } catch (error) {
    console.error('Error updating products:', error);
    throw error;
  }
};


export default connectDB;
