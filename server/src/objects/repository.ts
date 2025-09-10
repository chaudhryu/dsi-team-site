import { IsString } from "class-validator";

export class Repository {
  @IsString()
  label: string;

  @IsString()
  url: string;
}
