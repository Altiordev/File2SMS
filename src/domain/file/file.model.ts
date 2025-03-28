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

@Table({
  timestamps: true,
  schema: "File",
  tableName: "Files",
})
class FileModel extends Model {
  @IsUUID(4)
  @Default(UUIDV4)
  @PrimaryKey
  @Column
  id: string;

  @Column
  file_name: string;

  @Column
  file_path: string;

  @Column(DataType.STRING)
  content_type: string;

  @Column(DataType.STRING)
  extension: string;

  @Column(DataType.JSON)
  file_size: {
    bytes: number;
    kb: string;
    mb: string;
    gb: string;
  };
}

export default FileModel;
