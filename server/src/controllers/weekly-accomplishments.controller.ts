// src/controllers/weekly-accomplishments.controller.ts
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { WeeklyAccomplishmentService } from '../services/weekly-accomplishment.service';
import { CreateWeeklyAccomplishmentDto, UpdateWeeklyAccomplishmentDto } from '../dto/weekly-accomplishment.dto';

@Controller('weekly-accomplishments')
export class WeeklyAccomplishmentsController {
  constructor(private readonly waService: WeeklyAccomplishmentService) {}

  // UI uses this to list user history
  @Get('user/:badge')
  getByUser(@Param('badge') badge: string) {
    return this.waService.getAllByUser(Number(badge));
  }

  // Create (or upsert) current week
  @Post()
  create(@Body() dto: CreateWeeklyAccomplishmentDto) {
    return this.waService.createOrUpdate(dto);
  }

  // Edit by id
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWeeklyAccomplishmentDto) {
    return this.waService.update(Number(id), dto);
  }
}
