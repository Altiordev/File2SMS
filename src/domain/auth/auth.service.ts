import CoreRepo from "../core/core.repo";
import { ErrorMessage } from "../../enums/error-message.enum";
import { LoginAdminDto, RegisterAdminDto, UpdateAdminDto } from "./auth.dto";
import AdminsModel from "./models/admin.model";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/errors";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { IPayloadAdmin } from "../../interfaces/auth.interface";
import AdminModel from "./models/admin.model";
import { VerifyTokenFuncType } from "../../interfaces/interfaces";

dotenv.config();

export default class AuthService {
  private model = AdminsModel;
  private repo: CoreRepo = new CoreRepo();

  public async getAllAdmins() {
    return this.repo.getAllNoPagination({
      model: this.model,
    });
  }

  public async getAdminByUsername(
    username: string | undefined,
  ): Promise<AdminModel | null> {
    return await this.repo.findOne({
      model: this.model,
      where: { username: username?.trim()?.toLowerCase() },
    });
  }

  public async register(data: RegisterAdminDto): Promise<AdminsModel> {
    const { username, password } = data;

    const admin: AdminsModel | null = await this.getAdminByUsername(username);
    if (admin) {
      throw new ConflictError(ErrorMessage.UsernameAlreadyTaken);
    }

    const hashedPassword = await this.hashPassword(password);

    if (data.isSuperAdmin) delete data.isSuperAdmin;

    return await this.repo.create({
      model: this.model,
      newData: {
        ...data,
        username: data.username.trim().toLowerCase(),
        password: hashedPassword,
      },
    });
  }

  public async login(data: LoginAdminDto): Promise<{ token: string }> {
    const { username, password } = data;

    const admin: AdminsModel | null = await this.getAdminByUsername(username);

    if (!admin) {
      throw new BadRequestError(ErrorMessage.InvalidLoginData);
    }

    const isPasswordValid: boolean = await this.comparePasswords(
      password,
      admin.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestError(ErrorMessage.InvalidLoginData);
    }

    const payload: IPayloadAdmin = {
      id: admin.id,
      username: admin.username,
    };

    const token: string = this.generateToken(payload);

    return { token };
  }

  public async updateAdmin(
    adminId: string,
    updateData: UpdateAdminDto,
  ): Promise<void> {
    const { password, username, ...otherData } = updateData;
    let hashedPassword: string | undefined;

    if (password) {
      hashedPassword = await this.hashPassword(password);
    }

    const admin: AdminModel | null = await this.repo.findByPK({
      model: this.model,
      id: adminId,
    });
    if (!admin) {
      throw new NotFoundError(`Admin with ID:${adminId} not found`);
    }

    if (otherData.isSuperAdmin) delete otherData.isSuperAdmin;

    await admin.update({
      ...otherData,
      ...(hashedPassword && { password: hashedPassword }),
    });
  }

  public async deleteAdmin(id: string): Promise<void> {
    await this.repo.delete({
      model: this.model,
      where: { id },
    });
  }

  private generateToken(payload: IPayloadAdmin): string {
    return sign(payload, process.env.JWT_SECRET || "secret", {
      expiresIn: "10d",
    });
  }

  public verifyToken: VerifyTokenFuncType = (token: string): IPayloadAdmin => {
    const decoded: string | JwtPayload = verify(
      token,
      process.env.JWT_SECRET || "secret",
    );
    if (typeof decoded === "string") {
      throw new UnauthorizedError("Invalid token format");
    }
    return decoded as IPayloadAdmin;
  };

  private async hashPassword(password: string): Promise<string> {
    if (!process.env.BCRYPT_SALT) {
      throw new Error("BCRYPT_SALT is not defined in environment variables");
    }

    return bcrypt.hash(password, Number(process.env.BCRYPT_SALT));
  }

  private async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
