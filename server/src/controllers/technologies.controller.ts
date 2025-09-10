import { Controller, Get } from "@nestjs/common";
import { TechnologiesService } from "src/services/technologies.service";

@Controller("technologies")
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  @Get()
  getAllProjects() {
    return this.technologiesService.findAll();
  }
}
