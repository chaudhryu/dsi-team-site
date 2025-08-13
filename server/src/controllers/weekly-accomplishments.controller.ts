

import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { WeeklyAccomplishmentService } from '../services/weekly-accomplishment.service';
import { User } from '../entities/user.entity';

@Controller('weekly-accomplishments')
export class WeeklyAccomplishmentsController {
  constructor(private readonly usersService: UsersService , private readonly weeklyAccomplishmentService : WeeklyAccomplishmentService) {}

 

  
  
  
}