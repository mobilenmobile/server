import { NextFunction, Request, Response } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { NewUserRequestBody } from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import { User } from "../models/auth/user.model";
import { Product } from "../models/product/product.model";
import { Wishlist } from "../models/wishlist/wishlist.model";
import { cart } from "../models/cart/cart.model";
import { Offer } from "../models/offer/offer.model";
import { calculateDiscount } from "./product.controllers";
import { deleteUser, updateFirebaseProfile } from "../db/firebase";
import { IncreaseCoins } from "./coin.controller";
import { PipelineStage } from "mongoose";
import { CoinAccount } from "../models/coins/coinAccount";
import { Role } from "../models/userRoleModel";



//------------------------xxxxxx List-Of-Apis xxxxxxxxx-------------------

// ########## User controllers ##########

// 1.newUser
// 2.checkIfUserExist
// 3.finduser
// 4.getUser
// 5.updateRole
// 6.updateProfile
// 7.updateProfileImage

// ########### user admin controllers ############

// 1.list all users
// 2. change user roles

// ######### coupon related controllers #######

// 1.updateCouponCode
// 2.getAppliedCoupon
// 3.removeCouponCode


// ############ wishlist related controllers ###########

// 1.updateWishlist
// 2.getWishlistItems
// 3.removeWishlistItem

// ########## cart related controllers ######################

// 1.updateCart
// 2.decreaseCartProductQuantity
// 3.getCartItems
// 4.removeCartItem
// 5.remove combo item
// 6.remove free item
// 7.getCartDetails
// 8.get unauthenticated cart details
// 9.store cart items in db
// 10.clearCart

//----------------------xxxxxx List-Of-Apis-End xxxxxxxxx-------------------------


//------------------------api to create new user----------------------------------
export const newUser = asyncErrorHandler(
  async (req: Request<{}, {}, NewUserRequestBody>, res, next) => {
    const { name, uid, email, phoneNumber, platform } = req.body;
    console.log("creating new user ------------->", req.body)
    if (!email || !uid) {
      return next(new ErrorHandler("please provide email and uid", 400));
    }

    // const userExist = await User.findOne({ email });
    const userExist = await User.findOne({
      $or: [{ email }, { phoneNumber }]
    });


    if (userExist) {
      return res
        .status(200)
        .json({ success: false, message: `email or mobile no already used` });
    }

    let customerRole = await Role.findOne({ roleName: 'Customer' });

    if (!customerRole) {
      customerRole = await Role.create({
        roleName: 'Customer',
        permissions: [], // Define minimal or no permissions for the "Customer" role
        isDefault: true,
      });
    }

    const profileData = {
      profileImageUrl: "/defaultprofileimage.png",
      profileName: name ?? "",
      profileEmailId: email ?? "",
      profilePhoneNo: phoneNumber ?? "",
      profileGender: "",
      profileLocation: "",
      profileAlternateMobileNo: ""
    }

    const userData = {
      name: name ? name : "",
      uid,
      email,
      phoneNumber,
      profile: profileData,
      platform: platform ?? 'mnm',
      role: customerRole._id,
    };


    const user = await User.create(userData);
    if (!user._id) {
      // console.log("failed to store user data")
      deleteUser(uid)
      return res.status(200).json({
        success: false,
        message: `error while signing up`,
        user
      });

    }
    module.exports = Role; module.exports = Role;
    // userId: string, rewardType: string, orderId: string, coinsTobeAdded: number

    await IncreaseCoins(user._id, "signupBonus", "signup", 200)

    return res.status(200).json({
      success: true,
      message: `welcome ${name} to mnm`,
      user
    });
  }
);

export const checkIfUserExist = asyncErrorHandler(
  async (req: Request<{}, {}, { phoneNumber: string }>, res: Response, next: NextFunction) => {
    const { phoneNumber } = req.body;

    // Validate phone number format (must be a 10-digit numeric string)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. It must be a 10-digit numeric string.",
      });
    }

    // Check if the phone number exists in the database
    const user = await User.findOne({ phoneNumber });


    return res.status(200).json({
      success: true,
      userExist: !!user, // Returns true if user exists, false otherwise,
      step: user ? "login" : "signup",
      mobileNumber: phoneNumber
    });
  }
);

// -------------------------- find user--------------------------------------------------------------------
export const findUser = asyncErrorHandler(
  async (req: Request<{}, {}, { email?: string; phoneNumber?: string }>, res: Response, next: NextFunction) => {
    const { email, phoneNumber } = req.body;
    console.log("find user called")
    console.log(req.body)

    if (!email && !phoneNumber) {
      return next(new ErrorHandler("Please provide either email or phone number", 400));
    }

    const query: { [key: string]: string } = {};
    if (email) query.email = email;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  }
);

//------------------------api to get user details ----------------------------------
export const getUser = asyncErrorHandler(async (req: Request, res, next) => {
  const uid = req.params.uid;

  const user = await User.findOne({ uid }).populate('role').populate("coupon")

  if (!user) {
    return next(new ErrorHandler("user doesnt exist", 400));
  }
  console.log("user==>", user)

  return res.status(200).json({
    success: true,
    message: "successfully fetched user details",
    user
  });
});

export const updateRole = asyncErrorHandler(async (req, res, next) => {
  const { userId, roleId } = req.body;

  const user = await User.findById(userId)
  if (!user) {
    return res.json({ success: false, message: "no user " })
  }


  const role = await Role.findById(roleId)
  if (!role) {
    return res.json({ success: false, message: "no role found" })
  }

  user.role = role._id;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Successfully updated profile",
    userData: user
  });
});

export const updateProfile = asyncErrorHandler(async (req, res, next) => {
  const { profile } = req.body;

  console.log("req body", profile)

  if (!profile) {
    return next(new ErrorHandler("please provide all fields", 400));
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }


  // Parse profile only if it is provided
  const profileData = profile ? JSON.parse(profile) : {};
  // if(profileData =)
  user.phoneNumber = profileData.profilePhoneNo

  // Retain previous values and update only the provided fields
  if (profileData.profileName) {
    user.profile.profileName = profileData.profileName;
    user.name = profileData.profileName
  }
  if (profileData.profilePhoneNo) {
    user.profile.profilePhoneNo = profileData.profilePhoneNo;
  }
  if (profileData.profileImageUrl) {
    user.profile.profileImageUrl = profileData.profileImageUrl;
  }
  if (profileData.profileGender) {
    user.profile.profileGender = profileData.profileGender;
  }
  if (profileData.profileLocation) {
    user.profile.profileLocation = profileData.profileLocation;
  }
  if (profileData.profileAlternateMobileNo) {
    user.profile.profileAlternateMobileNo = profileData.profileAlternateMobileNo;
  }
  // The email is retained as it is
  user.profile.profileEmailId = user.profile.profileEmailId;

  // Optionally update Firebase if profileName or profileImageUrl is changed
  if (profileData.profileName || profileData.profileImageUrl || profileData.profilePhoneNo) {
    await updateFirebaseProfile(req.user.uid,
      profileData.profileName || user.profile.profileName,
      profileData.profileImageUrl || user.profile.profileImageUrl,
      profileData.profilePhoneNo || user.profile.profilePhoneNo
    );
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Successfully updated profile",
    userData: user
  });
});

//---------------------api to update profile image-------------------------------------------
export const updateProfileImage = asyncErrorHandler(async (req, res, next) => {
  const { profileImageUrl } = req.body
  if (!profileImageUrl) {
    return next(new ErrorHandler("enter profile image url", 404));
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }
  user.profile.profileImageUrl = profileImageUrl
  await user.save();

  // console.log(user.profile)
  return res.status(200).json({
    success: true,
    message: "Successfully changed user profile image url",
    profileImageUrl
  });
});


// =============================== admin panel======================================


export const listAllUsers = asyncErrorHandler(async (req, res, next) => {
  const { name, platform, page = '1', export: exportFlag } = req.query;
  const isExport = exportFlag === 'true';

  let limit = 10;
  const pageNumber = Number(page);
  const skip = (pageNumber - 1) * limit;

  // Construct query filters with an explicit type for dynamic properties
  const query: Record<string, any> = {};

  if (platform) {
    query.platform = platform;
  }
  if (name) {
    query.name = { $regex: name, $options: 'i' };
  }

  // Exclude users with role "admin"
  const adminRole = await Role.findOne({ roleName: 'admin' });
  if (adminRole) {
    query.role = { $ne: adminRole._id };
  }

  // Build the aggregation pipeline
  const aggregationPipeline: PipelineStage[] = [
    { $match: query } as PipelineStage,
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleInfo',
      },
    } as PipelineStage,
    { $unwind: '$roleInfo' } as PipelineStage,
    {
      $addFields: {
        sortOrder: {
          $switch: {
            branches: [
              { case: { $eq: ['$roleInfo.roleName', 'editor'] }, then: 1 },
              { case: { $eq: ['$roleInfo.roleName', 'customer'] }, then: 2 },
            ],
            default: 3,
          },
        },
      },
    } as PipelineStage,
    { $sort: { sortOrder: 1 } } as PipelineStage,
    {
      $project: {
        uid: 1,
        _id: 1,
        name: 1,
        platform: 1,
        profile: 1,
        email: 1,
        phoneNumber: 1,
        role: '$roleInfo.roleName',
      },
    } as PipelineStage,
  ];

  // Apply pagination if export is false
  if (!isExport) {
    aggregationPipeline.push({ $skip: skip } as PipelineStage, { $limit: limit } as PipelineStage);
  }

  // Fetch users using the aggregation pipeline
  const users = await User.aggregate(aggregationPipeline);

  if (!users || users.length === 0) {
    return res.status(200).json({
      success: false,
      message: 'No user found',
      users: [],
    });
  }

  // If export is true, skip pagination info and return all users
  if (isExport) {
    return res.status(200).json({
      success: true,
      message: 'Successfully exported all users',
      users,
    });
  }

  // Get the total count of users for pagination
  // const totalUsers = await User.countDocuments(query);
  // Count only users with platform "mnm" for pagination
  const totalUsers = await User.countDocuments({ ...query, platform: 'mnm' });
  const totalPages = Math.ceil(totalUsers / limit);

  // Respond with users and pagination info
  return res.status(200).json({
    success: true,
    message: 'Successfully fetched users',
    users,
    pagination: {
      totalUsers,
      totalPages,
      currentPage: pageNumber,
      limitPerPage: limit,
    },
  });
});


export const changeUserRole = asyncErrorHandler(async (req, res, next) => {
  const { userId, newRoleId } = req.body;

  const user = await User.findOne({ uid: userId })
  console.log("user", user)
  if (!user) {
    return next(new ErrorHandler("No User found", 400))
  }

  const newRole = await Role.findById(newRoleId)

  if (!newRole) {
    return next(new ErrorHandler("Invalid role provided", 400))
  }

  user.role = newRole._id;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "User role updated successfully",
    updatedUser: user,
  });
});


// ________________________ coupon related controllers _________________________________


export const updateCouponCode = asyncErrorHandler(async (req, res, next) => {
  const { couponId } = req.body;
  if (!couponId) {
    return next(new ErrorHandler("Enter coupon code", 404));
  }

  const currentDate = new Date();

  const couponCode = await Offer.findOne({
    _id: couponId,
    offerIsActive: true,
    offerStartDate: { $lte: currentDate },
    offerEndDate: { $gte: currentDate }
  });

  if (!couponCode) {
    return next(new ErrorHandler("Coupon is expired", 404));
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("No user found by this ID", 404));
  }

  user.coupon = couponId;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Successfully added coupon",
  });
});

//-------------------api to get applied coupon code for cart--------------------------------------------------
export const getAppliedCoupon = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("coupon")
  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }
  if (!user.coupon) {
    return next(new ErrorHandler("No coupon found", 204));
  }
  return res.status(200).json({
    success: true,
    message: "Successfully fetched coupon",
    coupon: user.coupon || []
  });
});

//-------------------api remove coupon code for cart--------------------------------------------
export const removeCouponCode = asyncErrorHandler(async (req, res, next) => {

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("No user found by this id", 404));
  }

  user.coupon = null

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Successfully removed coupon",
  });
});


// ############### Wishlist controllers ############################

//---------------------api to update wislist----------------------------------------------------
export const updateWishlist = asyncErrorHandler(async (req, res, next) => {

  const { productId, selectedVarianceId } = req.body

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("please enter all fields", 404));
  }


  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("No product found with this id", 404));
  }

  const existingItem = await Wishlist.findOne({ user: req.user._id, productId, selectedVarianceId });
  if (existingItem) {
    return next(new ErrorHandler("This combination already exists in the wishlist.", 404));
  }

  const wishlist = await Wishlist.create({
    user: req.user._id,
    productId,
    selectedVarianceId
  })

  return res.status(200).json({
    success: true,
    message: "Successfully added wishlist item",
    wishlist
  });

});

//----------------- api to get wishlist items -----------------------------------------------------------
export const getWishlistItems = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  const wishlistItems = await Wishlist.find({ user: req.user._id }).populate("productId");

  // console.log("-------------wishlistitems--------------", wishlistItems)
  const wishlistItemsData = wishlistItems.map((item) => {
    if (item?.productId?.productVariance) {
      const variantData = item?.productId?.productVariance?.find((variant: any) => {
        if (variant.id.replace(/\s+/g, "") == item.selectedVarianceId) {
          return variant
        }
      })
      // console.log("variantData", variantData)
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
      return {
        _id: item._id,
        productId: item.productId._id,
        selectedVarianceId: item.selectedVarianceId,
        productTitle: item.productId.productTitle,
        thumbnail: variantData?.thumbnail || '',
        boxPrice: variantData?.boxPrice || '',
        sellingPrice: variantData?.sellingPrice || '',
        productRating: item.productId.productRating,
        discount: productDiscount,
      }
    }
  })
  // console.log(wishlistItemsData)s
  return res.status(200).json({
    success: true,
    message: "successfully fetched wishlist items",
    wishlistItemsData
  });

});

// ---------------api to remove wishlist item-------------------------------------------------------
export const removeWishlistItem = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  // if (!req.params.id) {
  //   return next(new ErrorHandler("no id", 400));
  // }

  const { productId, selectedVarianceId } = req.body

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("no product id", 400));
  }

  const wishlistItem = await Wishlist.findOne({ user: req.user._id, productId: productId, selectedVarianceId: selectedVarianceId });

  if (!wishlistItem) {
    return next(new ErrorHandler("wishlistitem not found", 400));
  }

  await Wishlist.findByIdAndDelete(wishlistItem._id);
  return res.status(200).json({ success: true, message: "successfully deleted item from wishlist" });

});


// ############### cart related controllers ##########################

export const updateCart = asyncErrorHandler(async (req, res, next) => {
  const {
    productId,
    selectedVarianceId,
    quantity=1,
    customSkin,
    isCombo,
    skinProductDetails,
    selectedFreeProducts,
    deviceDetails
  } = req.body;

  console.log("-------------------- update cart------------------------", req.user._id);
  const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });

  if (!customSkin) {
    if (!productId || !selectedVarianceId) {
      return next(new ErrorHandler("Please enter all fields", 404));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler("No product found with this ID", 404));
    }

    const selectedVariantData = product.productVariance.find((variant: { id: string; }) => {
      return variant.id.replace(/\s+/g, "") === selectedVarianceId.replace(/\s+/g, "");
    });

    //check if user adding more than available qty of product like qty is 2 but user adding 10 of that product

    const productInStock = Number(selectedVariantData?.quantity)

    if (selectedVariantData?.quantity == "0" || selectedVariantData?.quantity == 0 || (cartItem && cartItem.quantity + 1 > productInStock)) {
      return next(new ErrorHandler("Product is out of stock", 400));
    }
  }

  if (cartItem && cartItem.quantity < 10) {
    cartItem.quantity = cartItem.quantity + 1;
    cartItem.deviceDetails = deviceDetails ? JSON.parse(deviceDetails) : null; // ✅ Update device details
    await cartItem.save();
  }

  if (!cartItem) {
    await cart.create({
      user: req.user._id,
      productId,
      selectedVarianceId,
      customSkin,
      isCombo,
      skinProductDetails: skinProductDetails ? JSON.parse(skinProductDetails) : null,
      selectedFreeProducts: selectedFreeProducts ? JSON.parse(selectedFreeProducts) : null,
      deviceDetails: (deviceDetails && deviceDetails.length > 0) ? JSON.parse(deviceDetails) : null, // ✅ Add device details
      quantity
    });
  }

  return res.status(200).json({
    success: true,
    message: "Successfully updated cart",
    cartItem
  });
});

//----------------api to decrease product quantity in cart------------------------------------------------
export const decreaseCartProductQuantity = asyncErrorHandler(async (req, res, next) => {

  const { productId, selectedVarianceId } = req.body

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("please enter all fields", 404));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("No product found with this id", 404));
  }

  const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });


  if (!cartItem) {
    return next(new ErrorHandler("cart item not found", 404));
  }

  if (cartItem && cartItem.quantity > 0) {
    console.log("cart item ===>", cartItem)
    if (cartItem.quantity - 1 <= 0) {
      await cart.deleteOne({ _id: cartItem._id })
    } else {
      cartItem.quantity = cartItem.quantity - 1
      await cartItem.save()
    }

  }

  return res.status(200).json({
    success: true,
    message: "Successfully decreased product quantity",
    cartItem
  });

});

//---------------- api to get cart items -----------------------------------------------------------
export const getCartItems = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  const wishlistItems = await cart.find({ user: req.user._id }).populate("productId");
  const cartItemsData = wishlistItems.map((item) => {

    console.log("-------------------------------------------------------------------------cart item data-----------------------------------------", item)

    if (item.productId.productVariance) {
      const variantData = item.productId.productVariance.find((variant: any) => {
        if (variant.id == item.selectedVarianceId) {
          return variant
        }
      })

      // console.log("variantData", variantData)
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
      if (variantData.quantity && Number(variantData.quantity) > 0) {
        return {
          _id: item._id,
          productTitle: item.productId.productTitle,
          thumbnail: variantData?.thumbnail,
          boxPrice: variantData?.boxPrice,
          sellingPrice: variantData?.sellingPrice,
          color: variantData?.color,
          ramAndStorage: variantData?.ramAndStorage[0],
          productRating: item.productId.productRating,
          quantity: item.quantity,
          productId: item.productId._id,
          selectedVarianceId: item.selectedVarianceId,
          deviceDetails: item.deviceDetails,
          discount: productDiscount,
        }
      }

    }
  })
  return res.status(200).json({
    success: true,
    message: "successfully fetched cartitems data",
    cartItemsData
  });
});

//---------------- api to remove cart item-----------------------------------------------------------
export const removeCartItem = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  if (!req.params.id) {
    return next(new ErrorHandler("no id", 400));
  }
  const cartItem = await cart.findOne({ user: req.user._id, _id: req.params.id });
  if (!cartItem) {
    return next(new ErrorHandler("cart not found", 400));
  }

  await cart.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: "successfully deleted item from cart" });

});

// -------------------------- api to remove combo item --------------------------------------
export const removeComboItem = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  const { productId, selectedVarianceId } = req.body
  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("provide all the fields", 400))
  }

  const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });
  if (!cartItem) {
    return next(new ErrorHandler("cart not found", 400));
  }

  cartItem.isCombo = false

  await cartItem.save()
  return res.status(200).json({ success: true, message: "successfully removed combo from item" });

});


// ------------------------- remove free item--------------------------------------------------
export const removeFreeItem = asyncErrorHandler(async (req: Request, res, next) => {
  // console.log("remove free item------------->", req.body)
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  const { productId, selectedVarianceId, freeProductId } = req.body
  if (!productId || !selectedVarianceId || !freeProductId) {
    return next(new ErrorHandler("provide all the fields", 400))
  }

  const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });
  if (!cartItem) {
    return next(new ErrorHandler("cart not found", 400));
  }
  // console.log("remove ----- cart ---- item -=---->", cartItem)

  const updatedFreeItems = cartItem.selectedFreeProducts.length > 0 && cartItem.selectedFreeProducts.filter((item: {
    productid: any
  }) => item.productid !== freeProductId)

  cartItem.selectedFreeProducts = updatedFreeItems
  // console.log("after removing free product item ", cartItem)
  await cartItem.save()
  return res.status(200).json({ success: true, message: "successfully removed free item" });

});

// ------------------ api to get cart details -------------------------------------------------------
export const getCartDetails = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  // const cartItems = await cart.find({ user: req.user._id }).populate("productId");
  const cartItems = await cart.find({ user: req.user._id }).populate({
    path: 'productId',
    populate: [
      {

        path: 'productCategory',
      },
      {
        path: 'productSubCategory',
      },
      {
        path: 'productComboProducts',
        populate: {
          path: 'productId'
        }
      },
      {
        path: 'productFreeProducts',
        populate: {
          path: 'productId'
        }
      }
    ],
  });

  // console.log("categorynew----------------->", cartItemsnew)
  const user = await User.findOne({ _id: req.user._id })
  const appliedCoupon = await Offer.findOne({ _id: user?.coupon })
  const coinAccountData = await CoinAccount.find({ userId: req.user._id })

  //if combo 
  let ComboAccumulator = {
    Total: 0,
    DiscountedTotal: 0,
    finalTotal: 0,
    productTotal: 0,
  }

  console.log(cartItems)

  //mapping through cartItems to structure the data
  const cartItemsData = cartItems.map((item) => {
    console.log("############## check if free product available ############")
    console.log(item)
    if (item.productId.productVariance) {
      const variantData = item.productId.productVariance.find((variant: any) => {
        if ((variant.id.replace(/\s+/g, "")) == (item.selectedVarianceId.replace(/\s+/g, ""))) {
          return variant
        }
      })
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)

      let productComboProducts = [];
      let productFreeProducts = []

      if (item.isCombo) {
        productComboProducts = item?.productId?.productComboProducts.map((item: any) => {
          if (item.productId.productVariance) {
            const variantData = item.productId.productVariance[0]
            const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
            // console.log("type of ------------->", variantData.quantity, variantData.boxPrice, variantData.sellingPrice)
            return {
              _id: item._id,
              keyid: `${item._id}${variantData?.id.replace(/\s+/g, "")}`,
              categoryId: item.productId?.productCategory?._id,
              category: item.productId?.productCategory?.categoryName,
              subCategoryId: item.productId?.productSubCategory?._id,
              subCategory: item.productId?.productSubCategory?.subCategoryName,
              productTitle: item.productId.productTitle,
              thumbnail: variantData?.thumbnail,
              boxPrice: variantData?.boxPrice || 0,  // Ensure a valid number
              sellingPrice: variantData?.sellingPrice || 0,  // Ensure a valid number
              comboPrice: item.comboPrice || variantData.sellingPrice || 0,  // Ensure a valid number
              // color: variantData?.color,
              // ramAndStorage: variantData?.ramAndStorage[0],
              productRating: item.productId.productRating,
              quantity: item.quantity,
              stock:variantData?.quantity,
              productId: item.productId._id,
              // selectedVarianceId: item.selectedVarianceId,
              discount: productDiscount,
              customSkin: item?.customSkin || false,
              // isCombo: item?.isCombo || false,
              // productComboProducts: item?.productId?.productComboProducts ? item?.productId?.productComboProducts : [],
              skinProductDetails: item?.skinProductDetails || [],
              deviceDetails: item?.deviceDetails
            }
          }
        })

        // console.log("comboproducts ----------------------- > ", productComboProducts)
        ComboAccumulator = productComboProducts?.reduce((accumulator: any, item: any) => {
          const boxPrice = Number(item?.boxPrice) || 999;  // Default to 0 if undefined or NaN
          const comboPrice = Number(item?.comboPrice) || item.sellingPrice || 999;  // Default to 0 if undefined or NaN
          console.log("boxprice ==>", item.boxPrice, "and ", item.sellingPrice)
          const Total = accumulator.Total + boxPrice;
          const DiscountedTotal = accumulator.DiscountedTotal + comboPrice;

          return {
            Total,
            DiscountedTotal,
          };
        }, {
          Total: 0,
          DiscountedTotal: 0,
        });
        console.log("accucombodata-------------------------------->", "data", ComboAccumulator)
        // console.log("combo item -=====>", item.productId)
        ComboAccumulator.productTotal = Number(ComboAccumulator?.Total) + Number(variantData?.sellingPrice)
        ComboAccumulator.finalTotal = Number(ComboAccumulator?.DiscountedTotal) + Number(variantData?.sellingPrice)

      }

      if (item.productId.productFreeProducts.length > 0) {
        productFreeProducts = item?.productId?.productFreeProducts?.map((item: any) => {
          if (item.productId.productVariance) {

            const variantData = item.productId.productVariance[0]

            return {
              _id: item._id,
              keyid: `${item._id}${variantData?.id.replace(/\s+/g, "")}`,
              categoryId: item.productId?.productCategory?._id,
              category: item.productId?.productCategory?.categoryName,
              subCategoryId: item.productId?.productSubCategory?._id,
              subCategory: item.productId?.productSubCategory?.subCategoryName,
              title: item.productId.productTitle,
              thumbnail: variantData?.thumbnail,
              boxPrice: variantData?.boxPrice || 0,  // Ensure a valid number
              sellingPrice: variantData?.sellingPrice || 0,  // Ensure a valid number
              comboPrice: variantData.comboPrice || variantData.sellingPrice || 0,  // Ensure a valid number
              // color: variantData?.color,
              // ramAndStorage: variantData?.ramAndStorage[0],
              productRating: item.productId.productRating,
              quantity: item.quantity,
              stock:variantData?.quantity,
              productId: item.productId._id,
              // selectedVarianceId: item.selectedVarianceId,
              discount: productDiscount,
              customSkin: item?.customSkin || false,
              // isCombo: item?.isCombo || false,
              // productComboProducts: item?.productId?.productComboProducts ? item?.productId?.productComboProducts : [],
              skinProductDetails: item?.skinProductDetails || [],
              deviceDetails: item?.deviceDetails
            }
          }
        })
      }

      return {
        _id: item._id,
        keyid: `${item._id}${variantData?.id.replace(/\s+/g, "")}`,
        categoryId: item.productId?.productCategory?._id,
        category: item.productId?.productCategory?.categoryName,
        subCategoryId: item.productId?.productSubCategory?._id,
        subCategory: item.productId?.productSubCategory?.subCategoryName,
        productTitle: item.productId.productTitle,
        thumbnail: variantData?.thumbnail,
        boxPrice: variantData?.boxPrice,
        sellingPrice: variantData?.sellingPrice,
        comboPrice: variantData?.comboPrice,
        color: variantData?.color,
        ramAndStorage: variantData?.ramAndStorage[0],
        productRating: item.productId.productRating,
        quantity: item.quantity,
        stock:variantData?.quantity,
        productId: item.productId._id,
        selectedVarianceId: item.selectedVarianceId,
        discount: productDiscount,
        customSkin: item?.customSkin || false,
        isCombo: item?.isCombo || false,
        // productComboProducts: item?.productId?.productComboProducts ? item?.productId?.productComboProducts : [],
        productComboProducts: productComboProducts ? productComboProducts : [],
        productFreeProducts: item.selectedFreeProducts ?? productFreeProducts,
        // selectedFreeProducts: item.selectedFreeProducts ? item.selectedFreeProducts : [],
        skinProductDetails: item?.skinProductDetails || [],
        deviceDetails: item?.deviceDetails
      }
    }
  })

  let Total = 0
  let DiscountedTotal = 0
  // const cartDetails = cartItemsData.map((item) => {
  //   return {
  //     Total: Total + ((item?.quantity ?? 1) * item?.boxPrice),
  //     DiscountedTotal: DiscountedTotal + ((item?.quantity ?? 1) * item?.sellingPrice)
  //   }
  // })

  const totals = cartItemsData.reduce((accumulator, item) => {
    // console.log("accumulator ==> ", accumulator, "==and==>", item)
    const Total = accumulator.Total + ((item?.quantity ?? 1) * item?.boxPrice);
    const DiscountedTotal = accumulator.DiscountedTotal + ((item?.quantity ?? 1) * item?.sellingPrice);

    return {
      Total,
      DiscountedTotal
    };
  }, {
    Total: 0,
    DiscountedTotal: 0,
  })



  console.log("comboaccumulator=====>", ComboAccumulator)


  //Add combo price 
  totals.Total += ComboAccumulator.Total ? ComboAccumulator.Total : 0
  totals.DiscountedTotal += ComboAccumulator.DiscountedTotal ? ComboAccumulator.DiscountedTotal : 0

  let couponDiscount = 0
  let deliveryCharges = 150


  // if (appliedCoupon && Number(appliedCoupon.offerDiscountValue) > 0) {
  //   couponDiscount = Math.round((Number(appliedCoupon.offerDiscountValue) * totals.DiscountedTotal) / 100)
  //   couponDiscount = couponDiscount > 500 ? 499 : couponDiscount
  // }

  // Step 4: Apply coupon discounts if offer limit conditions are met
  if (appliedCoupon && Number(appliedCoupon.offerDiscountValue) > 0) {
    const minLimit = Number(appliedCoupon.offerLimit.minLimit);
    const maxLimit = Number(appliedCoupon.offerLimit.maxLimit);

    // Use totals.Total instead of finalCartTotal
    if (totals.Total >= minLimit && totals.Total <= maxLimit) {
      switch (appliedCoupon.offerCouponType) {
        case 'freeshipping':
          deliveryCharges = 0 // Assume 499 is the max discount allowed for shipping
          break;

        case 'percentage':
          couponDiscount = Math.round((Number(appliedCoupon.offerDiscountValue) * totals.DiscountedTotal) / 100);
          // couponDiscount = Math.min(2400, couponDiscount); // Cap discount at 2000
          break;

        case 'fixedamount':
          couponDiscount = Math.min(Number(appliedCoupon.offerDiscountValue), totals.DiscountedTotal);
          break;

        default:
          // Handle unexpected coupon types if necessary
          break;
      }
    }
  }

  const availableCoins = coinAccountData.length > 0 && coinAccountData[0]?.coinAccountBalance || 0

  const finalCartTotalBeforeCoins = totals.DiscountedTotal - (couponDiscount)
  const fiftyPercentOfFinalCartTotal = finalCartTotalBeforeCoins * 0.5;

  console.log(availableCoins, "available coin ............")
  console.log("hey som val")
  console.log("totals", totals)
  console.log(couponDiscount, "couponDiscount")
  console.log(finalCartTotalBeforeCoins, "final cart total before coins ................")
  console.log(fiftyPercentOfFinalCartTotal, "fifty percent of cart total ..................")



  const usableCoins = availableCoins > fiftyPercentOfFinalCartTotal ? Math.floor(fiftyPercentOfFinalCartTotal) : availableCoins

  console.log(usableCoins, "usable coin ............")


  let deductCoinsForCart = coinAccountData[0].useCoinForPayment ? usableCoins : 0
  let isCoinUseChecked = coinAccountData[0].useCoinForPayment || false
  let finalCartTotal = totals.DiscountedTotal - (couponDiscount) - deductCoinsForCart

  // if (finalCartTotal < 500) {
  //   deliveryCharges = 150
  // }


  finalCartTotal = finalCartTotal + deliveryCharges

  return res.status(200).json({
    success: true,
    message: "Cart details fetched successfully",
    cartItemsData,
    cartDetails: { ...totals, finalCartTotal, comboTotal: ComboAccumulator, couponDiscount, availableCoins, usableCoins, appliedCoupon, deliveryCharges, isCoinUseChecked },
    offer: user?.coupon,
  });
});

// ------------------ api to get cart details -------------------------------------------------------
export const getUnAuthenticatedCartDetails = asyncErrorHandler(async (req: Request, res, next) => {

  // console.log("-------------------? unauthenticated cart details", req.body)
  const { cart } = req.body


  const cartItems = await Promise.all(cart.map(async (cartItem: { productId: any; }) => {
    const product = await Product.findById(cartItem.productId).populate('productCategory').populate('productSubCategory').populate({
      path: 'productComboProducts',
      populate: {
        path: 'productId'
      }
    }).populate({
      path: 'productFreeProducts',
      populate: {
        path: 'productId'
      }
    })


    console.log("------------product--------", product);
    if (product) {
      return {
        ...cartItem,
        productId: product,
      };
    }
    return null; // or handle the case where product is not found
  }));


  //if combo 
  let ComboAccumulator = {
    Total: 0,
    DiscountedTotal: 0
  }

  // Remove null entries if there were any
  const filteredCartItemsData = cartItems.filter(item => item !== null);
  // console.log("---------cart------------", filteredCartItemsData);
  // //mapping through cartItems to structure the data
  const cartItemsData = filteredCartItemsData.map((item) => {
    // console.log("------------- item-------------------", item)
    if (item.productId.productVariance) {
      let productComboProducts = [];
      let productFreeProducts = []
      if (item.isCombo) {
        productComboProducts = item?.productId?.productComboProducts?.map((item: any) => {
          if (item.productId.productVariance) {

            const variantData = item?.productId.productVariance[0]
            const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)

            // console.log("type of ------------->", variantData.quantity, variantData.boxPrice, variantData.sellingPrice)

            // ComboAccumulator.Total = Number(ComboAccumulator.Total + (Number(variantData?.quantity) * Number(variantData?.boxPrice)));

            // ComboAccumulator.DiscountedTotal = Number(ComboAccumulator.DiscountedTotal + (Number(variantData?.quantity) * Number(variantData?.sellingPrice)));

            return {
              _id: item._id,
              keyid: `${item._id}${variantData?.id.replace(/\s+/g, "")}`,
              categoryId: item.productId?.productCategory?._id,
              category: item.productId?.productCategory?.categoryName,
              subCategoryId: item.productId?.productSubCategory?._id,
              subCategory: item.productId?.productSubCategory?.subCategoryName,
              productTitle: item.productId.productTitle,
              thumbnail: variantData?.thumbnail,
              boxPrice: variantData?.boxPrice,
              sellingPrice: variantData?.sellingPrice,
              comboPrice: variantData?.comboPrice,
              // color: variantData?.color,
              // ramAndStorage: variantData?.ramAndStorage[0],
              productRating: item.productId.productRating,
              quantity: item.quantity,
              productId: item.productId._id,
              // selectedVarianceId: item.selectedVarianceId,
              discount: productDiscount,
              customSkin: item?.customSkin || false,
              // isCombo: item?.isCombo || false,
              // productComboProducts: item?.productId?.productComboProducts ? item?.productId?.productComboProducts : [],
              skinProductDetails: item?.skinProductDetails || [],
            }
          }
        })

        // console.log("comboproducts ----------------------- > ", productComboProducts)
        ComboAccumulator = productComboProducts?.reduce((accumulator: any, item: any) => {
          console.log("accumlateor------------------>", item)
          const Total = accumulator.Total + (Number(item?.boxPrice));
          const DiscountedTotal = accumulator.DiscountedTotal + (Number(item?.sellingPrice));

          return {
            Total,
            DiscountedTotal
          };
        }, {
          Total: 0,
          DiscountedTotal: 0,
        })

      }
      if (item.productId.productFreeProducts.length > 0) {
        productFreeProducts = item?.productId?.productFreeProducts?.map((item: any) => {
          if (item.productId.productVariance) {

            const variantData = item.productId.productVariance[0]
            const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
            return {
              _id: item._id,
              keyid: `${item._id}${variantData?.id.replace(/\s+/g, "")}`,
              categoryId: item.productId?.productCategory?._id,
              category: item.productId?.productCategory?.categoryName,
              subCategoryId: item.productId?.productSubCategory?._id,
              subCategory: item.productId?.productSubCategory?.subCategoryName,
              productTitle: item.productId.productTitle,
              thumbnail: variantData?.thumbnail,
              boxPrice: variantData?.boxPrice,
              sellingPrice: variantData?.sellingPrice,
              comboPrice: variantData?.comboPrice,
              // color: variantData?.color,
              // ramAndStorage: variantData?.ramAndStorage[0],
              productRating: item.productId.productRating,
              quantity: item.quantity,
              productId: item.productId._id,
              // selectedVarianceId: item.selectedVarianceId,
              discount: productDiscount,
              customSkin: item?.customSkin || false,
              // isCombo: item?.isCombo || false,
              // productComboProducts: item?.productId?.productComboProducts ? item?.productId?.productComboProducts : [],
              skinProductDetails: item?.skinProductDetails || [],
            }
          }
        })
      }

      const variantData = item.productId.productVariance.find((variant: any) => {
        if ((variant.id.replace(/\s+/g, "")) == (item.selectedVarianceId.replace(/\s+/g, ""))) {
          return variant
        }
      })
      const productDiscount = calculateDiscount(variantData?.boxPrice, variantData?.sellingPrice)
      return {
        _id: item.productId._id,
        keyid: `${item.productId._id}${variantData?.id.replace(/\s+/g, "")}`,
        categoryId: item.productId?.productCategory?._id,
        category: item.productId?.productCategory?.categoryName,
        subCategoryId: item.productId?.productSubCategory?._id,
        subCategory: item.productId?.productSubCategory?.subCategoryName,
        productTitle: item.productId.productTitle,
        thumbnail: variantData?.thumbnail,
        boxPrice: variantData?.boxPrice,
        sellingPrice: variantData?.sellingPrice,
        color: variantData?.color,
        ramAndStorage: variantData?.ramAndStorage[0],
        productRating: item.productId.productRating,
        quantity: item.quantity,
        productId: item.productId._id,
        selectedVarianceId: item.selectedVarianceId,
        discount: productDiscount,
        customSkin: item?.customSkin || false,
        skinProductDetails: item?.skinProductDetails || [],
        isCombo: item?.isCombo || false,
      }
    }
  })

  let Total = 0
  let DiscountedTotal = 0



  const cartDetails = cartItemsData.map((item) => {
    return {
      Total: Total + (item?.quantity * item?.boxPrice),
      DiscountedTotal: DiscountedTotal + (item?.quantity * item?.sellingPrice)
    }
  })

  const totals = cartItemsData.reduce((accumulator, item) => {
    const Total = accumulator.Total + (item?.quantity * item?.boxPrice);
    const DiscountedTotal = accumulator.DiscountedTotal + (item?.quantity * item?.sellingPrice);

    return {
      Total,
      DiscountedTotal
    };
  }, {
    Total: 0,
    DiscountedTotal: 0,
  })
  let couponDiscount = 0

  // console.log("comboaccumulator=====>", ComboAccumulator)
  //Add combo price 
  totals.Total += ComboAccumulator.Total
  totals.DiscountedTotal += ComboAccumulator.DiscountedTotal


  let finalCartTotal = totals.DiscountedTotal
  let deliveryCharges = 150

  if (finalCartTotal > 500) {
    deliveryCharges = 0
  }

  finalCartTotal = finalCartTotal + deliveryCharges
  return res.status(200).json({
    success: true,
    message: "Cart details fetched successfully",
    cartItemsData,
    cartDetails: { ...totals, finalCartTotal, deliveryCharges, comboTotals: ComboAccumulator }
  });
});

// ------------------ api to get cart details -------------------------------------------------------
export const storeCartItemsInDb = asyncErrorHandler(async (req: Request, res, next) => {

  // console.log("-------------------? save cart item in db", req.body)
  const { cartData } = req.body
  console.log("check if array is valid cartdata", Array.isArray(cartData))

  if (!cartData || !Array.isArray(cartData)) {
    return next(new ErrorHandler("provide correct data", 204))
  }


  // console.log("-----cartData----", cartData)
  for (const item of cartData) {
    const cartItem = new cart({
      ...item,
      user: req.user._id,
      skinProductDetails: item.skinProductDetails ? JSON.parse(item.skinProductDetails) : null,
    });
    await cartItem.save();
  }
  return res.status(200).json({
    success: true,
    message: "Cart items stored in db",
  });
});

// ----------------  api to clear cart -----------------------------------------------------------------
export const clearCart = asyncErrorHandler(async (req: Request, res, next) => {
  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }
  // const cartItems = await cart.find({ user: req.user._id })
  const deletedItems = await cart.deleteMany({ user: req.user._id });
  return res.status(200).json({
    success: true,
    message: `${deletedItems.deletedCount} Cart items deleted successfully`,
  });
});


export const getBuyNowCartDetails = asyncErrorHandler(async (req: Request, res, next) => {

  if (!req.user._id) {
    return next(new ErrorHandler("unauthenticated", 400));
  }

  const { productId, selectedVarianceId, quantity, customSkin, skinProductDetails } = req.body

  console.log(productId, "product id")
  console.log(selectedVarianceId, "selectedVariance id")

  if (!productId || !selectedVarianceId) {
    return next(new ErrorHandler("please enter all fields", 404));

  }
  const product = await Product.findById(productId).populate('productCategory');
  if (!product) {
    return next(new ErrorHandler("No product found with this id", 404));
  }
  const selectedVariantData = product.productVariance.find((variant: { id: string; }) => {
    return variant.id.replace(/\s+/g, "") == selectedVarianceId.replace(/\s+/g, "")
  })

  if (selectedVariantData?.quantity == '0' || selectedVariantData?.quantity == 0) {
    return next(new ErrorHandler("product is out of stock", 404));
  }


  const user = await User.findOne({ _id: req.user._id })
  const appliedCoupon = await Offer.findOne({ _id: user?.coupon })
  const coinAccountData = await CoinAccount.find({ userId: req.user._id })

  //mapping through cartItems to structure the data

  const productDiscount = calculateDiscount(selectedVariantData?.boxPrice, selectedVariantData?.sellingPrice)
  // console.log("buy now---------->", product)
  const cartItemsData = [{
    _id: product._id,
    keyid: `${product._id}${selectedVariantData?.id.replace(/\s+/g, "")}`,
    categoryId: product?.productCategory?._id,
    category: product?.productCategory?.categoryName,
    productTitle: product?.productTitle,
    thumbnail: selectedVariantData?.thumbnail,
    boxPrice: selectedVariantData?.boxPrice,
    sellingPrice: selectedVariantData?.sellingPrice,
    color: selectedVariantData?.color,
    ramAndStorage: selectedVariantData?.ramAndStorage[0],
    productRating: product.productRating,
    quantity: quantity,
    productId: product._id,
    selectedVarianceId: selectedVarianceId,
    discount: productDiscount,
    customSkin: customSkin || false,
    skinProductDetails: skinProductDetails || []
  }]


  let Total = 0
  let DiscountedTotal = 0
  const cartDetails = cartItemsData.map((item) => {
    return {
      Total: Total + (item?.quantity * item?.boxPrice),
      DiscountedTotal: DiscountedTotal + (item?.quantity * item?.sellingPrice)
    }
  })

  const totals = cartItemsData.reduce((accumulator, item) => {
    const Total = accumulator.Total + (item?.quantity * item?.boxPrice);
    const DiscountedTotal = accumulator.DiscountedTotal + (item?.quantity * item?.sellingPrice);

    return {
      Total,
      DiscountedTotal
    };
  }, {
    Total: 0,
    DiscountedTotal: 0,
  })
  let couponDiscount = 0
  if (appliedCoupon && appliedCoupon.offerCouponDiscount) {
    couponDiscount = Math.round((Number(appliedCoupon.offerCouponDiscount) * totals.DiscountedTotal) / 100)
    couponDiscount = couponDiscount > 500 ? 499 : couponDiscount
  }

  const availableCoins = coinAccountData.length > 0 && coinAccountData[0]?.coinAccountBalance || 0
  const finalCartTotalBeforeCoins = totals.DiscountedTotal - (couponDiscount)
  const fiftyPercentOfFinalCartTotal = finalCartTotalBeforeCoins * 0.5;

  const usableCoins = availableCoins > fiftyPercentOfFinalCartTotal ? fiftyPercentOfFinalCartTotal : availableCoins

  let deductCoinsForCart = coinAccountData[0].useCoinForPayment ? usableCoins : 0
  let isCoinUseChecked = coinAccountData[0].useCoinForPayment || false
  let finalCartTotal = totals.DiscountedTotal - (couponDiscount) - deductCoinsForCart

  let deliveryCharges = 0

  if (finalCartTotal < 500) {
    deliveryCharges = 150
  }

  finalCartTotal = finalCartTotal + deliveryCharges
  return res.status(200).json({
    success: true,
    message: "buy now cart details fetched successfully",
    cartItemsData,
    cartDetails: { ...totals, finalCartTotal, couponDiscount, availableCoins, usableCoins, deliveryCharges, isCoinUseChecked },
    offer: user?.coupon,
  });
});











// ------------------------ Archived controllers-----------------------------------------
// //-----------------------api to update profile ----------------------------------------
// export const updateProfile = asyncErrorHandler(async (req, res, next) => {
//   const { profile } = req.body
//   const user = await User.findById(req.user._id);
//   if (!user) {
//     return next(new ErrorHandler("No user found by this id", 404));
//   }

//   const profileData = JSON.parse(profile)
//   console.log(profileData)
//   const {
//     profileImageUrl,
//     profileName,
//     profilePhoneNo,
//     profileGender,
//     profileLocation,
//     profileAlternateMobileNo,
//   } = profileData

//   user.name = profileData.profileName
//   user.profile = {
//     profileImageUrl,
//     profileName,
//     profilePhoneNo,
//     profileGender,
//     profileLocation,
//     profileAlternateMobileNo,
//     profileEmailId: user.profile.profileEmailId,
//   }

//   await updateFirebaseProfile(req.user.uid, profileData.profileName, profileData.profileImageUrl, profileData.profilePhoneNo)
//   // user.email = profileData.profileEmailId
//   await user.save();

//   return res.status(200).json({
//     success: true,
//     message: "Successfully updated profile",

//   });
// });


//---------------------api to update cart----------------------------------------------------------
// export const updateCart = asyncErrorHandler(async (req, res, next) => {

//   const { productId, selectedVarianceId, quantity, customSkin, isCombo, skinProductDetails, selectedFreeProducts } = req.body
//   console.log("-------------------- update cart------------------------", req.body)
//   if (!customSkin) {
//     if (!productId || !selectedVarianceId) {
//       return next(new ErrorHandler("please enter all fields", 404));
//     }

//     const product = await Product.findById(productId);
//     if (!product) {
//       return next(new ErrorHandler("No product found with this id", 404));
//     }
//     const selectedVariantData = product.productVariance.find((variant: { id: string; }) => {
//       return variant.id.replace(/\s+/g, "") == selectedVarianceId.replace(/\s+/g, "")
//     })

//     if (selectedVariantData?.quantity == '0' || selectedVariantData?.quantity == 0) {
//       return next(new ErrorHandler("product is out of stock", 404));
//     }

//   }

//   const cartItem = await cart.findOne({ productId, selectedVarianceId, user: req.user._id });


//   if (cartItem && cartItem.quantity < 10) {
//     cartItem.quantity = cartItem.quantity + 1
//     await cartItem.save()
//   }

//   // console.log(skinProductDetails)
//   // console.log(JSON.parse(selectedFreeProducts))

//   if (!cartItem) {
//     await cart.create({
//       user: req.user._id,
//       productId,
//       selectedVarianceId,
//       customSkin,
//       isCombo,
//       skinProductDetails: skinProductDetails ? JSON.parse(skinProductDetails) : null,
//       selectedFreeProducts: selectedFreeProducts ? JSON.parse(selectedFreeProducts) : null,
//       quantity
//     })
//   }

//   return res.status(200).json({
//     success: true,
//     message: "Successfully updated cart",
//     cartItem
//   });

// });



///--------------------- buyNow Cart -----------------------------



// export const getbuyNowCartItems = asyncErrorHandler(async (req: Request, res, next) => {
//   if (!req.user._id) {
//     return next(new ErrorHandler("unauthenticated", 400));
//   }

//   // console.log(item)

//   const { productId, selectedVarianceId, quantity, customSkin, skinProductDetails } = req.body


//   if (!productId || !selectedVarianceId) {
//     return next(new ErrorHandler("please enter all fields", 404));

//   }
//   const product = await Product.findById(productId);
//   if (!product) {
//     return next(new ErrorHandler("No product found with this id", 404));
//   }
//   const selectedVariantData = product.productVariance.find((variant: { id: string; }) => {
//     return variant.id.replace(/\s+/g, "") == selectedVarianceId.replace(/\s+/g, "")
//   })

//   if (selectedVariantData?.quantity == '0' || selectedVariantData?.quantity == 0) {
//     return next(new ErrorHandler("product is out of stock", 404));
//   }
//   // console.log("variantData", variantData)
//   const productDiscount = calculateDiscount(selectedVariantData?.boxPrice, selectedVariantData?.sellingPrice)
//   const cartItemsData = {
//     productTitle: product.productTitle,
//     thumbnail: selectedVariantData.thumbnail,
//     boxPrice: selectedVariantData?.boxPrice,
//     sellingPrice: selectedVariantData?.sellingPrice,
//     color: selectedVariantData?.color,
//     ramAndStorage: selectedVariantData?.ramAndStorage[0],
//     productRating: product.productRating,
//     quantity: quantity,
//     productId: product._id,
//     selectedVarianceId: product.selectedVarianceId,
//     discount: productDiscount,
//   }


//   return res.status(200).json({
//     success: true,
//     message: "successfully fetched buyNow data",
//     cartItemsData: [cartItemsData]
//   });
// })


//------------------api to add coupon code for cart------------------------------------------
// export const updateCouponCode = asyncErrorHandler(async (req, res, next) => {
//   const { couponId } = req.body
//   if (!couponId) {
//     return next(new ErrorHandler("enter coupon code", 404));
//   }
//   const couponCode = await Offer.findOne({ _id: couponId })

//   if (!couponCode) {
//     return next(new ErrorHandler("No coupon found by this id", 404));
//   }

//   const user = await User.findById(req.user._id);

//   if (!user) {
//     return next(new ErrorHandler("No user found by this id", 404));
//   }

//   user.coupon = couponId

//   await user.save();

//   return res.status(200).json({
//     success: true,
//     message: "Successfully added coupon",
//   });
// });