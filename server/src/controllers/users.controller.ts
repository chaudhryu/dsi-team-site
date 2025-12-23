// src/controllers/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Res,
  InternalServerErrorException,
  ForbiddenException,
} from "@nestjs/common";
import { UsersService } from "../services/users.service";
import { User } from "../entities/user.entity";
import { loginDetailsDto } from "src/dto/login-details.dto";
import { Response } from "express";
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // GET /api/users/badge/96880
  @Get("badge/:badge")
  findOneByBadge(@Param("badge") badge: string): Promise<User | null> {
    return this.usersService.findOneByBadge(Number(badge));
  }

  @Post()
  create(@Body() data: Partial<User>): Promise<User> {
    return this.usersService.create(data);
  }

  // PUT /api/users/badge/96880
  @Put("badge/:badge")
  updateByBadge(
    @Param("badge") badge: string,
    @Body() data: Partial<User>
  ): Promise<User | null> {
    return this.usersService.updateByBadge(Number(badge), data);
  }

  // DELETE /api/users/badge/96880
  @Delete("badge/:badge")
  removeByBadge(@Param("badge") badge: string): Promise<void> {
    return this.usersService.removeByBadge(Number(badge));
  }

  @Post("checkandsync")
  async checkUserLoginAndSettingProfile(
    @Body() user: Partial<User>
  ): Promise<loginDetailsDto> {
    debugger;
    const result = await this.usersService.checkUserLoginAndSettingProfile(
      user
    );

    if (result.allowed) return result;

    if (result.reason === "INTERNAL_ERROR") {
      throw new InternalServerErrorException(result);
    }

    throw new ForbiddenException(result);
  }
}
