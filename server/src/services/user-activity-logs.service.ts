import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserActivityLog } from "../entities/UserActivityLog.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class UserActivityLogsService {
  constructor(
    @InjectRepository(UserActivityLog)
    private readonly activityLogRepository: Repository<UserActivityLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(data: {
    badge: number;
    activityType: string;
    accomplishmentId?: number;
    metadata?: string;
  }): Promise<UserActivityLog> {
    const user = await this.userRepository.findOne({
      where: { badge: data.badge },
    });

    if (!user) {
      throw new Error(`User with badge ${data.badge} not found`);
    }

    // Only log if audit is enabled for this user
    if (!user.auditEnabled) {
      return null;
    }

    const log = this.activityLogRepository.create({
      user,
      activityType: data.activityType,
      accomplishmentId: data.accomplishmentId || null,
      metadata: data.metadata || null,
    });

    return this.activityLogRepository.save(log);
  }

  async findByBadge(badge: number): Promise<UserActivityLog[]> {
    return this.activityLogRepository.find({
      where: { user: { badge } },
      order: { timestamp: "DESC" },
    });
  }

  async findAll(): Promise<UserActivityLog[]> {
    return this.activityLogRepository.find({
      order: { timestamp: "DESC" },
    });
  }
}
