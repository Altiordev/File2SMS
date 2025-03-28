import { NextFunction, Request, Response } from "express";
import catchError from "../utils/catch-error.util";
import { authenticateAdmin } from "../utils/auth.util";

export const checkAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.admin = await authenticateAdmin(req);
    next();
  } catch (error) {
    catchError(error, res);
  }
};
