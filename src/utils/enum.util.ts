import { ErrorMessage } from "../enums/error-message.enum";
import { ConflictError } from "../errors/errors";

export function checkEnum(value: unknown, enumEntity: object): void {
  if (!Object.values(enumEntity).includes(value)) {
    throw new ConflictError(ErrorMessage.InvalidEnumValue + ": " + value);
  }
}
