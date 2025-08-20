import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, WeeklyAccomplishment } from '../entities';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(WeeklyAccomplishment) private readonly accRepo: Repository<WeeklyAccomplishment>,
  ) {}

  private readonly logger = new Logger(UsersService.name);

  async onApplicationBootstrap() {
    this.logger.log('Ensuring seed user (idempotent)...');
    await this.userRepo.upsert(
      {
        badge: 96880,
        firstName: 'Trung',
        lastName: 'Ty',
        email: 'tut@metro.net',
      },
      ['badge'],
    );
  }

  async ensureUser(badge: number, data: Partial<User>) {
    await this.userRepo.upsert({ badge, ...data }, ['badge']);
    return this.userRepo.findOne({ where: { badge } });
  }

  // ---- CRUD by badge ----

  findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return this.userRepo.find();
  }

  findOneByBadge(badge: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { badge } });
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async updateByBadge(badge: number, data: Partial<User>): Promise<User | null> {
    await this.userRepo.update({ badge }, data); // criteria object, not numeric id
    return this.findOneByBadge(badge);
  }

  async removeByBadge(badge: number): Promise<void> {
    await this.userRepo.delete({ badge }); // criteria object
  }
}
