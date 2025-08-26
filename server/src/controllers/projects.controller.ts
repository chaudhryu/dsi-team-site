import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from "@nestjs/common";
import { UsersService } from "../services/users.service";
import { User } from "../entities/user.entity";
import { CreateProjectDto, UpdateProjectDto } from "src/dto/project.dto";
import { ProjectsService } from "src/services/projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getAllProjects() {
    return this.projectsService.findAll();
  }

  @Get(":id")
  getProject(@Param("id") id: string) {
    return this.projectsService.findOne(+id);
  }

  @Post()
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(
      createProjectDto.name,
      createProjectDto.description,
      createProjectDto.status,
      createProjectDto.githubUrl
    );
  }

  @Put(":id")
  updateProject(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto
  ) {
    return this.projectsService.update(
      +id,
      updateProjectDto.name,
      updateProjectDto.description,
      updateProjectDto.status,
      updateProjectDto.githubUrl
    );
  }

  @Put(":id")
  removeProject(@Param("id") id: string) {
    return this.projectsService.delete(+id);
  }
}
