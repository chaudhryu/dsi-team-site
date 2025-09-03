// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  /* ⬇️ Use plain ConfigModule (no forRoot here) */
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: OpenAI,
      useFactory: (cfg: ConfigService) =>
        new OpenAI({
          apiKey: cfg.get<string>('GEMINI_API_KEY'),
          baseURL: cfg.get<string>('OPENAI_BASE_URL'), // e.g. https://generativelanguage.googleapis.com/v1beta/openai/
        }),
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
