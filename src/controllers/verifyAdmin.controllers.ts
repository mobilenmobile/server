import { Request, Response } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { verifyAdminReqBody } from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import jwt from "jsonwebtoken";

const AdminEmail = "harry@gmail.com";

export const verifyAdmin = asyncErrorHandler(
  async (req: Request<{}, {}, verifyAdminReqBody>, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("provide email or password", 400));
    }

    if (email === AdminEmail) {
      const tokenData = {
        id: process.env.ADMIN_ID,
        name: process.env.ADMIN_EMAIL,
      };

      const token = await jwt.sign(tokenData, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });

      console.log(token);

      res.setHeader("Set-Cookie", "hey=voldemort");
      res.getHeader("Set-Cookie");

      return res
        .status(200)
        .json({ success: true, isAdmin: true, userId: process.env.ADMIN_ID });
    } else {
      return next(new ErrorHandler("authentication failed.", 400));
    }
  }
);
