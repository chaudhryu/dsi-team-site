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
  Query,
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

  @Get("by-cost-center")
  findByCostCenter(@Query("costCenter") costCenter: string): Promise<User[]> {
    return this.usersService.findByCostCenter(parseInt(costCenter));
  }

  @Get("team-member-by-cost-center")
  findTeamMembersByCostCenter(
    @Query("costCenter") costCenter: string,
    @Query("excludeManager") excludeManager?: string
  ): Promise<User[]> {
    return this.usersService.findTeamMembersByCostCenter(
      parseInt(costCenter, 10),
      excludeManager === "true"
    );
  }

  // GET /api/users/badge/96880
  @Get("badge/:badge")
  findOneByBadge(@Param("badge") badge: string): Promise<User | null> {
    return this.usersService.findOneByBadge(Number(badge));
  }

  // GET /api/users/costcenter/96880
  @Get("costcenter/:costCenter")
  findOneByCostCenter(
    @Param("costCenter") costCenter: string
  ): Promise<User[] | null> {
    return this.usersService.findByCostCenter(Number(costCenter));
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

  // PUT /api/users/badge/:badge/toggle-audit
  @Put("badge/:badge/toggle-audit")
  async toggleAudit(
    @Param("badge") badge: string,
    @Body() data: { auditEnabled: boolean }
  ): Promise<User | null> {
    return this.usersService.updateByBadge(Number(badge), {
      auditEnabled: data.auditEnabled,
    });
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
