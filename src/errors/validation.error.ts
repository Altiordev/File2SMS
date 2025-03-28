import { ValidationError as ClassValidatorError } from "class-validator";
import { BaseError } from "./errors";

export class ValidationError extends BaseError {
  constructor(errors: ClassValidatorError[]) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints || {}),
    );
    super(422, "VALIDATION_ERROR", messages);
  }
}
