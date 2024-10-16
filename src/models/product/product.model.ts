import mongoose, { Schema } from "mongoose";

const RamAndStorage = new Schema({
  id: {
    type: String,
  },
  ram: {
    type: String,
  },
  storage: {
    type: String,
  },
});

// Variance data type
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
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  comboPrice: {
    type: Number,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
  },
  videoUrl: {
    type: String,
    default: ''
  },
  colorHexCode: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    required: true,
  },
  productImages: {
    type: [String],
    required: true,
  },
});

const ComboProducts = new Schema({
  productTitle: {
    type: String,
    default: ""
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
  },
  comboPrice: {
    type: Number,
    default: 0
  }
});

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
    productSubCategory: {
      type: String,
      default: ''
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
    },
    productComboProducts: {
      type: [ComboProducts],
      default: []
    },
    productFreeProducts: {
      type: [ComboProducts],
      default: []
    },
    productSelectedComboCategory: {
      type: [String],
      default: []
    },
    productSelectedFreeCategory: {
      type: [String],
      default: []
    },
    productVideoUrls: {
      type: [String],
      default: []
    },
    ProductSkinSelectedItems: {
      type: [String],
      default: []
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },

    // New fields for dimensions and weight
    length: {
      type: Number,
      required: true,
    },
    breadth: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to set comboPrice to sellingPrice if not provided
productSchema.pre('save', function (next) {
  if (!this.productVariance) return next();

  this.productVariance.forEach(variant => {
    if (!variant.comboPrice && variant.sellingPrice) {
      variant.comboPrice = variant.sellingPrice;
    }
  });

  next();
});

const Product = mongoose.models.product || mongoose.model("product", productSchema);

export { Product };
