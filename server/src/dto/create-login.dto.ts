import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateLoginDto {
  @IsString() @IsNotEmpty() role: string;
  @IsString() @IsNotEmpty() username: string;
  @IsString() @MinLength(8) password: string;
}
