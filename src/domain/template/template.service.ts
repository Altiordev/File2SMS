/** @format */
import TemplateRepo from "./template.repo";
import TemplateModel from "./template.model";
import { CreateTemplateDTO, UpdateTemplateDTO } from "./template.dto";
import SmsService from "../sms/sms.service";
import { InternalServerError, NotFoundError } from "../../errors/errors";
import path from "path";
import fs from "fs";
import { Workbook, Worksheet } from "exceljs";
import { template_type_enum } from "../../enums/enums";
import logger from "../../utils/logger.util";
import { ITemplate } from "../../interfaces/template.interface";

class TemplateService {
  private repo: TemplateRepo = new TemplateRepo();
  private smsService: SmsService = new SmsService();

  public async getAllTemplates(): Promise<TemplateModel[]> {
    return this.repo.findAll();
  }

  public async getTemplateById(id: string): Promise<ITemplate> {
    try {
      // 1) DBdan Template topish
      const template: TemplateModel = await this.repo.findById(id);

      // 2) public/<template.name> papka manzilini aniqlash
      const folderPath = path.join(process.cwd(), "public", template.name);
      if (!fs.existsSync(folderPath)) {
        return {
          template,
          files: [],
          sentFiles: [],
        };
      }

      // 3) Asosiy papkada 'sent' dan tashqari fayllarni yig'ish
      const allInFolder = fs.readdirSync(folderPath, { withFileTypes: true });

      // sent papkasidan tashqari faqat FAYL bo'lgan ro'yxat
      const files = allInFolder
        .filter((dirent) => dirent.isFile() && dirent.name !== "sent")
        .map((dirent) => `/public/${template.name}/${dirent.name}`);

      // 4) sent papkasidagi fayllarni ham o‘qiymiz (agar bo‘lsa)
      const sentDir = path.join(folderPath, "sent");
      let sentFiles: string[] = [];
      if (fs.existsSync(sentDir)) {
        const allInSent = fs.readdirSync(sentDir, { withFileTypes: true });
        sentFiles = allInSent
          .filter((dirent) => dirent.isFile())
          .map((dirent) => `/public/${template.name}/sent/${dirent.name}`);
      }

      return { template, files, sentFiles };
    } catch (error) {
      throw new InternalServerError((error as Error).message);
    }
  }

  // public async getTemplateById(id: string): Promise<ITemplate> {
  //   try {
  //     const template: TemplateModel = await this.repo.findById(id);
  //
  //     const folderPath: string = path.join(
  //       process.cwd(),
  //       "public",
  //       template.name,
  //     );
  //     if (!fs.existsSync(folderPath)) {
  //       return {
  //         template,
  //         files: [],
  //         sentFiles: [],
  //       };
  //     }
  //
  //     const files: string[] = fs
  //       .readdirSync(folderPath, { withFileTypes: true })
  //       .filter((dirent: fs.Dirent): boolean => {
  //         return dirent.name !== "sent";
  //       })
  //       .filter((dirent: fs.Dirent) => dirent.isFile())
  //       .map((dirent: fs.Dirent) => dirent.name);
  //
  //     const sentPath: string = path.join(folderPath, "sent");
  //     let sentFiles: string[] = [];
  //     if (fs.existsSync(sentPath)) {
  //       sentFiles = fs
  //         .readdirSync(sentPath, { withFileTypes: true })
  //         .filter((dirent: fs.Dirent) => dirent.isFile())
  //         .map((dirent: fs.Dirent) => dirent.name);
  //     }
  //
  //     return {
  //       template,
  //       files,
  //       sentFiles,
  //     };
  //   } catch (error) {
  //     logger.error((error as Error).message);
  //     throw new InternalServerError((error as Error).message);
  //   }
  // }

  /**
   * Shablon yaratish
   */
  public async create(data: CreateTemplateDTO): Promise<TemplateModel> {
    return this.repo.create(data);
  }

  /**
   * Shablonni yangilash
   */
  public async update(
    id: string,
    data: UpdateTemplateDTO,
  ): Promise<TemplateModel> {
    return this.repo.update(id, data);
  }

  /**
   * Shablonni o'chirish
   */
  public async delete(id: string): Promise<{ message: string }> {
    return this.repo.delete(id);
  }

  /**
   * Excel faylni o'qish + har bir row bo'yicha SMS yuborish
   * @param folderName => public/folderName
   * @param excelFileName => .xlsx fayl nomi
   *
   * 1) DBdan template ni folderName bo'yicha topamiz
   * 2) excelni o'qib, row => phoneNumber va placeholder'lar
   * 3) smsService.send_message(...) chaqiramiz
   * 4) SMS yuborib bo'lgach, success bo'lsa, "sent" ga move qilinadi
   */
  public async processExcelAndSendSMS(
    folderName: string,
    excelFileName: string,
  ): Promise<void> {
    // 1) DBdan topish
    const template: TemplateModel | null =
      await this.repo.findByName(folderName);
    if (!template) {
      throw new NotFoundError(`DBda shablon topilmadi! name='${folderName}'`);
    }

    // 2) Excel fayl manzili
    const excelFilePath = path.join(
      process.cwd(),
      "public",
      folderName,
      excelFileName,
    );

    if (!fs.existsSync(excelFilePath)) {
      throw new NotFoundError(`Excel fayl topilmadi: ${excelFileName}`);
    }

    // 3) Excelni o'qish
    const workbook = new Workbook();
    await workbook.xlsx.readFile(excelFilePath);

    const worksheet: Worksheet | undefined = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new NotFoundError(`Excelda 1-chi varaq topilmadi!`);
    }

    let sentCount = 0;

    // row => har bir satr
    for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);

      // recipient_number_column => masalan, "C"
      const phoneCell = row.getCell(template.recipient_number_column);
      if (!phoneCell || !phoneCell.value) {
        // row da telefon raqam bo'lmasa skip
        continue;
      }

      const phoneNumber = String(phoneCell.value).trim();
      if (!phoneNumber) {
        continue;
      }

      // sms_template => "Assalomu alaykum $$A$$"
      // bu yerda placeholder'larni row'dagi cell'lar bilan almashtirish
      const messageText = this.buildMessageFromRow(template.sms_template, row);

      // SMS yuborish
      await this.smsService.send_message({
        recipient: phoneNumber,
        message_text: messageText,
        adminId: 1,
        sms_type: template.type || template_type_enum.OTHER,
      });
      sentCount++;
    }

    logger.info(
      `Shablon[${template.name}] Excel fayl[${excelFileName}] bo'yicha ${sentCount} ta SMS yuborildi.`,
    );
  }

  /**
   * Shablon matnidagi $$A$$, $$B$$, $$C$$ kabi placeholder'larni
   * Excel row ning tegishli cell qiymatlari bilan almashtirish.
   */
  private buildMessageFromRow(templateStr: string, row: any): string {
    const placeholderRegex = /\$\$([A-Z]+)\$\$/g;

    return templateStr.replace(placeholderRegex, (match, colLetter) => {
      const cellValue = row.getCell(colLetter)?.value || "";
      return String(cellValue).trim();
    });
  }
}

export default TemplateService;
