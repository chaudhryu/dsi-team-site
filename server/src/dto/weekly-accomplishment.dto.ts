// src/dto/weekly-accomplishment.dto.ts
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWeeklyAccomplishmentDto {
  @IsNumber()
  userBadge: number;                    // relate by badge

  @IsDateString()
  startWeekDate: string;                // 'YYYY-MM-DD'

  @IsDateString()
  endWeekDate: string;                  // 'YYYY-MM-DD'

  @IsString()
  accomplishments: string;

  @IsOptional()
  @IsString()
  dateSubmitted?: string;               // 'YYYY-MM-DD' (optional)

  @IsOptional()
  @IsString()
  taskStatus?: string;                  // e.g., 'Submitted'

  @IsOptional()
  @IsNumber()
  applicationId?: number;               // optional link to Application
}

export class UpdateWeeklyAccomplishmentDto {
  @IsOptional() @IsNumber()
  userBadge?: number;

  @IsOptional() @IsDateString()
  startWeekDate?: string;

  @IsOptional() @IsDateString()
  endWeekDate?: string;

  @IsOptional() @IsString()
  accomplishments?: string;

  @IsOptional() @IsString()
  dateSubmitted?: string;

  @IsOptional() @IsString()
  taskStatus?: string;

  @IsOptional() @IsNumber()
  applicationId?: number;
}

export class WeeklyAccomplishmentResponseDto {
  id: number;
  startWeekDate: string;
  endWeekDate: string;
  accomplishments: string;
  dateSubmitted: string | null;
  taskStatus: string | null;
  // Optionally include flattened app/user fields if you want
}
