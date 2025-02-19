import express from "express";
import { fileUpload } from "../middleware/multer.middleware.js";
import {
  deleteProduct,
  getAllProducts,
  getLatestProduct,
  getSingleProduct,
  newProduct,
  updateProduct,
  previewImages,
  deletePreviewCloudinary,
  getLimitedProductsByBrands,
  deleteProductDirectly,
  getFilterAndSortProducts,
  getAllAdminProducts,
  getSimilarProducts,
  getSingleProductDetails,
  getFilterAndSortSkinProducts,
} from "../controllers/product.controllers.js";

import { adminOnly, authenticated } from "../middleware/auth.middleware.js";

const productRouter = express.Router();

productRouter.post("/new", newProduct);

//############### IMAGE RELATED ROUTES ###############################
productRouter.post("/previewImages",fileUpload.array("productImages"), previewImages);
productRouter.post("/deletePreviewImage",deletePreviewCloudinary);

// ################### MNM CLIENT ROUTES ############################ 
productRouter.get("/latest", getLatestProduct);
productRouter.get("/getsingleproduct/:id", getSingleProduct);
productRouter.get("/getsingleproductdetails/:id", getSingleProductDetails);
productRouter.get("/search", getAllProducts);
productRouter.post("/searchfilterandsort", getFilterAndSortProducts);
productRouter.post("/skinfilterandsort", getFilterAndSortSkinProducts);
productRouter.get("/getlimitedproductsbybrand", getLimitedProductsByBrands);
productRouter.post("/getsimilarproducts", getSimilarProducts);

// ----------------------MNM ADMIN ROUTES-----------------------------------------------
productRouter.get("/getAllAdminProducts", getAllAdminProducts);
productRouter.post("/updateproduct/:id", authenticated, updateProduct);
productRouter.delete("/deleteproduct/:id", authenticated, deleteProduct);
productRouter.delete("/deleteproductdirectly/:id", authenticated, deleteProductDirectly);



export default productRouter;
