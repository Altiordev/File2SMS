/** @format */
import { Router } from "express";
import TemplateController from "./template.controller";
import { checkAdminMiddleware } from "../../middleware/checkAdmin.middleware";

class TemplateRoute {
  public path = "/template";
  public router = Router();
  private ctrl: TemplateController = new TemplateController();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get("/", this.ctrl.getAll);
    this.router.get("/:id", this.ctrl.getOne);
    this.router.post("/", checkAdminMiddleware, this.ctrl.create);
    this.router.put("/:id", checkAdminMiddleware, this.ctrl.update);
    this.router.delete("/:id", checkAdminMiddleware, this.ctrl.delete);
  }
}

export default TemplateRoute;
