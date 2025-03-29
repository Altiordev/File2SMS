import path from "path";
import fs from "fs";
import FileModel from "./file.model";
import { IFile, IFileModel } from "../../interfaces/file.interface";
import { BadRequestError } from "../../errors/errors";
import { ErrorMessage } from "../../enums/error-message.enum";

class FileUploadRepo {
  private model = FileModel;

  public async upload(file: IFile): Promise<IFileModel> {
    let baseName: string = path.basename(file.name, path.extname(file.name));
    const extName: string = path.extname(file.name);

    // Fayl nomini tozalash
    baseName = baseName
      .normalize("NFC")
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, "-");

    // public/files ga yuklaymiz
    let filePath: string = path.join(
      process.cwd(),
      "public",
      "files",
      `${baseName}${extName}`,
    );

    // Fayl nomi takrorlangan bo‘lsa, -1, -2, va hk. qilib nom berish
    let fullNameFile: string = path.basename(filePath);
    const baseFilePath = path.join(process.cwd(), "public", "files", baseName);

    let counter = 1;
    while (fs.existsSync(filePath)) {
      fullNameFile = `${baseName}-${counter}${extName}`;
      filePath = `${baseFilePath}-${counter}${extName}`;
      counter++;
    }

    // Faylni `file.mv(...)` orqali ko‘chiramiz
    await file.mv(filePath);

    // Fayl o‘lchamini olish
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSize = {
      bytes: fileSizeInBytes,
      kb: (fileSizeInBytes / 1024).toFixed(2),
      mb: (fileSizeInBytes / (1024 * 1024)).toFixed(2),
      gb: (fileSizeInBytes / (1024 * 1024 * 1024)).toFixed(2),
    };

    // Fayl turini aniqlash (Word, Excel, PDF, va h.k.)
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

    // Bazaga yozish
    return this.model.create({
      file_name: baseName,
      file_path: `/public/files/${fullNameFile}`,
      content_type: contentType,
      extension: extName,
      file_size: fileSize,
    });
  }

  // Faylni ID bo‘yicha chaqirib, o‘qib olish misoli
  public async findFileById(file_id: string): Promise<Buffer> {
    const file: IFileModel | null = await this.model.findByPk(file_id);

    if (!file) {
      throw new BadRequestError(ErrorMessage.FileNotFound);
    }

    // Bazada saqlangani: /public/files/... bo‘lsa
    // Fizik manzili: process.cwd() + public/files/...
    const filePath: string = path.join(
      process.cwd(),
      file.file_path, // bunda "/public/files/filename.ext"
    );

    return fs.readFileSync(filePath);
  }
}

export default FileUploadRepo;
