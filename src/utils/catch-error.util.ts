import { Response } from "express";
import { BaseError } from "../errors/errors";

export default function catchError(error: any, res: Response) {
  if (error instanceof BaseError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(error.data && { data: error.data }),
    });
  } else {
    res.status(500).json({
      message: "Unexpected error occurred",
    });
  }
}
