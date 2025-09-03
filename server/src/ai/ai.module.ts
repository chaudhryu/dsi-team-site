// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: OpenAI,
      useFactory: (cfg: ConfigService) =>
        new OpenAI({
          apiKey: cfg.get<string>('GEMINI_API_KEY'),
          baseURL: cfg.get<string>('OPENAI_BASE_URL') // Gemini’s OpenAI-compatible endpoint
        }),
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
