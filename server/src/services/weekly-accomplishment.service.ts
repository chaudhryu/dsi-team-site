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

    // Seed Application if not exists
    let app = await this.appRepo.findOne({ where: { id: 1 } });
    if (!app) {
      app = this.appRepo.create({
        id: 1,
        appName: ' File Center',
        // optional: add server/database fields if necessary
      });
      await this.appRepo.save(app);
      console.log(' added Application');
    }

    // Seed WeeklyAccomplishment if not exists
    const exists = await this.waRepo.findOne({
      where: {
        user: { badge: user.badge },
        application: { id: app.id },
        weeklyPeriod: '2025-W25',
      },
    });

    if (!exists) {
      await this.waRepo.save({
        weeklyPeriod: '2025-W25',
        accomplishments: 'Example accomplishment',
        user,
        application: app,
        // if only have PK , can you below , type orm will link to foreign key from given PK
        // user: { badge: user.badge },         //  only badge ID needed
        // application: { id: app.id },        //   only app ID needed
      });
      console.log('added WeeklyAccomplishment');
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
      order: {
        weeklyPeriod: 'DESC',
      },
    });
  }

  async getUserAccomplishments(badge: number): Promise<WeeklyAccomplishmentAppDetailDto[]> {
    const records = await this.getAllByUser(badge);
    debugger
    return records.map(wa => {
      const app = wa.application;

      const mapServer = (server): AppServerDto =>
        server ? { id: server.id, hostname: server.hostname } : null;

      const mapDb = (db): AppDatabaseDto =>
        db
          ? {
              id: db.id,
              name: db.name,
              logins: db.logins?.map(login => ({
                id: login.id,
                role: login.role,
                username: login.username,
              })) || [],
            }
          : null;

      return {
        weeklyPeriod: wa.weeklyPeriod,
        accomplishments: wa.accomplishments,
        applicationName: app?.appName,
        devServer: mapServer(app?.devServer),
        prodServer: mapServer(app?.prodServer),
        devDatabase: mapDb(app?.devDatabase),
        prodDatabase: mapDb(app?.prodDatabase),
      };
    });
  }
}
