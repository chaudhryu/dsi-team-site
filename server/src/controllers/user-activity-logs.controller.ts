import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from "@nestjs/common";
import { UserActivityLogsService } from "../services/user-activity-logs.service";
import { UserActivityLog } from "../entities/UserActivityLog.entity";

@Controller("user-activity-logs")
export class UserActivityLogsController {
  constructor(
    private readonly userActivityLogsService: UserActivityLogsService
  ) {}

  @Get()
  findAll(): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findAll();
  }

  @Get("badge/:badge")
  findByBadge(@Param("badge") badge: string): Promise<UserActivityLog[]> {
    return this.userActivityLogsService.findByBadge(Number(badge));
  }

  @Post()
  create(
    @Body()
    data: {
      badge: number;
      activityType: string;
      accomplishmentId?: number;
      metadata?: string;
    }
  ): Promise<UserActivityLog | null> {
    return this.userActivityLogsService.create(data);
  }
}
