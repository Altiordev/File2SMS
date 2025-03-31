import SmsRepo from "./sms.repo";
import {
  IFilterBodySms,
  IGetAllSms,
  ISentSmsHistory,
  ISentSmsHistoryModel,
  ISms,
  ISmsModel,
  IUpdateSms,
} from "../../interfaces/sms.interface";
import axios from "axios";
import * as console from "console";
import { SmsDto, SmsForManyRecipientsDto } from "./sms.dto";
import FileRepo from "../file/file.repo";
import dotenv from "dotenv";
import AdminModel from "../auth/models/admin.model";
import Exceljs, { Row, Workbook, Worksheet } from "exceljs";
import { template_type_enum } from "../../enums/enums";
import SmsModel from "./sms.model";
import logger from "../../utils/logger.util";

dotenv.config();

export default class SmsService {
  private repo: SmsRepo = new SmsRepo();
  private fileRepo: FileRepo = new FileRepo();

  public async getSentSmsHistory(): Promise<ISentSmsHistory[]> {
    const results: ISentSmsHistoryModel[] = await this.repo.getSentSmsHistory();

    return results.map((result): ISentSmsHistory => {
      const totalSms: number = result.totalSms;
      const priceNumber: number = totalSms * 100;
      const priceInWords: string = this.convertNumberToWords(priceNumber);

      return {
        adminId: result.adminId ?? null,
        totalSms,
        lastSmsDate: new Date(result.lastSmsDate),
        admin: result.admin?.name ?? null,
        price: {
          number: priceNumber,
          inWords: priceInWords + " so‘m",
        },
      };
    });
  }

  public async get_all_messages({
    admin,
    page,
    limit,
    filter,
  }: {
    admin: AdminModel;
    page: number;
    limit: number;
    filter: IFilterBodySms;
  }): Promise<IGetAllSms> {
    const offset: number = (page - 1) * limit;
    const adminId: number = admin.id;

    return await this.repo.get_all({
      adminId,
      isSuperAdmin: admin.isSuperAdmin,
      offset,
      limit,
      filter,
    });
  }

  public async send_messages_to_recipients_from_excel(data: {
    file_id: string;
    message_text: string;
    adminId: number;
  }): Promise<string> {
    const fileBuffer: Buffer = await this.fileRepo.findFileById(data.file_id);

    const workbook: Workbook = new Exceljs.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet: Worksheet | undefined = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("Excel faylda 1-chi varaq (sheet) topilmadi.");
    }
    const recipients: string[] = [];

    worksheet.eachRow((row: Row): void => {
      const recipient: string = row.getCell(1).text;
      if (recipient) {
        recipients.push(recipient);
      }
    });

    const dataForMethod: SmsForManyRecipientsDto = {
      recipients,
      message_text: data.message_text,
      adminId: data.adminId,
    };

    return this.send_message_many_recipients(dataForMethod);
  }

  public send_message_many_recipients(data: SmsForManyRecipientsDto): string {
    const { recipients } = data;
    const batchSize: number = 100;
    const delayBetweenBatches: number = 300; // 300 millisekund

    // Kerakli umumiy batchlar sonini hisoblash
    const totalBatches: number = Math.ceil(recipients.length / batchSize);

    // Umumiy aniq vaqtni millisekundlarda hisoblash
    const totalDurationMs: number = (totalBatches - 1) * delayBetweenBatches;

    // Vaqtni daqiqa va sekundlarga aylantirish
    const duration: string = this.formatDuration(totalDurationMs);

    // Asinxron jo'natish jarayonini boshlash
    this.sendMessagesAsync(data, batchSize, delayBetweenBatches);

    return `SMS jo'natish vaqti: ${duration} \n yuborilgan SMS'larni "Xabarlar" bo‘limidan ko‘rishingiz mumkin!`;
  }

  private async sendMessagesAsync(
    data: SmsForManyRecipientsDto,
    batchSize: number,
    delay: number,
  ) {
    const { recipients, message_text } = data;

    for (let i = 0; i < recipients.length; i++) {
      const dataForDB: SmsDto = {
        recipient: recipients[i],
        message_text,
        adminId: data.adminId,
        sms_type: template_type_enum.OTHER,
      };

      // SMSni yuborish
      this.send_message(dataForDB);

      // Har 100 ta SMS yuborilgandan keyin 300 ms kutish
      if ((i + 1) % batchSize === 0 && i + 1 < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  public async send_message(data: SmsDto): Promise<ISmsModel> {
    const { recipient, message_text, sms_type } = data;

    if (!sms_type) {
      data.sms_type = template_type_enum.OTHER;
    }

    const { id } = await this.write_to_database(data);

    const sendData: ISms = {
      recipient,
      message_id: id,
      message_text,
    };

    const response = await this.play_mobile_send(sendData);
    const updateData: IUpdateSms = {
      play_mobile_data: response.data,
      play_mobile_status: response.status,
    };

    const updatedSms = await this.repo.update(id, updateData);
    if (!updatedSms) {
      throw new Error("SMS topilmadi yoki yangilanmadi.");
    }

    return updatedSms.get({ plain: true });
  }

  private async write_to_database(data: SmsDto): Promise<SmsModel> {
    return await this.repo.create(data);
  }

  private async play_mobile_send(data: ISms) {
    const { recipient, message_id, message_text }: ISms = data;
    const body = {
      messages: {
        recipient: recipient,
        "message-id": message_id,
        sms: {
          originator: "3700",
          content: {
            text: message_text,
          },
        },
      },
    };

    if (!process.env.SMS_BROKER_API || !process.env.SMS_BROKER_TOKEN) {
      throw new Error(
        "SMS_BROKER_API or SMS_BROKER_TOKEN is not defined in environment variables",
      );
    }

    try {
      return await axios.post(
        process.env.SMS_BROKER_API,
        JSON.stringify(body),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.SMS_BROKER_TOKEN,
          },
        },
      );
    } catch (e: any) {
      logger.error(`send_sms metodida xatolik: ${e}`);

      return e?.response ?? { status: 500, data: "Internal Server Error" };
    }
  }

  private convertNumberToWords(num: number): string {
    const units = [
      "",
      "bir",
      "ikki",
      "uch",
      "to'rt",
      "besh",
      "olti",
      "yetti",
      "sakkiz",
      "to'qqiz",
    ];
    const teens = [
      "o'n",
      "o'n bir",
      "o'n ikki",
      "o'n uch",
      "o'n to'rt",
      "o'n besh",
      "o'n olti",
      "o'n yetti",
      "o'n sakkiz",
      "o'n to'qqiz",
    ];
    const tens = [
      "",
      "",
      "yigirma",
      "o'ttiz",
      "qirq",
      "ellik",
      "oltmish",
      "yetmish",
      "sakson",
      "to'qson",
    ];
    const thousands = ["", "ming", "million", "milliard"];

    if (num === 0) return "nol";

    let words = "";

    for (let i = 0, n = num; n > 0; i++) {
      const chunk = n % 1000;
      if (chunk) {
        let chunkWords = "";

        const hundreds = Math.floor(chunk / 100);
        const remainder = chunk % 100;

        if (hundreds > 0) {
          chunkWords += `${units[hundreds]} yuz `;
        }

        if (remainder < 10) {
          chunkWords += units[remainder];
        } else if (remainder < 20) {
          chunkWords += teens[remainder - 10];
        } else {
          const tensValue = Math.floor(remainder / 10);
          chunkWords += `${tens[tensValue]} ${units[remainder % 10]}`;
        }

        words = `${chunkWords.trim()} ${thousands[i]} ${words}`.trim();
      }
      n = Math.floor(n / 1000);
    }

    return words.trim();
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms} millisoniya`;
    }

    const hours: number = Math.floor(ms / 3600000);
    const minutes: number = Math.floor((ms % 3600000) / 60000);
    const seconds: number = Math.floor((ms % 60000) / 1000);

    let duration = "";
    if (hours > 0) {
      duration += `${hours} soat `;
    }
    if (minutes > 0 || hours > 0) {
      duration += `${minutes} daqiqa `;
    }
    duration += `${seconds} soniya`;

    return duration.trim();
  }
}
