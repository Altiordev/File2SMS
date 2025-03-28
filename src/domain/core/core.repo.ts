/** @format */
import {
  IGetAll,
  IPaginationOptions,
  IUniversalCreate,
  IUniversalDelete,
  IUniversalGetAll,
  IUniversalGetAllNoPagination,
  IUniversalGetByPK,
  IUniversalGetOne,
  IUniversalManyCreate,
  IUniversalUpdate,
} from "../../interfaces/interfaces";
import { Model } from "sequelize-typescript";
import { FindAndCountOptions, WhereOptions } from "sequelize";
import { ErrorMessage } from "../../enums/error-message.enum";
import { ConflictError, NotFoundError } from "../../errors/errors";

class CoreRepo {
  public async create<T extends Model>({
    model,
    newData,
    where = null,
    existInstanceErrorMsg = "",
  }: IUniversalCreate<T>): Promise<T> {
    let instance: T | null;

    if (where) {
      let created: boolean;
      [instance, created] = await model.findOrCreate({
        where: where as WhereOptions<T["_creationAttributes"]>,
        defaults: { ...newData },
      });

      if (!created) {
        throw new ConflictError(existInstanceErrorMsg);
      }
    } else {
      instance = (await model.create(newData)) as T;
    }

    return instance as T;
  }

  public async manyCreate<T extends Model>({
    model,
    data,
    ignoreDuplicates = false,
  }: IUniversalManyCreate<T>): Promise<T[]> {
    try {
      const instances = await model.bulkCreate(data, {
        ignoreDuplicates,
      });

      return instances as T[];
    } catch (error) {
      throw new ConflictError("Error during bulk creation");
    }
  }

  public async getAll<T extends Model>({
    model,
    pagination,
    where,
    order,
    include,
  }: IUniversalGetAll<T>): Promise<IGetAll<T>> {
    const { page, limit }: IPaginationOptions = pagination;
    const offset: number = (page - 1) * limit;

    const findOptions: FindAndCountOptions<T["_attributes"]> = {
      where: where as WhereOptions<T["_attributes"]>,
      limit,
      offset,
      order: order,
      include: include,
      distinct: true,
    };

    const result: IGetAll<T> = await model.findAndCountAll(findOptions);

    return {
      rows: result.rows,
      count: result.count,
    };
  }

  public async getAllNoPagination<T extends Model>({
    model,
    where,
    order,
    include,
  }: IUniversalGetAllNoPagination<T>): Promise<T[]> {
    const findOptions: FindAndCountOptions<T["_attributes"]> = {
      where: where as WhereOptions<T["_attributes"]>,
      order: order,
      include: include,
    };

    return await model.findAll(findOptions);
  }

  public async findByPK<T extends Model>({
    model,
    id,
    notFoundErrorMsg,
    include,
    order,
  }: IUniversalGetByPK<T>): Promise<T | null> {
    const record = await model.findByPk(id, {
      include: include,
      order: order,
    });

    if (!record) {
      throw new NotFoundError(notFoundErrorMsg || `Record with id ${id}`);
    }

    return record;
  }

  public async findOne<T extends Model>({
    model,
    where,
    include,
    order,
  }: IUniversalGetOne<T>): Promise<T | null> {
    return await model.findOne({
      where: where,
      include: include,
      order: order,
    });
  }

  public async update<T extends Model>({
    model,
    updateData,
    where,
    checkWhere = null,
    notFoundErrorMsg,
  }: IUniversalUpdate<T>): Promise<T | null> {
    if (checkWhere) {
      const existRecord = await model.findOne({
        where: checkWhere,
      });

      if (where?.id) {
        if (existRecord) {
          if (existRecord.id !== where.id) {
            throw new ConflictError(ErrorMessage.AlreadyExists);
          }
        }
      }
    }

    const record = await model.findOne({
      where: where,
    });

    if (!record) {
      throw new NotFoundError(notFoundErrorMsg || "Item");
    }

    await record.update({ ...updateData });

    return record;
  }

  public async delete<T extends Model>({
    model,
    where,
    notFoundErrorMsg,
  }: IUniversalDelete<T>): Promise<void> {
    const record = await model.findOne({
      where: where as WhereOptions<T["_attributes"]>,
    });

    if (!record) {
      throw new NotFoundError(notFoundErrorMsg || "Item");
    }

    await record.destroy();
  }
}

export default CoreRepo;
