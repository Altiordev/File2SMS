import { Request } from "express";
import { IPayloadAdmin } from "../interfaces/auth.interface";
import { UnauthorizedError, ForbiddenError } from "../errors/errors";
import AuthService from "../domain/auth/auth.service";
import AdminModel from "../domain/auth/models/admin.model";

export const authenticateAdmin = async (req: Request): Promise<AdminModel> => {
  const token: string | undefined = req.headers["authorization"];

  if (!token) throw new UnauthorizedError();

  const authService = new AuthService();
  const payload: IPayloadAdmin = authService.verifyToken(token);

  const admin: AdminModel | null = await authService.getAdminByUsername(
    payload.username,
  );
  if (!admin) throw new ForbiddenError();

  return admin;
};
