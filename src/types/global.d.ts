import AdminModel from "../domain/auth/models/admin.model";

declare global {
  namespace Express {
    interface Request {
      admin: AdminModel | null;
    }
  }
}

export {};
