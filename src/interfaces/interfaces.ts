/** @format */
import { Model } from "sequelize-typescript";
import { ErrorMessage } from "../enums/error-message.enum";
import { IncludeOptions, WhereOptions } from "sequelize";
import { MakeNullishOptional } from "sequelize/types/utils";
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { IPayloadAdmin } from "./auth.interface";

export type VerifyTokenFuncType = (token: string) => IPayloadAdmin;

export interface IError {
  statusCode: number;
  message: ErrorMessage | string;
  data?: object;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
}

export interface IGetAll<T> {
  rows: T[];
  count: number;
}

export interface IGetAllResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface IUniversalCreate<T extends Model> {
  model: typeof Model & { new (): T };
  newData: any;
  where?: Partial<T["_creationAttributes"]> | null;
  existInstanceErrorMsg?: ErrorMessage | string;
}

export interface IUniversalManyCreate<T extends Model> {
  model: typeof Model & { new (): T };
  data: MakeNullishOptional<T["_creationAttributes"]>[];
  ignoreDuplicates?: boolean;
}

export interface IUniversalUpdate<T extends Model> {
  model: typeof Model & { new (): T };
  updateData: Partial<T["_attributes"]>;
  where: WhereOptions<T["_attributes"]> & { id: string | number | bigint };
  checkWhere?: WhereOptions<T["_attributes"]> | null;
  notFoundErrorMsg?: string;
}

export interface IUniversalGetAll<T extends Model> {
  model: typeof Model & { new (): T };
  pagination: IPaginationOptions;
  where?: Partial<T["_attributes"]>;
  order?: any[];
  include?: IncludeOptions[];
}

export interface IUniversalGetAllNoPagination<T extends Model> {
  model: typeof Model & { new (): T };
  where?: Partial<T["_attributes"]> | null;
  order?: any[];
  include?: IncludeOptions[];
}

export interface IUniversalGetByPK<T extends Model> {
  model: typeof Model & { new (): T };
  id: number | string;
  notFoundErrorMsg?: string;
  include?: IncludeOptions[];
  order?: any[];
}

export interface IUniversalGetOne<T extends Model> {
  model: typeof Model & { new (): T };
  where: WhereOptions<T["_attributes"]>;
  notFoundErrorMsg?: string;
  include?: IncludeOptions[];
  order?: any[];
}

export interface IUniversalDelete<T extends Model> {
  model: { new (): T } & typeof Model;
  where: WhereOptions<T["_attributes"]> | null;
  notFoundErrorMsg?: string;
}

export interface IRoute {
  path: string;
  router: Router;
}
