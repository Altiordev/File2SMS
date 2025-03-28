import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from "class-validator";

export class SmsDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  message_text: string;

  adminId: number;
}

export class SmsForManyRecipientsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  recipients: string[];

  @IsString()
  @IsNotEmpty()
  message_text: string;

  adminId: number;
}
