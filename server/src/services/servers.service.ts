// src/servers/servers.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Server } from 'src/entities';
import { CreateServerDto } from 'src/dto/CreateServer.dto';
@Injectable()
export class ServersService {
  constructor(@InjectRepository(Server) private repo: Repository<Server>) {}

  create(dto: CreateServerDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  // simple keyword search across a few columns
  async findAll(q?: string) {
    if (!q) return this.repo.find({ order: { hostname: 'ASC' } });
    const like = Like(`%${q}%`);
    return this.repo.find({
      where: [
        { hostname: like },
        { ipAddress: like },
        { os: like },
        { status: like },
        { environment: like },
        { role: like },
        { location: like },
        { folder: like },
      ],
      order: { hostname: 'ASC' },
    });
  }
}
