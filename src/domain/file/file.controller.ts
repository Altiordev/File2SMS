import { NextFunction, Request, Response } from "express";
import FileUploadService from "./file.service";
import { IFile, IFileModel } from "../../interfaces/file.interface";
import { BadRequestError } from "../../errors/errors";
import { ErrorMessage } from "../../enums/error-message.enum";
import { StatusCode } from "../../enums/status-code.enum";

class FileUploadController {
  private service: FileUploadService = new FileUploadService();

  public upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file: IFile = req.files?.file as IFile;
      if (!file) next(new BadRequestError(ErrorMessage.FileRequired));

      const result: IFileModel = await this.service.upload(file);

      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public uploadMultiple = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const files: IFile[] = req.files?.files as IFile[];
      if (!files || files.length === 0)
        next(new BadRequestError(ErrorMessage.FileRequired));

      const result: IFileModel[] = await this.service.uploadMultiple(files);

      res.status(StatusCode.Ok).json({
        ids: result.map((file: IFileModel) => file.id),
        data: result,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}

export default FileUploadController;
