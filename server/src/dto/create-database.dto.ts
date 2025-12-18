import { IsIn, IsNotEmpty, IsString, IsNumberString } from "class-validator";

export class CreateDatabaseDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() host: string;
  @IsString() @IsNotEmpty() serviceName: string;
  @IsNumberString() port: string;
  @IsString() @IsNotEmpty() engine: string;
  @IsIn(["active","inactive"]) status: string;
}
