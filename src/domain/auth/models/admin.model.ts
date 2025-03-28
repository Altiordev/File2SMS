import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  AutoIncrement,
  Default,
} from "sequelize-typescript";

@Table({
  timestamps: true,
  schema: "Auth",
  tableName: "Admins",
})
class Admins extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column(DataType.INTEGER)
  id: number;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  username: string;

  @Column(DataType.STRING)
  password: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isSuperAdmin: boolean;
}

export default Admins;
