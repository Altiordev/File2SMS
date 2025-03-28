/** @format */

import path from "path";
import FileModel from "./file.model";
import fs from "fs";
import { IFile, IFileModel } from "../../interfaces/file.interface";
import { BadRequestError } from "../../errors/errors";
import { ErrorMessage } from "../../enums/error-message.enum";

class FileUploadRepo {
  private model = FileModel;

  public upload = async (file: IFile): Promise<IFileModel> => {
    let baseName: string = path.basename(file.name, path.extname(file.name));
    const extName: string = path.extname(file.name);

    baseName = baseName
      .normalize("NFC")
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, "-");

    let filePath: string = path.join(
      path.resolve(),
      "src",
      "public",
      "files",
      `${baseName}${extName}`,
    );

    // Fayl nomining takrorlanishini tekshirish va yangi nom yasash
    let fullNameFile: string = path.basename(filePath);
    const baseFilePath = path.join(
      path.resolve(),
      "src",
      "public",
      "files",
      baseName,
    );
    let counter = 1;

    // Fayl mavjudligini tekshirib, nomni takrorlanishini oldini olamiz
    while (fs.existsSync(filePath)) {
      fullNameFile = `${baseName}-${counter}${extName}`;
      filePath = `${baseFilePath}-${counter}${extName}`;
      counter++;
    }

    await file.mv(filePath);

    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSize = {
      bytes: fileSizeInBytes,
      kb: (fileSizeInBytes / 1024).toFixed(2),
      mb: (fileSizeInBytes / (1024 * 1024)).toFixed(2),
      gb: (fileSizeInBytes / (1024 * 1024 * 1024)).toFixed(2),
    };

    let contentType = file.mimetype;
    if (
      [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.mimetype)
    ) {
      contentType = "Word";
    } else if (
      [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(file.mimetype)
    ) {
      contentType = "Excel";
    } else if (
      [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ].includes(file.mimetype)
    ) {
      contentType = "PowerPoint";
    } else if (file.mimetype === "application/pdf") {
      contentType = "PDF";
    }

    return this.model.create({
      file_name: baseName,
      file_path: `/public/files/${fullNameFile}`,
      content_type: contentType,
      extension: extName,
      file_size: fileSize,
    });
  };

  public async findFileById(file_id: string): Promise<Buffer> {
    const file: IFileModel | null = await this.model.findByPk(file_id);

    if (!file) {
      throw new BadRequestError(ErrorMessage.FileNotFound);
    }

    const filePath: string = path.join(__dirname, `../..${file.file_path}`);

    // const filePath: string = path.join(path.resolve(), file.file_path);
    return fs.readFileSync(filePath);
  }
}

export default FileUploadRepo;
