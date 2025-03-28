/** @format */
import { Router } from "express";
import AuthController from "./auth.controller";
import { checkAdminMiddleware } from "../../middleware/checkAdmin.middleware";
import { checkSuperAdminMiddleware } from "../../middleware/checkSuperAdmin.middleware";

export default class AuthRouter {
  public path: string = "/auth";
  public router: Router = Router();
  private controller: AuthController = new AuthController();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/get-admins",
      checkSuperAdminMiddleware,
      this.controller.getAllAdmins,
    );
    this.router.get(
      "/get-admin-by-token",
      checkAdminMiddleware,
      this.controller.getAdminByToken,
    );
    this.router.post(
      "/register",
      checkSuperAdminMiddleware,
      this.controller.registerAdmin,
    );
    this.router.post("/login", this.controller.loginAdmin);
    this.router.put(
      "/:id",
      checkSuperAdminMiddleware,
      this.controller.updateAdmin,
    );
    this.router.delete(
      "/:id",
      checkSuperAdminMiddleware,
      this.controller.deleteAdmin,
    );
  }
}
