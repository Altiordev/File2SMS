/** @format */
import { createLogger, transports, format } from "winston";
import * as fs from "fs";
import * as path from "path";
import DailyRotateFile from "winston-daily-rotate-file";

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.printf((info) => {
      return `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`;
    }),
  ),
  transports: [
    new DailyRotateFile({
      dirname: logDir,
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD", // har kuni alohida fayl
      zippedArchive: false,
      maxFiles: "30d",
    }),

    // consolega yozish
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

export default logger;
