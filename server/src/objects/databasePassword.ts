import { IsString } from "class-validator";

export class DatabasePassword {
  @IsString()
  iv: string;

  @IsString()
  content: string;

  @IsString()
  tag: string;
}
