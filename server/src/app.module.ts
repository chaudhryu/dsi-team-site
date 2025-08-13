import { Module } from '@nestjs/common';
import { ConfigModule,ConfigService } from '@nestjs/config';
import * as Joi from 'joi'; //for environment variable validation
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import {Application,Database,Server,DatabaseLogin,User,WeeklyAccomplishment} from './entities'
import { WeeklyAccomplishmentService } from './services/weekly-accomplishment.service';
import { UsersController } from './controllers/users.controller';
import { WeeklyAccomplishmentsController } from './controllers/weekly-accomplishments.controller';
@Module({
  imports: [
   ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        DB_TYPE: Joi.string().valid('sqlite').default('sqlite'),
        SQLITE_DB: Joi.string().default('db.sqlite'),
        PORT: Joi.number().default(3000),
        CORS_ORIGIN: Joi.string().optional(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isDev = cfg.get('NODE_ENV') !== 'production'
        return {
          type: 'sqlite',
          database: cfg.get<string>('SQLITE_DB'),
          entities: [User, Application, Server, Database, DatabaseLogin, WeeklyAccomplishment],
          synchronize: isDev, // ⚠️ dev only         
          logging: isDev ? ['error', 'warn'] : ['error'],
        }
      },
    }),
    TypeOrmModule.forFeature([User, Application, Server, Database, DatabaseLogin, WeeklyAccomplishment]),
  ],
  controllers: [UsersController,WeeklyAccomplishmentsController],
  providers: [UsersService,WeeklyAccomplishmentService],
})
export class AppModule {}