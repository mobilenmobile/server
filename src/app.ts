import express, { Request, Response } from "express";
const app = express();

import cors from "cors";

import { errorMiddleware } from "./middleware/error.middleware.js";
import userRoute from "./routes/user.routes.js";
import orderRoute from "./routes/order.routes.js";
import productRoute from "./routes/product.routes.js";
import paymentRoute from "./routes/payment.routes.js";
import reviewRoute from "./routes/review.route.js"
import dashboardRoute from "./routes/dashboard.routes.js";
import chatbotRoute from "./routes/chatbot.routes.js";
import addressRoute from "./routes/address.routes.js";
import NodeCache from "node-cache";

import brandRoute from "./routes/brand.routes.js";
import morgan from "morgan";

import categoryRoute from "./routes/category.route.js";
import offerRoute from "./routes/offer.routes.js";
import verifyAdmin from "./routes/admin.routes.js";
import cookieParser from "cookie-parser";

//Handle cors
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

//Required Middlewares

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
// app.use(cookieParser())
app.use(morgan("dev"));
//Routes
app.get("/", (req, res) => {
  res.send("Server is up to date");
});

app.use(cookieParser());

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/address", addressRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/brand", brandRoute);
app.use("/api/v1/offer", offerRoute);
app.use("/api/v1/admin", verifyAdmin);
app.use("/api/v1/chatbot", chatbotRoute);

//Error middleware to be used below route
//to cache err from routes
app.use(errorMiddleware);

export const myCache = new NodeCache();
export default app;
