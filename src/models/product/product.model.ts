import mongoose, { Schema } from "mongoose";

// export interface RamAndStorage {
//   id: {
//     type: String,
//     required: true,
//   },
//   ram: {
//     type: String,
//     required: true,
//   },
//   storage: {
//     type: String,
//     required: true,
//   },
// }


const RamAndStorage = new Schema(
  {
    id: {
      type: String,
    },
    ram: {
      type: String,
    },
    storage: {
      type: String,
    },
  }
);

//variance data type
const varianceType = new Schema({
  id: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  ramAndStorage: {
    type: [RamAndStorage],
    required: true,
  },
  boxPrice: {
    type: String,
    required: true,
  },
  sellingPrice: {
    type: String,
    required: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  productImages: {
    type: [String],
    required: true,
  },
})

// export interface IProduct {
//   productTitle: {
//     type: String,
//     required: true,
//   },
//   productCategory: {
//     type: String,
//     required: true,
//   },
//   productBrand: string,
//   productModel: string,
//   productDescription: string,
//   productSkinPattern: string,
//   productHeadsetType: string,
//   productVariance: varianceType[]
//   productColors: string[]
//   productRamAndStorage: RamAndStorage[]
//   productRating: number
//   productNumReviews: number
// }

const productSchema = new Schema(
  {
    productTitle: {
      type: String,
    },
    productCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "product category is required"],
    },

    productBrand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "product brand is required"],
    },

    productModel: {
      type: String,
      required: [true, "product model is required"],
    },
    productDescription: {
      type: String,
    },
    productSkinPattern: {
      type: String,
    },
    productHeadsetType: {
      type: String,
    },
    productVariance: {
      type: [varianceType],
    },
    productColors: {
      type: [String]
    },
    productRamAndStorage: {
      type: [RamAndStorage]
    },
    productRating: {
      type: Number,
      default: 0
    },
    productNumReviews: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.models.product || mongoose.model("product", productSchema);

export { Product };
