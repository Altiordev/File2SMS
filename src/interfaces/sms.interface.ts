import SmsModel from "../domain/sms/sms.model";
import { template_type_enum } from "../enums/enums";
import AdminModel from "../domain/auth/models/admin.model";

export interface ISmsModel {
  id?: string;
  adminId: number;
  admin?: AdminModel;
  recipient: string;
  message_text: string;
  sms_type: template_type_enum;
  play_mobile_status: number;
  play_mobile_data: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISms {
  message_id: string;
  recipient: string;
  message_text: string;
}

export interface IUpdateSms {
  play_mobile_data: string;
  play_mobile_status: string;
}

export interface IFilterBodySms {
  phone_number: string;
  message_id: string;
  message_text: string;
  startDate: string;
  endDate: string;
  admin_id?: number;
  sms_type?: template_type_enum;
}

export interface IFindAndCountAll {
  rows: SmsModel[];
  count: number;
}
export interface IGetAllSms {
  totalCount: number;
  totalPages: number;
  admins: Array<{ label: string; value: number }>;
  result: Array<{
    id: string;
    adminId: number | null;
    recipient: string;
    message_text: string;
    sms_type: template_type_enum;
    play_mobile_status: number;
    play_mobile_data: string;
    createdAt: Date;
    updatedAt: Date;
    admin: string | null;
  }>;
  // result: ISmsModel[];
}

export interface ISentSmsHistoryModel {
  adminId: number;
  serviceId: string;
  totalSms: number;
  lastSmsDate: Date;
  admin: {
    name: string;
  };
}

export interface ISentSmsHistory {
  adminId: number | null;
  totalSms: number;
  lastSmsDate: Date | null;
  admin: string | null;
  price: {
    number: number;
    inWords: string;
  };
}
