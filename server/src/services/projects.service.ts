import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { CreateProjectDto } from "src/dto/project.dto";
import { IsTimeZone } from "class-validator";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>
  ) {}

  findAll() {
    return this.projectRepository.find();
  }

  findOne(id: number) {
    return this.projectRepository.findOneBy({ id });
  }

  create(name: string, description: string, status: string, githubUrl: string) {
    const project = new Project();
    project.name = name;
    project.description = description;
    project.status = status;
    project.githubUrl = githubUrl;
    return this.projectRepository.save(project);
  }

  async update(
    id: number,
    name: string,
    description: string,
    status: string,
    githubUrl: string
  ) {
    const project = await this.projectRepository.findOne({ where: { id: id } });

    if (project) {
      project.name = name;
      project.description = description;
      project.status = status;
      project.githubUrl = githubUrl;
      return this.projectRepository.save(project);
    }
    return null;
  }

  delete(id: number) {
    return this.projectRepository.delete(id);
  }
}
