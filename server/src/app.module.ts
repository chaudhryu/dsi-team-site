import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from "joi"; //for environment variable validation
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./services/users.service";
import {
  Application,
  Database,
  Server,
  DatabaseLogin,
  User,
  WeeklyAccomplishment,
} from "./entities";
import { WeeklyAccomplishmentService } from "./services/weekly-accomplishment.service";
import { UsersController } from "./controllers/users.controller";
import { WeeklyAccomplishmentsController } from "./controllers/weekly-accomplishments.controller";
import { ProjectsController } from "./controllers/projects.controller";
import { Project } from "./entities/project.entity";
import { ProjectsService } from "./services/projects.service";

/* ⬇️ ADD THIS import */
import { AiModule } from "./ai/ai.module";
import { Technology } from "./entities/technlogy.entity";
import { TechnologiesController } from "./controllers/technologies.controller";
import { TechnologiesService } from "./services/technologies.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", `.env.${process.env.NODE_ENV || "development"}`],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isDev =
          (cfg.get<string>("NODE_ENV") ?? "development") !== "production";

        const parseBool = (v: unknown, defaultVal: boolean) => {
          if (v === undefined || v === null) return defaultVal;
          if (typeof v === "boolean") return v;
          return String(v).toLowerCase() === "true";
        };
        const syncFlag = isDev && parseBool(cfg.get("DB_SYNC"), true); // dev default true, prod default false
        const dbType = (cfg.get<string>("DB_TYPE") || "sqlite").toLowerCase();
        const entities = [
          User,
          Application,
          Project,
          Technology,
          Server,
          Database,
          DatabaseLogin,
          WeeklyAccomplishment,
        ];

        if (dbType === "mssql") {
          return {
            type: "mssql",
            host: cfg.get<string>("DB_HOST"),
            port: Number(cfg.get<number>("DB_PORT") ?? 1433),
            username: cfg.get<string>("DB_USER"),
            password: cfg.get<string>("DB_PASS"),
            database: cfg.get<string>("DB_NAME"),
            //For TypeORM >=0.3.x with tedious:
            options: {
              encrypt: parseBool(cfg.get("DB_ENCRYPT"), true),
              trustServerCertificate: parseBool(
                cfg.get("DB_TRUST_SERVER_CERT"),
                false
              ),
            },
            entities: entities,
            synchronize: syncFlag, // ⚠️ keep true only in dev
            logging: isDev ? ["error", "warn"] : ["error"],
          };
        } else
          return {
            type: "sqlite",
            database: cfg.get<string>("SQLITE_DB"),
            entities: entities,
            synchronize: syncFlag, // ⚠️ keep true only in dev
            logging: isDev ? ["error", "warn"] : ["error"],
          };
      },
    }),
    TypeOrmModule.forFeature([
      User,
      Application,
      Project,
      Technology,
      Server,
      Database,
      DatabaseLogin,
      WeeklyAccomplishment,
      Project,
    ]) /* ⬇️ ADD THIS so /api/ai/* routes are mounted */,
    AiModule,
  ],
  controllers: [
    UsersController,
    WeeklyAccomplishmentsController,
    ProjectsController,
    TechnologiesController,
  ],
  providers: [
    UsersService,
    WeeklyAccomplishmentService,
    ProjectsService,
    TechnologiesService,
  ],
})
export class AppModule {}
