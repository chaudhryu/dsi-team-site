// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './Logger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    { logger: WinstonModule.createLogger(winstonConfig) }
  );

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://police-report-request-portal-sigma.vercel.app',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3005);
}
bootstrap();
