/** @format */
import fs from "fs";
import path from "path";
import TemplateService from "./template.service";
import { promisify } from "util";
import logger from "../../utils/logger.util";

const renameAsync = promisify(fs.rename);

export default class TemplateWatcherService {
  private templateService: TemplateService;
  private isScanning: boolean;
  private timer: NodeJS.Timeout | null;

  constructor(templateService: TemplateService) {
    this.templateService = templateService;
    this.isScanning = false;
    this.timer = null;
  }

  public startWatching(intervalMs = 1000): void {
    logger.info(
      `TemplateWatcherService started. Scanning every ${intervalMs}ms...`,
    );
    this.timer = setInterval(() => this.scanPublicFolder(), intervalMs);
  }

  public stopWatching(): void {
    if (this.timer) {
      clearInterval(this.timer);
      logger.info(`TemplateWatcherService stopped.`);
    }
  }

  private async scanPublicFolder(): Promise<void> {
    if (this.isScanning) {
      logger.warn("Previous scan in progress. Skipped...");
      return;
    }

    this.isScanning = true;
    try {
      const publicPath = path.join(process.cwd(), "public");
      if (!fs.existsSync(publicPath)) {
        logger.error("public papkasi yo'q, skip...");
        return;
      }

      const entries = fs.readdirSync(publicPath, { withFileTypes: true });
      for (const dirent of entries) {
        if (dirent.isDirectory()) {
          const folderName = dirent.name;
          const templateFolderPath = path.join(publicPath, folderName);

          // "files" yoki boshqa "system" papkalarni (agar bo'lsa) skip qilish mumk.
          // Faqat template papkalarini e'tiborga olamiz (ichida 'sent' bo'lishi kutiladigan)
          // Agar "sent" papkasi yo'q bo'lsa, demak bu 'template' papka emas, skip
          const sentPath = path.join(templateFolderPath, "sent");
          if (!fs.existsSync(sentPath)) {
            continue;
          }

          // 2) folder ichidagi .xlsx / .xls fayllarni topamiz (sent dan tashqari)
          const files = fs.readdirSync(templateFolderPath);
          const excelFiles = files.filter(
            (f) => (f.endsWith(".xlsx") || f.endsWith(".xls")) && f !== "sent",
          );

          // 3) har bir excel fayl bo'yicha SMS yuborish jarayonini bajarish
          for (const excelFileName of excelFiles) {
            try {
              logger.info(
                `Found new Excel: ${excelFileName} in folder: ${folderName}`,
              );

              // SMS yuborish
              await this.templateService.processExcelAndSendSMS(
                folderName,
                excelFileName,
              );

              // 4) Jarayon tugagach, excel faylni 'sent' papkasiga move
              const oldPath = path.join(templateFolderPath, excelFileName);
              const newPath = path.join(
                templateFolderPath,
                "sent",
                excelFileName,
              );

              await renameAsync(oldPath, newPath);
              logger.info(`Excel moved to 'sent': ${excelFileName}`);
            } catch (err) {
              logger.error(
                `Error while processing excel [${excelFileName}] in folder [${folderName}]: \n ${err}`,
              );
              // Xatolik bo'lsa ham, keyingi faylga davom etamiz
            }
          }
        }
      }
    } catch (error) {
      logger.error(`scanPublicFolder error: ${error}`);
    } finally {
      this.isScanning = false;
    }
  }
}
