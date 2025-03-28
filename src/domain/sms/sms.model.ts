import { UUIDV4 } from "sequelize";
import {
  Table,
  Column,
  Model,
  IsUUID,
  Default,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import AdminModel from "../auth/models/admin.model";

@Table({
  timestamps: true,
  schema: "sms",
  tableName: "sms",
})
class Sms extends Model {
  @IsUUID(4)
  @Default(UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => AdminModel)
  @Column
  adminId: number;

  @BelongsTo(() => AdminModel)
  admin: AdminModel;

  @Column
  recipient: string;

  @Column(DataType.TEXT)
  message_text: string;

  @Column(DataType.INTEGER)
  play_mobile_status: number;

  @Column
  play_mobile_data: string;
}

export default Sms;
