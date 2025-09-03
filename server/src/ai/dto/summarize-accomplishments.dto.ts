// src/ai/dto/summarize-accomplishments.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class EntryDto {
  @IsDateString() startWeekDate!: string;
  @IsDateString() endWeekDate!: string;
  @IsString() text!: string;  // plain text (no HTML)
}
export class UserPayloadDto {
  @IsInt() @Min(1) badge!: number;
  @IsString() name!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => EntryDto)
  entries!: EntryDto[];
}
export class SummarizeRequestDto {
  @IsDateString() from!: string;
  @IsDateString() to!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => UserPayloadDto)
  users!: UserPayloadDto[];
  @IsOptional() @IsBoolean() includeTeamSummary?: boolean = true;
}
export class UserSummaryDto {
  badge!: number;
  name!: string;
  summary_md!: string;
  highlights?: string[];
  blockers?: string[];
  next_focus?: string[];
}
export class SummarizeResponseDto {
  users!: UserSummaryDto[];
  team_themes?: string[];
}
