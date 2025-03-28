/** @format */

import FileUploadRepo from "./file.repo";
import { IFile, IFileModel } from "../../interfaces/file.interface";

class FileUploadService {
  private repo: FileUploadRepo = new FileUploadRepo();

  public async upload(file: IFile): Promise<IFileModel> {
    const { dataValues } = await this.repo.upload(file);

    return dataValues;
  }

  public async uploadMultiple(files: IFile[] | IFile): Promise<IFileModel[]> {
    const filesArray: IFile[] = Array.isArray(files) ? files : [files];

    const uploadPromises: Promise<IFileModel>[] = filesArray.map(
      (file: IFile) => this.repo.upload(file),
    );
    return Promise.all(uploadPromises);
  }
}

export default FileUploadService;
