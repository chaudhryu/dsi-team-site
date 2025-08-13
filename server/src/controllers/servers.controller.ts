// src/servers/servers.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateServerDto } from 'src/dto/CreateServer.dto';
import { ServersService } from 'src/services/servers.service';

@Controller('servers') // final URL: /api/servers (global prefix)
export class ServersController {
  constructor(private readonly servers: ServersService) {}

  // Health check
  @Get('ping')
  ping() {
    return { ok: true };
  }

  // List servers (optional keyword filter)
  @Get()
  list(@Query('q') q?: string) {
    return this.servers.findAll(q);
  }

  // Create a server
  @Post()
  create(@Body() body: CreateServerDto) {
    return this.servers.create(body);
  }
}
