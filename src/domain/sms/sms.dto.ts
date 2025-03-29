import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { template_type_enum } from "../../enums/enums";

export class SmsDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  message_text: string;

  adminId: number;

  @IsOptional()
  @IsEnum(template_type_enum, {
    message: "Noto‘g‘ri shablon turi (enum) kiritildi",
  })
  sms_type: template_type_enum;
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
