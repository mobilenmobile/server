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
} from "../controllers/product.controllers.js";

import { adminOnly, authenticated } from "../middleware/auth.middleware.js";
import { processOrder } from "../controllers/order.controller.js";

const productRouter = express.Router();

productRouter.post("/new", adminOnly, fileUpload.array("productImages"), newProduct);
productRouter.post(
  "/previewImages",
  fileUpload.array("productImages"),
  previewImages
);

productRouter.get("/latest", getLatestProduct);
productRouter.get("/getsingleproduct/:id", getSingleProduct);
productRouter.post("/deletePreviewImage", deletePreviewCloudinary);
productRouter.get("/search", getAllProducts);

productRouter.post("/updateproduct/:id", adminOnly, updateProduct);
productRouter.delete("/deleteproduct/:id", adminOnly, deleteProduct);


export default productRouter;
