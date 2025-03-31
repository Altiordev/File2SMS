import TemplateModel from "../domain/template/template.model";

export interface ITemplate {
  template: TemplateModel;
  files: string[];
  sentFiles: string[];
}
