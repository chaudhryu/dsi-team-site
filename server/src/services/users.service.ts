
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User,WeeklyAccomplishment } from '../entities/';

import { Logger } from '@nestjs/common';
@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(WeeklyAccomplishment) private readonly accRepo: Repository<WeeklyAccomplishment>,
  ) {}
  private readonly logger = new Logger(UsersService.name);
  async onApplicationBootstrap() {
    if ((await this.userRepo.count()) === 0) {
      this.logger.log('Seeding initial data...');
      const user = this.userRepo.create({ badge:96880,firstName: 'Trung',lastName:'lastName', email: 'tut@metro.net' });
      const savedUser = await this.userRepo.save(user);
      const weekOf = new Date().toISOString().slice(0, 10);
    
    }
  }

  findAll(): Promise<User[]> {
    this.logger.log('Fetching all users with accomplishments');
    return this.userRepo.find({ relations: ['weeklyAccomplishments'] });
  }

  findOne(badge: number): Promise<User> {
    return this.userRepo.findOne({ where: { badge }, relations: ['accomplishments'] });
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    await this.userRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }
}