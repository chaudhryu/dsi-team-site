import { PartialType } from "@nestjs/mapped-types";
import { User } from "../entities/user.entity";
import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";
export class UserDto extends PartialType(User) {
  // Add any additional properties or methods specific to the UserDto here
}
