import SmsModel from "./sms.model";
import { SmsDto } from "./sms.dto";
import {
  IFilterBodySms,
  IFindAndCountAll,
  IGetAllSms,
  ISentSmsHistoryModel,
  IUpdateSms,
} from "../../interfaces/sms.interface";
import { Op, WhereOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import AdminModel from "../auth/models/admin.model";
import CoreRepo from "../core/core.repo";
import TemplateModel from "../template/template.model";

class SmsRepo {
  private model: typeof SmsModel = SmsModel;
  private adminModel: typeof AdminModel = AdminModel;
  private coreRepo: CoreRepo = new CoreRepo();

  public async getSentSmsHistory(): Promise<ISentSmsHistoryModel[]> {
    return (await this.model.findAll({
      attributes: [
        "adminId",
        [Sequelize.fn("COUNT", Sequelize.col("Sms.id")), "totalSms"],
        [Sequelize.fn("MAX", Sequelize.col("Sms.createdAt")), "lastSmsDate"],
      ],
      include: [
        {
          model: AdminModel,
          attributes: [["id", "adminId"], "name"],
        },
      ],
      group: ["Sms.adminId", "admin.id"],
      raw: true,
    })) as unknown as ISentSmsHistoryModel[];
  }

  public async get_all({
    adminId,
    isSuperAdmin,
    offset,
    limit,
    filter,
  }: {
    adminId: number;
    isSuperAdmin: boolean;
    offset: number;
    limit: number;
    filter: IFilterBodySms;
  }): Promise<IGetAllSms> {
    const whereOptions: WhereOptions = {};

    if (!isSuperAdmin) {
      whereOptions.adminId = adminId;
    }
    if (filter.admin_id) {
      whereOptions.adminId = { [Op.eq]: `${filter.admin_id}` };
    }
    if (filter.phone_number) {
      whereOptions.recipient = { [Op.iLike]: `%${filter.phone_number}%` };
    }
    if (filter.message_text) {
      whereOptions.message_text = { [Op.iLike]: `%${filter.message_text}%` };
    }
    if (filter.message_id) {
      whereOptions.id = { [Op.iLike]: `%${filter.message_id}%` };
    }
    if (filter.template_id) {
      whereOptions.template_id = { [Op.iLike]: `%${filter.template_id}%` };
    }
    if (filter.sms_type) {
      whereOptions.sms_type = { [Op.eq]: `${filter.sms_type}` };
    }
    if (filter.startDate && filter.endDate) {
      const endOfDay: Date = new Date(filter.endDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      whereOptions.createdAt = {
        [Op.between]: [filter.startDate, endOfDay],
      };
    }

    const messages: IFindAndCountAll = await this.model.findAndCountAll({
      where: whereOptions,
      include: [
        { model: AdminModel, attributes: ["name"] },
        { model: TemplateModel, as: "template" },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages: number = Math.ceil(messages.count / limit);

    const admins = (
      await this.adminModel.findAll({
        attributes: ["id", "name"],
      })
    ).map((admin) => ({
      value: admin.id,
      label: `${admin.name}`,
    }));

    return {
      totalPages,
      totalCount: messages.count,
      admins,
      result: messages.rows.map((message) => ({
        id: message.id,
        adminId: message.adminId,
        sms_type: message.sms_type,
        recipient: message.recipient,
        message_text: message.message_text,
        play_mobile_data: message.play_mobile_data,
        play_mobile_status: message.play_mobile_status,
        admin: message.admin ? `${message.admin.name}` : null,
        template: message.template,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      })),
    };
  }

  public async create(data: SmsDto): Promise<SmsModel> {
    return this.model.create({
      ...data,
    });
  }

  public async update(id: string, data: IUpdateSms): Promise<SmsModel | null> {
    return await this.coreRepo.update({
      model: this.model,
      updateData: data,
      where: {
        id,
      },
    });
  }
}

export default SmsRepo;
