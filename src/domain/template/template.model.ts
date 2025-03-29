import { UUIDV4 } from "sequelize";
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  IsUUID,
  Default,
  DataType,
} from "sequelize-typescript";
import { template_type_enum } from "../../enums/enums";

@Table({
  timestamps: true,
  schema: "sms",
  tableName: "template",
})
class TemplateModel extends Model {
  @IsUUID(4)
  @Default(UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column(DataType.STRING)
  name: string;

  @Column({
    type: DataType.ENUM,
    values: Object.values(template_type_enum),
  })
  type: template_type_enum;

  @Column(DataType.STRING)
  recipient_number_column: string;

  @Column(DataType.TEXT)
  sms_template: string;
}

export default TemplateModel;
