import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { template_type_enum } from "../../enums/enums";

export class CreateTemplateDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(template_type_enum, {
    message: "Noto‘g‘ri shablon turi (enum) kiritildi",
  })
  type: template_type_enum;

  @IsString()
  @IsNotEmpty()
  recipient_number_column: string;

  @IsString()
  @IsNotEmpty()
  sms_template: string;
}

export class UpdateTemplateDTO {
  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  @IsEnum(template_type_enum, {
    message: "Noto‘g‘ri shablon turi (enum) kiritildi",
  })
  type: template_type_enum;

  @IsString()
  @IsOptional()
  recipient_number_column: string;

  @IsString()
  @IsOptional()
  sms_template: string;
}
