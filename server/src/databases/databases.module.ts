import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Database } from "../entities/Database.entity";
import { DatabaseLogin } from "../entities/Database_Login.entity";
import { DatabasesService } from "./databases.service";
import { DatabasesController } from "../controllers/databases.controller";
import { CryptoService } from "../security/crypto.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Database, DatabaseLogin])],
  controllers: [DatabasesController],
  providers: [DatabasesService, CryptoService],
  exports: [DatabasesService],
})
export class DatabasesModule {}
