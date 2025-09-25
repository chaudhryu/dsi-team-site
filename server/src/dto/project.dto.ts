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
  @IsOptional()
  client: string; // 'YYYY-MM-DD'

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Repository)
  repositories: Repository[];

  // @IsString()
  // @IsOptional()
  // databaseServerName: string;

  // @IsString()
  // @IsOptional()
  // databaseUserName: string;

  // @IsString()
  // @IsOptional()
  // databasePassword: string;

  @IsArray()
  @IsOptional()
  @IsOptional()
  projectMemberBadgeNumbers: number[];

  @IsArray()
  @IsOptional()
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
  @IsOptional()
  client: string; // 'YYYY-MM-DD'

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Repository)
  repositories: Repository[];

  // @IsString()
  // @IsOptional()
  // databaseServerName: string;

  // @IsString()
  // @IsOptional()
  // databaseUserName: string;

  // @IsString()
  // @IsOptional()
  // databasePassword: string;

  @IsArray()
  @IsOptional()
  projectMemberBadgeNumbers: number[];

  @IsArray()
  @IsOptional()
  technologyIds: number[];
}
