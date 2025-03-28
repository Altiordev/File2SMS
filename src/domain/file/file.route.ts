/** @format */

import { Router } from "express";
import FileUploadController from "./file.controller";
import { checkAdminMiddleware } from "../../middleware/checkAdmin.middleware";

class FileRoute {
  public path = "/file";
  public router: Router = Router();
  public controller: FileUploadController = new FileUploadController();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/upload", checkAdminMiddleware, this.controller.upload);
    this.router.post(
      "/upload-multiple",
      checkAdminMiddleware,
      this.controller.uploadMultiple,
    );
  }
}

export default FileRoute;
