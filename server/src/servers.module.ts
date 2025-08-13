// src/servers/servers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './entities';
import { ServersService } from './services/servers.service';
import { ServersController } from './controllers/servers.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Server])],
  providers: [ServersService],
  controllers: [ServersController],
})
export class ServersModule {}
