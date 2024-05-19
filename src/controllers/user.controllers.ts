import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { NewUserRequestBody } from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import { User } from "../models/auth/user.model";

export const newUser = asyncErrorHandler(
  async (req: Request<{}, {}, NewUserRequestBody>, res, next) => {
    const { name, uid, email } = req.body;

    if (!email || !uid) {
      return next(new ErrorHandler("please provide email or uid", 400));
    }

    const userExist = await User.findOne({ email });

    if (userExist) {
      return next(new ErrorHandler("User already exist", 400));
    }

    const userData = {
      name: name ? name : "",
      uid,
      email,
    };

    const user = await User.create(userData);
    return res.status(200).json({ success: true, user });
  }
);

export const getCookie = (req: any, res: any) => {
  console.log("cookie", req.get("Cookie"));
  console.log(req.headers);
  return res.status(200).json({ success: true });
};

export const getUser = asyncErrorHandler(async (req: Request, res, next) => {
  const uid = req.params.uid;
  const user = await User.findOne({ uid });

  if (!user) {
    return next(new ErrorHandler("user doesnt exist", 400));
  }

  return res.status(200).json({ success: true, user });
});
