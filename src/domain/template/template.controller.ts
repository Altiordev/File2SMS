/** @format */
import { NextFunction, Request, Response } from "express";
import { StatusCode } from "../../enums/status-code.enum";
import TemplateService from "./template.service";
import { CreateTemplateDTO, UpdateTemplateDTO } from "./template.dto";
import { validation } from "../../utils/validation.util";
import { ITemplate } from "../../interfaces/template.interface";

class TemplateController {
  private service: TemplateService = new TemplateService();

  public getAll = async (_: Request, res: Response, next: NextFunction) => {
    try {
      const results = await this.service.getAllTemplates();
      res.status(StatusCode.Ok).json(results);
    } catch (error) {
      next(error);
    }
  };

  public getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result: ITemplate = await this.service.getTemplateById(id);
      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST: /api/template
   * Body -> CreateTemplateDTO
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      await validation(CreateTemplateDTO, body);

      const result = await this.service.create(body);

      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT: /api/template/:id
   * Body -> UpdateTemplateDTO
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const body: UpdateTemplateDTO = req.body;
      await validation(UpdateTemplateDTO, body);

      const result = await this.service.update(id, body);
      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE: /api/template/:id
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await this.service.delete(id);
      res.status(StatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default TemplateController;
