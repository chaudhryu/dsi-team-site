// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './services/users.service';
import { WeeklyAccomplishmentService } from './services/weekly-accomplishment.service';
import { UsersController } from './controllers/users.controller';
import { WeeklyAccomplishmentsController } from './controllers/weekly-accomplishments.controller';
import { Application, Database, Server, DatabaseLogin, User, WeeklyAccomplishment } from './entities';
import { ServersModule } from './servers.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Application, Server, Database, DatabaseLogin, WeeklyAccomplishment],
      synchronize: true, // dev only
    }),
    TypeOrmModule.forFeature([User, Application, Server, Database, DatabaseLogin, WeeklyAccomplishment]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    ServersModule, // ⬅️ add this
  ],
  controllers: [UsersController, WeeklyAccomplishmentsController],
  providers: [UsersService, WeeklyAccomplishmentService],
})
export class AppModule {}
