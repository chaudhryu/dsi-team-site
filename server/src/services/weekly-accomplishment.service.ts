// src/services/weekly-accomplishment.service.ts
import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { WeeklyAccomplishment, Application, User } from '../entities';
import {
  CreateWeeklyAccomplishmentDto,
  UpdateWeeklyAccomplishmentDto,
} from '../dto/weekly-accomplishment.dto';

@Injectable()
export class WeeklyAccomplishmentService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(WeeklyAccomplishment)
    private readonly waRepo: Repository<WeeklyAccomplishment>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // optional: seed or leave empty
  async onApplicationBootstrap() {
    // no-op
  }

  // used by GET /weekly-accomplishments/user/:badge
  async getAllByUser(badge: number): Promise<WeeklyAccomplishment[]> {
    return this.waRepo.find({
      where: { user: { badge } as any },
      relations: [
        'application',
        'application.devServer',
        'application.prodServer',
        'application.devDatabase',
        'application.prodDatabase',
        'application.devDatabase.logins',
        'application.prodDatabase.logins',
      ],
      // you can add order if you like
      // order: { startWeekDate: 'DESC' },
    });
  }

  // used by POST /weekly-accomplishments
  async createOrUpdate(dto: CreateWeeklyAccomplishmentDto) {
    // Ensure user exists (we do NOT auto-create because firstName/lastName are required)
    const user = await this.userRepo.findOne({ where: { badge: dto.userBadge } });
    if (!user) {
      throw new NotFoundException(`User with badge ${dto.userBadge} not found`);
    }

    // Optional application
    let application: Application | null = null;
    if (typeof dto.applicationId === 'number') {
      application = await this.appRepo.findOne({ where: { id: dto.applicationId } });
      if (!application) {
        throw new NotFoundException(`Application ${dto.applicationId} not found`);
      }
    }

    // Upsert by (user + week range)
    const where: FindOptionsWhere<WeeklyAccomplishment> = {
      user: { badge: dto.userBadge } as any,
      startWeekDate: dto.startWeekDate,
      endWeekDate: dto.endWeekDate,
    };
    let rec = await this.waRepo.findOne({ where });

    if (rec) {
      rec.accomplishments = dto.accomplishments ?? rec.accomplishments;
      rec.dateSubmitted = dto.dateSubmitted ?? rec.dateSubmitted ?? new Date().toISOString().slice(0, 10);
      rec.taskStatus = dto.taskStatus ?? rec.taskStatus ?? 'Submitted';
      if (dto.applicationId !== undefined) rec.application = application; // allow set/clear
      return this.waRepo.save(rec);
    }

    rec = this.waRepo.create({
      user,
      application: application ?? null,
      accomplishments: dto.accomplishments,
      startWeekDate: dto.startWeekDate,
      endWeekDate: dto.endWeekDate,
      dateSubmitted: dto.dateSubmitted ?? new Date().toISOString().slice(0, 10),
      taskStatus: dto.taskStatus ?? 'Submitted',
    });

    return this.waRepo.save(rec);
  }

  // used by PUT /weekly-accomplishments/:id
  async update(id: number, dto: UpdateWeeklyAccomplishmentDto) {
    const rec = await this.waRepo.findOne({ where: { id } });
    if (!rec) throw new NotFoundException('Weekly accomplishment not found');

    // (optional) switch which user it belongs to
    if (dto.userBadge !== undefined) {
      const user = await this.userRepo.findOne({ where: { badge: dto.userBadge } });
      if (!user) throw new NotFoundException(`User with badge ${dto.userBadge} not found`);
      rec.user = user;
    }

    // (optional) set/clear application
    if (dto.applicationId !== undefined) {
      rec.application = dto.applicationId
        ? await this.appRepo.findOne({ where: { id: dto.applicationId } })
        : null;
    }

    rec.accomplishments = dto.accomplishments ?? rec.accomplishments;
    rec.startWeekDate = dto.startWeekDate ?? rec.startWeekDate;
    rec.endWeekDate = dto.endWeekDate ?? rec.endWeekDate;
    rec.dateSubmitted = dto.dateSubmitted ?? rec.dateSubmitted;
    rec.taskStatus = dto.taskStatus ?? rec.taskStatus;

    return this.waRepo.save(rec);
  }
}
