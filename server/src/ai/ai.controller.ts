// src/ai/ai.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { AiService } from "./ai.service";
import {
  SummarizeRequestDto,
  SummarizeResponseDto,
} from "./dto/summarize-accomplishments.dto";
import { NormalizedTeam, NormalizedTeamsResponse } from "./types";

@Controller("ai")
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  })
)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("summarize-accomplishments")
  @HttpCode(HttpStatus.OK)
  summarize(@Body() dto: SummarizeRequestDto): Promise<SummarizeResponseDto> {
    console.log("AI Controller - summarize called with DTO:", dto);
    return this.ai.summarize(dto);
  }
  @Post("summarize-accomplishments-teams")
  @HttpCode(HttpStatus.OK)
  summarizeTeams(
    @Body() dto: SummarizeRequestDto
  ): Promise<{ teams: NormalizedTeam[] }> {
    console.log("AI Controller - summarizeTeams called with DTO:", dto);
    return this.ai.summarizeTeamThemes(dto);
  }
}
