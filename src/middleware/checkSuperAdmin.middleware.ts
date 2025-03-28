import { NextFunction, Request, Response } from "express";
import catchError from "../utils/catch-error.util";
import { UnauthorizedError } from "../errors/errors";
import { authenticateAdmin } from "../utils/auth.util";

export const checkSuperAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin = await authenticateAdmin(req);

    if (!admin.isSuperAdmin) return next(new UnauthorizedError());

    req.admin = admin;
    next();
  } catch (error) {
    catchError(error, res);
  }
};
