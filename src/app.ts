/** @format */
import "reflect-metadata";
import express, { Application } from "express";
import cors from "cors";
import bodyparser from "body-parser";
import path from "path";
import psql from "./database/sequelize";
import dotenv from "dotenv";
import { IRoute } from "./interfaces/interfaces";
import { errorHandler } from "./middleware/errorHandler.middleware";
import AuthRouter from "./domain/auth/auth.route";
import expressFileUpload from "express-fileupload";
import FileRoute from "./domain/file/file.route";
import SmsRoute from "./domain/sms/sms.route";
import TemplateRoute from "./domain/template/template.route";
import TemplateWatcherService from "./domain/template/template.watcher.service";
import TemplateService from "./domain/template/template.service";

dotenv.config();

const corsOptions = {
  origin: "*", // Frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

class App {
  private app: Application;
  private readonly port: number;
  private routes: IRoute[];
  private templateWatcher: TemplateWatcherService;

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT) || 4040;
    this.routes = [
      new AuthRouter(),
      new FileRoute(),
      new SmsRoute(),
      new TemplateRoute(),
    ];

    this.initDB();
    this.initMiddlewares();
    this.initRoutes();
    this.app.use(errorHandler);
    this.templateWatcher = new TemplateWatcherService(new TemplateService());

    this.initServer();
  }

  private async initDB() {
    await psql();
  }

  private initMiddlewares() {
    this.app.use(bodyparser.json());
    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions));
    this.app.use(express.json());
    this.app.use(expressFileUpload());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use("/public", express.static(path.join(process.cwd(), "public")));
  }

  private initRoutes() {
    this.routes.forEach((route: IRoute) => {
      this.app.use("/api" + route.path, route.router);
    });
  }

  private initServer() {
    this.app.listen(this.port, () => {
      console.log("===============================");
      console.log("  SERVER READY AT PORT:", this.port);
      console.log("===============================");

      this.templateWatcher.startWatching(10_000);
    });
  }
}

export default new App();
