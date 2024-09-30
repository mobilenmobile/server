import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody {
  name: string;
  email: string;
  uid: string;
  photo?: string;
  gender?: string;
  role?: string;
  phoneNumber?: string
  password: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

//variance data type
export type varianceType = {
  id?: string;
  color?: string;
  ram?: string;
  boxPrice?: string;
  sellingPrice?: string;
  quantity?: string;
  thumbnail?: string;
  productImages?: string[];
};

export interface NewProductRequestBody {
  category: string;
  subcategory?: string;
  brand: string;
  productModel: string;
  productTitle: string;
  boxPrice: string;
  stockAvailability: string;
  discountedPercentage: string;
  color: string;
  review?: string;
  description: string;
  RAM: string;
  storage: string;
  pattern: string;
  headsetType: string;
  imgUrls: string;
  thumbnail: string;
  sellingPrice: string;
  productBadge: string;
  offers: string;
  uniqueId: string;
  variance: string;
  colors: string;
  ramAndStorage: string;
  comboProducts: string;
  freeProducts: string;
  selectedComboCategory: string,
  selectedFreeCategory: string,
  productVideoUrls: string,
  skinSelectedItems: string,
  // productType: string;
}

export interface verifyAdminReqBody {
  email: string;
  password: string;
}
export interface UpdateProductRequestBody {
  productTitle: string;
  productModel: string;
  boxPrice: string;
  sellingPrice: string;
  productBadge: string;
  offers: string;
  stockAvailability: string;
  imgUrls: string[];
  thumbnail: string;
  category: string;
  colors: string
  brand: string;
  discountedPercentage: string;
  color: string;
  review: string;
  description: string;
  RAM: string;
  storage: string;
  pattern: string;
  headsetType: string;
  productType: string;
  variance: string;
  comboOfferProducts: string,
  freeOfferProducts: string,
  selectedComboCategory: string,
  selectedFreeCategory: string,
  productVideoUrls: string,
  skinSelectedItems: string,
}

export interface updateId {
  id: string;
}

export interface NewBrandRequestBody {
  brandName: string;
  brandImgUrl: string;
  brandLogoUrl: string;
}
export interface NewSkinBody {
  skinBrand?: string;
  skinModel?: string;
}

export interface NewCategoryRequestBody {
  categoryName: string;
  categoryImgUrl: string;
  categoryDescription: string;
  categoryKeywords: string;
}

export interface NewOfferRequestbody {
  offerCouponCode: string;
  offerCouponDiscount: string;
  offerExpiry: string;
}

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export type SearchBrandRequestQuery = {
  brandName?: string;
};

export type SearchCategoryQuery = {
  categoryName?: string;
};
export type deleteCategoryQuery = {
  id?: string;
  categoryId?: string;
};
export type deleteBrandQuery = {
  id?: string;
};

export type SearchOfferQuery = {
  offerName?: string;
  offerDescription?: string;
};

export interface BaseQuery {
  productTitle?: {
    $regex: string;
    $options: string;
  };
  productModel?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
}

export interface brandBaseQuery {
  brandName?: {
    $regex: string;
    $options: string;
  };
}
export interface CategoryBaseQuery {
  categoryName?: {
    $regex: string;
    $options: string;
  };
  _id?: string;
}

export interface offerBaseQuery {
  offerCode?: {
    $regex: string;
    $options: string;
  };
  offerDescription?: {
    $regex: string;
    $options: string;
  };
}

export type ClearCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
};

export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
}
