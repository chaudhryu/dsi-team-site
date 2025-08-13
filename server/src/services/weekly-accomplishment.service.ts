import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyAccomplishment,User,Application } from '../entities';
import { WeeklyAccomplishmentAppDetailDto, AppServerDto, AppDatabaseDto, DatabaseLoginDto } from '../dto/WeeklyAccomplishmentAppDetail.dto';

@Injectable()
export class WeeklyAccomplishmentService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(WeeklyAccomplishment)
    private readonly waRepo: Repository<WeeklyAccomplishment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
  ) {}
  async onApplicationBootstrap() {
    // Seed User if not exists
    let user = await this.userRepo.findOne({ where: { badge: 96880 } });
    if (!user) {
      user = this.userRepo.create({
        badge: 96880,
        firstName: 'Trung',
        lastName: 'Ty',
        email: 'tut@metro.net',
      });
      await this.userRepo.save(user);
      console.log('added User');
    }

  }

  async getAllByUser(badge: number): Promise<WeeklyAccomplishment[]> {
    return this.waRepo.find({
      where: { user: { badge } },
      relations: [
        'application',
        'application.devServer',
        'application.prodServer',
        'application.devDatabase',
        'application.prodDatabase',
        'application.devDatabase.logins',
        'application.prodDatabase.logins',
      ],
    
    });
  }

  
}
