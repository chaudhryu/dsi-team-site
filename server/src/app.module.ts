import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import {Application,Database,Server,DatabaseLogin,User,WeeklyAccomplishment} from './entities'
import { WeeklyAccomplishmentService } from './services/weekly-accomplishment.service';
import { UsersController } from './controllers/users.controller';
import { WeeklyAccomplishmentsController } from './controllers/weekly-accomplishments.controller';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Application, Server, Database, DatabaseLogin, WeeklyAccomplishment],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Application, Server, Database, DatabaseLogin, WeeklyAccomplishment]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
  ],
  controllers: [UsersController,WeeklyAccomplishmentsController],
  providers: [UsersService,WeeklyAccomplishmentService],
})
export class AppModule {}