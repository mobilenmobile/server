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

import { adminOnly } from "../middleware/auth.middleware.js";

const productRouter = express.Router();

productRouter.post("/new", adminOnly, fileUpload.array("productImages"), newProduct);
productRouter.post(
  "/previewImages",
  fileUpload.array("productImages"),
  previewImages
);

productRouter.post("/deletePreviewImage", deletePreviewCloudinary);


productRouter.get("/latest", getLatestProduct);
productRouter.get("/getsingleproduct/:id", getSingleProduct);
productRouter.get("/getsingleproductdetails/:id", getSingleProductDetails);
productRouter.get("/search", getAllProducts);
productRouter.post("/searchfilterandsort", getFilterAndSortProducts);
productRouter.post("/skinfilterandsort", getFilterAndSortSkinProducts);
productRouter.get("/getlimitedproductsbybrand", getLimitedProductsByBrands);
productRouter.post("/getsimilarproducts", getSimilarProducts);

// ---------------------- Admin routes-----------------------------------------------
productRouter.get("/getAllAdminProducts", adminOnly, getAllAdminProducts);
productRouter.post("/updateproduct/:id", adminOnly, updateProduct);
productRouter.delete("/deleteproduct/:id", adminOnly, deleteProduct);
productRouter.delete("/deleteproductdirectly/:id", adminOnly, deleteProductDirectly);
productRouter.post("/deletePreviewImage", adminOnly, deletePreviewCloudinary);



export default productRouter;
