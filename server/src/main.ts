// src/main.ts
import "reflect-metadata"; // safe to add; helps with decorators/validation
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.enableCors({
    origin: [
      "http://localhost:5173",
      "https://police-report-request-portal-sigma.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const PORT = Number(process.env.PORT) || 3005;
  const HOST = "0.0.0.0"; // listen on all interfaces (localhost + 127.0.0.1)
  await app.listen(PORT, HOST);
  console.log(`env file ${process.env}`);
  console.log(`✅ API listening on http://localhost:${PORT}`);
}
bootstrap();
