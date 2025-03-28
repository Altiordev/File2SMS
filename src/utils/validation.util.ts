import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { ValidationError } from "../errors/validation.error";

export const validation = async (dto: any, object: any, params = {}) => {
  const data = plainToClass(dto, object);

  const errors = await validate(data, params);

  if (errors.length) {
    throw new ValidationError(errors);
  }
};
