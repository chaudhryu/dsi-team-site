import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './Logger'; 
async function bootstrap() {
  const app = await NestFactory.create(AppModule,{logger:WinstonModule.createLogger(winstonConfig)});
  app.setGlobalPrefix('api');
if (process.env.NODE_ENV !== 'production') {
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(3005);
}
}
bootstrap();