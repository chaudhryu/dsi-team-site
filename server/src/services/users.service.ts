import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { User, WeeklyAccomplishment } from "../entities";
import { loginDetailsDto } from "src/dto/login-details.dto";

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(WeeklyAccomplishment)
    private readonly accRepo: Repository<WeeklyAccomplishment>,
    private readonly config: ConfigService
  ) {}

  private readonly logger = new Logger(UsersService.name);
  private getAllowedCostCenters(): Set<number> {
    const raw = this.config.get<string>("ALLOWED_COSTCENTERS") ?? "";
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);

    return new Set(list);
  }

  private isCostCenterAllowed(costCenter: number | null | undefined): boolean {
    if (!costCenter || !Number.isFinite(costCenter)) return false;
    const allowed = this.getAllowedCostCenters();
    return allowed.size > 0 && allowed.has(costCenter);
  }

  async onApplicationBootstrap() {
    this.logger.log("Ensuring seed user (idempotent)...");
    await this.userRepo.upsert(
      {
        badge: 96880,
        firstName: "Trung",
        lastName: "Ty",
        email: "tut@metro.net",
      },
      ["badge"]
    );
  }

  async ensureUser(badge: number, data: Partial<User>) {
    await this.userRepo.upsert({ badge, ...data }, ["badge"]);
    return this.userRepo.findOne({ where: { badge } });
  }

  // ---- CRUD by badge ----

  findAll(): Promise<User[]> {
    this.logger.log("Fetching all users");
    return this.userRepo.find();
  }

  findByCostCenter(costCenter: number): Promise<User[]> {
    this.logger.log("Fetching users by cost center");
    return this.userRepo.find({
      where: {
        costCenter: costCenter,
      },
    });
  }

  findTeamMembersByCostCenter(
    costCenter: number,
    excludeManager = false
  ): Promise<User[]> {
    this.logger.log("Fetching Team members by cost center");
    const qb = this.userRepo
      .createQueryBuilder("u")
      .where("u.costCenter = :costCenter", { costCenter });
    if (excludeManager) {
      qb.andWhere("u.role = 'user'");
    }
    return qb.getMany();
  }

  findOneByBadge(badge: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { badge } });
  }

  async create(data: Partial<User>): Promise<User> {
    const existingUser = await this.findOneByBadge(data.badge);

    if (existingUser) {
      // Merge new fields into existing user
      const updated = this.userRepo.merge(existingUser, data);
      return this.userRepo.save(updated);
    }

    // Create new user if not exists
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async updateByBadge(
    badge: number,
    data: Partial<User>
  ): Promise<User | null> {
    await this.userRepo.update({ badge }, data); // criteria object, not numeric id
    return this.findOneByBadge(badge);
  }

  async removeByBadge(badge: number): Promise<void> {
    await this.userRepo.delete({ badge }); // criteria object
  }
  async checkUserLoginAndSettingProfile(
    user: Partial<User>
  ): Promise<loginDetailsDto> {
    try {
      console.log("checkUserLoginAndSettingProfile called with user:", user);
      // STEP A: is user  exist?
      const existingUser = await this.findOneByBadge(user.badge);

      if (existingUser) {
        if (!existingUser.isHierarchyManuallyManaged) {
          await this.userRepo.update(
            { badge: user.badge },
            {
              costCenter: user.costCenter,
              reportToLevelOne: user.reportToLevelOne,
              reportToLevelTwo: user.reportToLevelTwo,
            }
          );
        }
        // if (
        //   existingUser.costCenter !== user.costCenter ||
        //   existingUser.reportToLevelOne !== user.reportToLevelOne ||
        //   existingUser.reportToLevelTwo !== user.reportToLevelTwo
        // ) {
        //   // Update existing user
        //   await this.userRepo.update({ badge: user.badge }, user);
        // }
        //  Existing user → allow login
        return {
          allowed: true,
          user: existingUser,
          isFirstLogin: false,
          role: existingUser.role,
        };
      }
      // STEP A.2: is cost center allowed?
      if (!this.isCostCenterAllowed(user.costCenter)) {
        return {
          allowed: false,
          user: null,
          isFirstLogin: true,
          reason: "COSTCENTER_NOT_ALLOWED",
        };
      }
      // STEP B: first login → manager check REQUIRED
      const manager = await this.userRepo.findOne({
        where: { costCenter: user.costCenter, role: "manager" },
      });

      if (!manager) {
        //  No manager for cost center → deny
        return {
          allowed: false,
          user: null,
          reason: "NO_MANAGER_FOR_COST_CENTER",
        };
      }
      // Normalize numbers ( if API returns strings)
      const managerBadge = Number(manager.badge);
      const reportTo1 = Number(user.reportToLevelOne);
      const reportTo2 = Number(user.reportToLevelTwo);

      // STEP C: verify user is on manager's team
      const isOnManagersTeam =
        managerBadge === reportTo1 || managerBadge === reportTo2;

      if (!isOnManagersTeam) {
        //  Manager exists, but user does not report to them
        return {
          allowed: false,
          user: null,
          isFirstLogin: true,
          reason: "USER_NOT_IN_MANAGER_TEAM",
        };
      }
      // STEP C: create new user
      const newUser = this.userRepo.create({
        badge: user.badge,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        position: user.position,
        role: "user", // default role
        costCenter: user.costCenter,
        reportToLevelOne: user.reportToLevelOne,
        reportToLevelTwo: user.reportToLevelTwo,
        readOnly: 0, // default
      } as Partial<User>);

      await this.userRepo.save(newUser);

      return {
        allowed: true,
        user: newUser,
        isFirstLogin: true,
        manager,
        role: newUser.role,
      };
    } catch (error) {
      this.logger.error(
        "Error in checkUserLoginAndSettingProfile",
        (error as Error)?.stack ?? String(error)
      );
      return {
        allowed: false,
        user: null,
        isFirstLogin: false,
        reason: "INTERNAL_ERROR",
      };
    }
  }
}
