import FileModel from "../domain/file/file.model";

/** @format */
export interface IFile {
  name: string;
  data: Buffer;
  size: number;
  encoding: string;
  tempFilePath?: string;
  truncated: boolean;
  mimetype: string;
  md5: string;
  mv(path: string, callback: (err: any) => void): void;
  mv(path: string): Promise<void>;
}

export interface IFileModel extends FileModel {
  id: string;
  file_name: string;
  file_path: string;
  content_type: string;
  extension: string;
  file_size: {
    bytes: number;
    kb: string;
    mb: string;
    gb: string;
  };
  updatedAt?: Date;
  createdAt?: Date;
}
