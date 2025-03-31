/** @format */
import TemplateModel from "./template.model";
import { CreateTemplateDTO, UpdateTemplateDTO } from "./template.dto";
import fs from "fs";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "../../errors/errors";
import path from "path";
import { Op } from "sequelize";

class TemplateRepo {
  private templateModel = TemplateModel;

  public async findAll(): Promise<TemplateModel[] | []> {
    return await this.templateModel.findAll();
  }

  /**
   * Bitta shablonni PK (id) bo'yicha olish
   */
  public async findById(id: string): Promise<TemplateModel> {
    const template = await this.templateModel.findByPk(id);
    if (!template) {
      throw new NotFoundError("Shablon topilmadi!");
    }
    return template;
  }

  public async create(data: CreateTemplateDTO) {
    try {
      const templateDirPath = path.join(process.cwd(), "public", data.name);

      if (fs.existsSync(templateDirPath)) {
        throw new ConflictError(
          `'${data.name}' nomli shablon papkasi allaqachon mavjud`,
        );
      }

      fs.mkdirSync(templateDirPath);

      const sentDirPath: string = path.join(templateDirPath, "sent");
      fs.mkdirSync(sentDirPath);

      return await this.templateModel.create({ ...data });
    } catch (error) {
      throw new InternalServerError((error as Error).message);
    }
  }

  public async update(id: string, data: UpdateTemplateDTO) {
    try {
      const oldTemplate = await this.templateModel.findByPk(id);
      if (!oldTemplate) {
        throw new NotFoundError("Shablon topilmadi!");
      }

      const oldName = oldTemplate.name;
      const newName = data.name ?? oldName;

      if (newName !== oldName) {
        const oldDirPath = path.join(process.cwd(), "public", oldName);
        const newDirPath = path.join(process.cwd(), "public", newName);

        if (!fs.existsSync(oldDirPath)) {
          throw new NotFoundError(`Papka topilmadi, eski nom: ${oldName}`);
        }

        if (fs.existsSync(newDirPath)) {
          throw new ConflictError(
            `Yangi nom '${newName}' bilan papka mavjud, rename imkonsiz`,
          );
        }

        // Rename
        fs.renameSync(oldDirPath, newDirPath);
      }

      // 3) Qolgan maydonlarni update: (type, recipient_number_column, sms_template, ...)
      oldTemplate.name = newName;
      if (data.type !== undefined) {
        oldTemplate.type = data.type;
      }
      if (data.recipient_number_column !== undefined) {
        oldTemplate.recipient_number_column = data.recipient_number_column;
      }
      if (data.sms_template !== undefined) {
        oldTemplate.sms_template = data.sms_template;
      }

      // DB saqlash
      await oldTemplate.save();
      return oldTemplate;
    } catch (error) {
      throw new InternalServerError((error as Error).message);
    }
  }

  public async delete(id: string) {
    try {
      const template = await this.templateModel.findByPk(id);
      if (!template) {
        throw new NotFoundError("Shablon topilmadi!");
      }

      const templateDirPath = path.join(process.cwd(), "public", template.name);

      // Agar papka umuman bo'lmasa, ehtimol oldindan o'chirilgan bo'lishi mumkin
      if (!fs.existsSync(templateDirPath)) {
        // Shunda ham DBdagi yozuvni o'chiramiz
        await template.destroy();
        return { message: "Shablon papkasi topilmadi, lekin DBdan o'chirildi" };
      }

      // 2) Papka ichidagi fayllarni tekshirish
      //   -> agar bo'sh bo'lsa, fs.rmSync(..., { recursive: true }) orqali o'chirish
      // Yordamchi metod yozishimiz ham mumkin, lekin namuna uchun:
      const filesInDir = fs.readdirSync(templateDirPath);
      // .readdirSync() papka ichidagi fayl va papkalar ro'yxatini qaytaradi.
      // Bizda 'sent' deb nomlangan papka ham bor.
      // Avval 'sent' papkasini tekshiramiz, so'ng root'ni.

      // "sent" papkasi bor-yo'qligini tekshiramiz
      const sentDirPath = path.join(templateDirPath, "sent");
      let isFolderEmpty = true;

      if (fs.existsSync(sentDirPath)) {
        const filesInSent = fs.readdirSync(sentDirPath);
        if (filesInSent.length > 0) {
          isFolderEmpty = false;
        }
      }

      // Asosiy papkada 'sent' dan tashqari boshqa fayl yoki papka bo'lmasligi kerak
      // Agar filesInDir length > 1 bo'lsa (masalan, 'sent' + boshqa narsa), demak bu ham bo'sh emas.
      // Ehtiyotkorlik uchun, 'sent'ni ayirib, qolganlarini ham tekshirish mumkin:
      const otherFiles = filesInDir.filter((f) => f !== "sent");
      if (otherFiles.length > 0) {
        isFolderEmpty = false;
      }

      if (!isFolderEmpty) {
        throw new BadRequestError(
          "Shablon papkasini o'chirib bo'lmaydi. Ichida fayllar mavjud.",
        );
      }

      // 3) Endi folder ham bo'sh ekan, o'chiramiz
      fs.rmSync(templateDirPath, { recursive: true, force: true });

      // 4) DBdan o'chiramiz
      await template.destroy();

      return { message: "Shablon muvaffaqiyatli o'chirildi" };
    } catch (error) {
      throw new InternalServerError((error as Error).message);
    }
  }

  public async findByName(name: string): Promise<TemplateModel | null> {
    return this.templateModel.findOne({
      where: { name: { [Op.eq]: name } },
    });
  }
}

export default TemplateRepo;
