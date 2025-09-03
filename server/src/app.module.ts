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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isDev = cfg.get("NODE_ENV") !== "production";
        const dbType = (cfg.get<string>("DB_TYPE") || "sqlite").toLowerCase();
        const syncFlag =
          (cfg.get<boolean>("DB_SYNC") as boolean | undefined) ??
          (isDev ? true : false);
        const entities = [
          User,
          Application,
          Project,
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
              encrypt: (cfg.get<boolean>("DB_ENCRYPT") ?? true) === true,
              trustServerCertificate:
                (cfg.get<boolean>("DB_TRUST_SERVER_CERT") ?? false) === true,
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
  ],
  providers: [UsersService, WeeklyAccomplishmentService, ProjectsService],
})
export class AppModule {}
