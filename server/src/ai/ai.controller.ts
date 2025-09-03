// src/ai/ai.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { SummarizeRequestDto, SummarizeResponseDto } from './dto/summarize-accomplishments.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('summarize-accomplishments')
  @HttpCode(HttpStatus.OK)
  summarize(@Body() dto: SummarizeRequestDto): Promise<SummarizeResponseDto> {
    return this.ai.summarize(dto);
  }
}
