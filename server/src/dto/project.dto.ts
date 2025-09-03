import {
  IsArray,
  IsDate,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateProjectDto {
  @IsString()
  name: string; // relate by badge

  @IsString()
  description: string; // 'YYYY-MM-DD'

  @IsString()
  status: string; // 'YYYY-MM-DD'

  @IsString()
  githubUrl: string;
}

export class UpdateProjectDto {
  @IsString()
  name: string; // relate by badge

  @IsString()
  description: string; // 'YYYY-MM-DD'

  @IsString()
  status: string; // 'YYYY-MM-DD'

  @IsString()
  githubUrl: string;
}
