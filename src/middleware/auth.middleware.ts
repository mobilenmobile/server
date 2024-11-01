import { getUid } from "../db/firebase.js";
import { User } from "../models/auth/user.model.js";
import { Role } from "../models/userRoleModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { asyncErrorHandler } from "./error.middleware.js";


export const authenticated = asyncErrorHandler(async (req, res, next) => {
  console.log(
    "req.header",
    req.header("Authorization")?.replace("Bearer ", "")
  );

  const authToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  // console.log("authtoken type =>  ", typeof authToken, "and", authToken);
  if (!authToken) return next(new ErrorHandler("Token not present", 401));

  if (typeof authToken !== "string") {
    return next(new ErrorHandler("Token is not string", 401));
  }

  const verifyAuth = await getUid(authToken);


  // console.log("------------------- xxxxx------------------");
  // console.log(verifyAuth, "and uid is ", verifyAuth.uid);
  // console.log("------------------- xxxxx------------------");

  if (verifyAuth.uid.length < 1)
    return next(new ErrorHandler("Token is invalid ", 401));
  const user = await User.findOne({ uid: verifyAuth.uid });
  // console.log(user);
  if (!user) {
    return res.json({ success: false, errorType: "No_User", message: "user does't exist" })
  }
  req.user = user;
  // if (user.role !== "admin") {
  //     return next(new ErrorHandler("access is unauthorized", 401))
  // }
  next();
});
export const newUserOnly = asyncErrorHandler(async (req, res, next) => {

  const authToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  // console.log("authtoken type =>  ", typeof authToken, "and", authToken);
  if (!authToken) return next(new ErrorHandler("Token not present", 401));

  if (typeof authToken !== "string") {
    return next(new ErrorHandler("Token is not string", 401));
  }

  const verifyAuth = await getUid(authToken);

  if (verifyAuth.uid.length < 1)
    return next(new ErrorHandler("Token is invalid ", 401));

  next();
});
// middleware to allow only specifice email to  access controllers
export const adminOnly = asyncErrorHandler(async (req, res, next) => {
  // console.log(
  //   "req.header",
  //   req.header("Authorization")?.replace("Bearer ", "")
  // );
  const authToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  // console.log("authtoken type =>  ", typeof authToken, "and", authToken);

  if (!authToken) return next(new ErrorHandler("Token not present", 401));
  if (typeof authToken !== "string") {
    return next(new ErrorHandler("Token is not string", 401));
  }

  const verifyAuth = await getUid(authToken);

  // console.log("------------------- xxxxx------------------");
  // console.log(verifyAuth, "and uid is ", verifyAuth.uid);
  // console.log("------------------- xxxxx------------------");

  if (verifyAuth.uid.length < 1)
    return next(new ErrorHandler("Token is invalid ", 401));

  const user = await User.findOne({ uid: verifyAuth.uid });
  // console.log(user);
  if (!user) return next(new ErrorHandler("your id is invalid", 401));
  const roleDetails = await Role.findOne({ _id: user.role })
  // if (user.email !== "mobilenmobile2024@gmail.com") {
  //   return next(new ErrorHandler("you are not authorized to perform this operation ", 401));
  // }

  if (roleDetails?.roleName !== "admin") {
    return next(new ErrorHandler("you don't have edit access", 401));
  }

  req.user = user;
  // if (user.role !== "admin") {
  //     return next(new ErrorHandler("access is unauthorized", 401))
  // }
  next();
});
// middleware to allow only specifice email to  access controllers
export const EditorOnly = asyncErrorHandler(async (req, res, next) => {
  // console.log(
  //   "req.header",
  //   req.header("Authorization")?.replace("Bearer ", "")
  // );
  const authToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  // console.log("authtoken type =>  ", typeof authToken, "and", authToken);

  if (!authToken) return next(new ErrorHandler("Token not present", 401));
  if (typeof authToken !== "string") {
    return next(new ErrorHandler("Token is not string", 401));
  }

  const verifyAuth = await getUid(authToken);

  // console.log("------------------- xxxxx------------------");
  // console.log(verifyAuth, "and uid is ", verifyAuth.uid);
  // console.log("------------------- xxxxx------------------");

  if (verifyAuth.uid.length < 1)
    return next(new ErrorHandler("Token is invalid ", 401));

  const user = await User.findOne({ uid: verifyAuth.uid });
  // console.log(user);
  if (!user) return next(new ErrorHandler("your id is invalid", 401));
  const roleDetails = await Role.findOne({ _id: user.role })
  //check if user is not admin or editor don't give edit access
  if ((roleDetails?.roleName !== "editor") && (roleDetails?.roleName !== "admin")) {
    return next(new ErrorHandler("you don't have edit access", 401));
  }
  req.user = user;
  // if (user.role !== "admin") {
  //     return next(new ErrorHandler("access is unauthorized", 401))
  // }
  next();
});
// middleware to allow only specifice email to  access controllers
export const UserInfo = asyncErrorHandler(async (req, res, next) => {
  const authToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  // console.log("authtoken type =>  ", typeof authToken, "and", authToken);

  if (!authToken) return next(new ErrorHandler("Token not present", 401));
  if (typeof authToken !== "string") {
    return next(new ErrorHandler("Token is not string", 401));
  }

  const verifyAuth = await getUid(authToken);

  // console.log("------------------- xxxxx------------------");
  // console.log(verifyAuth, "and uid is ", verifyAuth.uid);
  // console.log("------------------- xxxxx------------------");

  if (verifyAuth.uid.length < 1)
    return next(new ErrorHandler("Token is invalid ", 401));

  const user = await User.findOne({ uid: verifyAuth.uid });
  // console.log(user);
  if (!user) return next(new ErrorHandler("your id is invalid", 401));
  const roleDetails = await Role.findOne({ _id: user.role })
  //check if user is not admin or editor don't give edit access
  if ((roleDetails?.roleName !== "editor") && (roleDetails?.roleName !== "admin")) {
    return next(new ErrorHandler("you don't have edit access", 401));
  }
  req.user = user;
  // if (user.role !== "admin") {
  //     return next(new ErrorHandler("access is unauthorized", 401))
  // }
  return res.json({
    success: true,
    message: "user is authorized"
  })

});
