import {
  Request,
  Response,
  NextFunction,
  RequestHandler as ExpressRequestHandler,
} from "express";

const asyncHandler = (requestHandler: ExpressRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
