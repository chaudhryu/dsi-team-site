import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  Application,
  Database,
  DatabaseLogin,
  Server,
  User,
  WeeklyAccomplishment,
} from "./entities";
import { Project } from "./entities/project.entity";
import { Technology } from "./entities/technlogy.entity";

import { UsersController } from "./controllers/users.controller";
import { WeeklyAccomplishmentsController } from "./controllers/weekly-accomplishments.controller";
import { ProjectsController } from "./controllers/projects.controller";
import { TechnologiesController } from "./controllers/technologies.controller";

import { UsersService } from "./services/users.service";
import { WeeklyAccomplishmentService } from "./services/weekly-accomplishment.service";
import { ProjectsService } from "./services/projects.service";
import { TechnologiesService } from "./services/technologies.service";

/* Feature modules */
import { AiModule } from "./ai/ai.module";
import { DatabasesModule } from "./databases/databases.module";

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
            type: "mssql" as const,
            host: cfg.get<string>("DB_HOST"),
            port: Number(cfg.get<number>("DB_PORT") ?? 1433),
            username: cfg.get<string>("DB_USER"),
            password: cfg.get<string>("DB_PASS"),
            database: cfg.get<string>("DB_NAME"),
            // For TypeORM >= 0.3.x with tedious:
            options: {
              encrypt: parseBool(cfg.get("DB_ENCRYPT"), true),
              trustServerCertificate: parseBool(
                cfg.get("DB_TRUST_SERVER_CERT"),
                false
              ),
            },
            entities,
            synchronize: syncFlag, // ⚠️ keep true only in dev
            logging: isDev ? ["error", "warn"] : ["error"],
          };
        } else {
          return {
            type: "sqlite" as const,
            database: cfg.get<string>("SQLITE_DB"),
            entities,
            synchronize: syncFlag, // ⚠️ keep true only in dev
            logging: isDev ? ["error", "warn"] : ["error"],
          };
        }
      },
    }),

    // Repositories exposed at the app level (optional; you can keep them in feature modules too)
    TypeOrmModule.forFeature([
      User,
      Application,
      Project,
      Technology,
      Server,
      Database,
      DatabaseLogin,
      WeeklyAccomplishment,
    ]),

    AiModule,
    DatabasesModule, // 👈 mounts the /api/databases routes
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
