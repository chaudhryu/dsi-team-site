import {
  IsArray,
  IsDate,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { User } from "src/entities";
import { Type } from "class-transformer";
import { Repository } from "src/objects/repository";

export class CreateProjectDto {
  @IsString()
  name: string; // relate by badge

  @IsString()
  description: string; // 'YYYY-MM-DD'

  @IsString()
  status: string; // 'YYYY-MM-DD'

  @IsString()
  client: string; // 'YYYY-MM-DD'

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Repository)
  repositories: Repository[];

  @IsArray()
  @IsOptional()
  projectMemberBadgeNumbers: number[];

  @IsArray()
  @IsOptional()
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
  client: string; // 'YYYY-MM-DD'

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Repository)
  repositories: Repository[];

  @IsArray()
  @IsOptional()
  projectMemberBadgeNumbers: number[];

  @IsArray()
  @IsOptional()
  technologyIds: number[];
}
