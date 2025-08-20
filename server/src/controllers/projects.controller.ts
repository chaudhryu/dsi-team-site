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
  getProjects() {
    return this.projectsService.getProjects;
  }

  @Get(":id")
  getProject(@Param("id") id: string) {
    return {
      id: id,
    };
  }

  @Post()
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return {
      name: createProjectDto.name,
      description: createProjectDto.description,
      status: createProjectDto.status,
      githubUrl: createProjectDto.githubUrl,
    };
  }

  @Put(":id")
  updateProject(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto
  ) {
    return {
      id,
      name: updateProjectDto.name,
      description: updateProjectDto.description,
      status: updateProjectDto.status,
      githubUrl: updateProjectDto.githubUrl,
    };
  }

  @Put(":id")
  removeProject(@Param("id") id: string) {
    return {};
  }
}
