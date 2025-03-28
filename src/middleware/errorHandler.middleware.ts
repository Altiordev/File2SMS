import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { BaseError } from "../errors/errors";
import { IError } from "../interfaces/interfaces";

export const errorHandler: ErrorRequestHandler = (
  err: BaseError | IError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof BaseError) {
    if (err.message === "VALIDATION_ERROR") {
      res.status(422).json({
        message: "VALIDATION_ERROR",
        errors: err.data,
      });
      return;
    }

    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};
