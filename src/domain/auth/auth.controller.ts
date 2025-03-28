import { NextFunction, Request, Response } from "express";
import AuthService from "./auth.service";
import { validation } from "../../utils/validation.util";
import { LoginAdminDto, RegisterAdminDto, UpdateAdminDto } from "./auth.dto";

export default class AuthController {
  private service: AuthService = new AuthService();

  public getAllAdmins = async (
    _: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const admins = await this.service.getAllAdmins();
      res.status(200).json(admins);
    } catch (error) {
      next(error);
    }
  };

  public registerAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await validation(RegisterAdminDto, req.body);

      const newAdmin = await this.service.register(req.body);

      res.status(201).json(newAdmin);
    } catch (error) {
      next(error);
    }
  };

  public loginAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await validation(LoginAdminDto, req.body);

      const adminData = await this.service.login(req.body);

      res.status(200).json(adminData);
    } catch (error) {
      next(error);
    }
  };

  public updateAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await validation(UpdateAdminDto, req.body);

      await this.service.updateAdmin(req.params.id, req.body);

      res.status(200).json({ message: "Admin updated successfully" });
    } catch (error) {
      next(error);
    }
  };

  public getAdminByToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const admin = await this.service.getAdminByUsername(req.admin?.username);

      res.status(200).json(admin);
    } catch (error) {
      next(error);
    }
  };

  public deleteAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.service.deleteAdmin(req.params.id);
      res.status(200).json({ message: "Admin deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
