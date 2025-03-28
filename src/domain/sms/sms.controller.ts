import { NextFunction, Request, Response } from "express";
import SmsService from "./sms.service";
import { SmsDto, SmsForManyRecipientsDto } from "./sms.dto";
import {
  IFilterBodySms,
  IGetAllSms,
  ISentSmsHistory,
  ISmsModel,
} from "../../interfaces/sms.interface";
import { StatusCode } from "../../enums/status-code.enum";
import AdminModel from "../auth/models/admin.model";
import { validation } from "../../utils/validation.util";

class SmsController {
  public service: SmsService = new SmsService();

  public getSentSmsHistory = async (
    _: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result: ISentSmsHistory[] = await this.service.getSentSmsHistory();
      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };

  public get_all_messages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const page: number = Number(req.query.page) || 1;
      const limit: number = Number(req.query.limit) || 10;
      const filter: IFilterBodySms = req.body;

      const result: IGetAllSms = await this.service.get_all_messages({
        admin: req.admin as AdminModel,
        page,
        limit,
        filter,
      });

      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };

  public send_messages_to_recipients_from_excel = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const {
        message_text,
        file_id,
      }: { message_text: string; file_id: string } = req.body;

      const data = {
        file_id,
        message_text,
        adminId: req.admin!.id,
      };

      const result: string =
        await this.service.send_messages_to_recipients_from_excel(data);

      res.status(StatusCode.Ok).json({ message: result });
    } catch (error) {
      next(error);
    }
  };

  public send_message_many_recipients = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const messageData: SmsForManyRecipientsDto = req.body;
      await validation(SmsForManyRecipientsDto, messageData);
      messageData.adminId = req.admin!.id;

      const result: string =
        this.service.send_message_many_recipients(messageData);
      res.status(StatusCode.Ok).json({ message: result });
    } catch (error) {
      next(error);
    }
  };

  public send_message = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const messageData: SmsDto = req.body;
      await validation(SmsDto, messageData);
      messageData.adminId = req.admin!.id;

      const result: ISmsModel = await this.service.send_message(messageData);
      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default SmsController;
