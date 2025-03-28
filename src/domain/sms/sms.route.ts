import { Router } from "express";
import SmsController from "./sms.controller";
import { checkAdminMiddleware } from "../../middleware/checkAdmin.middleware";

export default class SmsRoute {
  public path: string = "/sms";
  public router: Router = Router();
  public controller: SmsController = new SmsController();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/sent-sms-history",
      checkAdminMiddleware,
      this.controller.getSentSmsHistory,
    );
    this.router.post(
      "/all",
      checkAdminMiddleware,
      this.controller.get_all_messages,
    );
    this.router.post(
      "/recipient",
      checkAdminMiddleware,
      this.controller.send_message,
    );
    this.router.post(
      "/recipients",
      checkAdminMiddleware,
      this.controller.send_message_many_recipients,
    );
    this.router.post(
      "/from-excel",
      checkAdminMiddleware,
      this.controller.send_messages_to_recipients_from_excel,
    );
  }
}
