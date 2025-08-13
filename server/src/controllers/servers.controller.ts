// src/servers/servers.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateServerDto } from 'src/dto/CreateServer.dto';
import { ServersService } from 'src/services/servers.service';

@Controller('servers') // final URL will be /api/servers because of your global prefix
export class ServersController {
  constructor(private readonly servers: ServersService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.servers.findAll(q);
  }

  @Post()
  create(@Body() body: CreateServerDto) {
    return this.servers.create(body);
  }
}
