/** @format */
import TemplateRepo from "./template.repo";
import TemplateModel from "./template.model";
import { CreateTemplateDTO, UpdateTemplateDTO } from "./template.dto";
import SmsService from "../sms/sms.service";
import { NotFoundError } from "../../errors/errors";
import path from "path";
import fs from "fs";
import { Workbook, Worksheet } from "exceljs";
import { template_type_enum } from "../../enums/enums";

class TemplateService {
  private repo: TemplateRepo = new TemplateRepo();
  private smsService: SmsService = new SmsService();

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
        adminId: 1, // kim yuborayotgan bo'lsa, real loyihada berishingiz mumkin
        sms_type: template.type || template_type_enum.OTHER,
      });
      sentCount++;
    }

    console.log(
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
