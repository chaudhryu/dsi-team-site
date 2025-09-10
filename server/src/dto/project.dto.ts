import {
  IsArray,
  IsDate,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { User } from "src/entities";

export class CreateProjectDto {
  @IsString()
  name: string; // relate by badge

  @IsString()
  description: string; // 'YYYY-MM-DD'

  @IsString()
  status: string; // 'YYYY-MM-DD'

  @IsString()
  githubUrl: string;

  projectMemberBadgeNumbers: number[];

  technologyIds: number[];
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

  projectMemberIds: number[];

  technologyIds: number[];
}
