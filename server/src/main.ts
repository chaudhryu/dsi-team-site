// src/main.ts
import "reflect-metadata"; // safe to add; helps with decorators/validation
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
function mask(v?: string) {
  if (!v) return "MISSING";
  return v.length > 8
    ? v.slice(0, 4) + "…" + v.slice(-4)
    : "SET(" + v.length + ")";
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);
  // log env vars to make sure they're loaded (and masked)
  console.log("[cwd]", process.cwd());
  console.log("[env]", {
    NODE_ENV: cfg.get("NODE_ENV"),
    PORT: cfg.get("PORT"),
    DBTYPE: cfg.get("DB_TYPE"),
    OPENAI_API_KEY: mask(cfg.get("OPENAI_API_KEY")),
    GEMINI_API_KEY: mask(cfg.get("GEMINI_API_KEY")),
    OPENAI_BASE_URL: cfg.get("OPENAI_BASE_URL") ? "SET" : "MISSING",
  });
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
      "https://dsiwebapp.metro.net",
      "https://dsiwebappdev.metro.net",
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
