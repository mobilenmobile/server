import express from "express";
const app = express();

import cors from "cors";
import requestIp from "request-ip";
import { errorMiddleware } from "./middleware/error.middleware.js";
import userRoute from "./routes/user.routes.js";
import orderRoute from "./routes/order.routes.js";
import productRoute from "./routes/product.routes.js";
import paymentRoute from "./routes/payment.routes.js";
import reviewRoute from "./routes/review.route.js"
import dashboardRoute from "./routes/dashboard.routes.js";
import chatbotRoute from "./routes/chatbot.routes.js";
import addressRoute from "./routes/address.routes.js";
import shipRocketRoute from "./routes/shiprocket.routes.js";
import bannerRoute from "./routes/banner.routes.js";
import settingsRoute from "./routes/settings.routes.js";
import blogRoute from "./routes/blog.routes.js";
import boxRoute from "./routes/box.routes.js"
import rolesRoute from "./routes/userRoles.routes.js"
import delhiveryRoute from "./routes/delhivery.routes.js"
import suggestionRoute from "./routes/suggestion.routes.js"
import NodeCache from "node-cache";

import brandRoute from "./routes/brand.routes.js";
import morgan from "morgan";

import categoryRoute from "./routes/category.route.js";
import subCategoryRoute from "./routes/subcategoryroutes.js";
import offerRoute from "./routes/offer.routes.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ApiError } from "./utils/ApiError.js";
import path from "path";

//Handle cors
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


// Required Middlewares
// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per `window` (here, per 10 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    return requestIp.getClientIp(req) || "unknown"; // Extract IP safely
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

app.use(limiter)

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));



app.use(morgan("dev"));

//Routes
app.get("/", (req, res) => {
  res.send("Server is up to date");
});

app.use(cookieParser());



// /export route to send the Excel file
app.get('/exports/:fileName', (req, res) => {
  const { fileName } = req.params;
  if (!fileName) return res.status(400).send('File name is required');
  const filePath = path.join(__dirname, 'public', 'exports', fileName);

  res.download(filePath, 'products_export.xlsx', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).json({ success: false, message: "file not present" })
    }
  });
});


app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/address", addressRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/subcategory", subCategoryRoute);
app.use("/api/v1/brand", brandRoute);
app.use("/api/v1/offer", offerRoute);
app.use("/api/v1/chatbot", chatbotRoute);
app.use("/api/v1/courier", shipRocketRoute);
app.use("/api/v1/banner", bannerRoute);
app.use("/api/v1/settings", settingsRoute);
app.use("/api/v1/blog", blogRoute);
app.use("/api/v1/boxes", boxRoute);
app.use("/api/v1/roles", rolesRoute);
app.use("/api/v1/delhivery", delhiveryRoute);
app.use("/api/v1/suggestion", suggestionRoute);

//Error middleware to be used below route
//to cache err from routes

app.use(errorMiddleware);

export const myCache = new NodeCache();
export default app;
