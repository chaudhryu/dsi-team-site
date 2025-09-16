import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { CreateProjectDto } from "src/dto/project.dto";
import { IsTimeZone } from "class-validator";
import { User } from "src/entities";
import { Technology } from "src/entities/technlogy.entity";
import { Repository as Repos } from "src/objects/repository";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Technology)
    private technologyRepository: Repository<Technology>
  ) {}

  findAll() {
    return this.projectRepository.find({
      relations: { projectMembers: true, technologies: true },
    });
  }

  // findOne(id: number) {
  //   return this.projectRepository.findOne({ where: {id} relations: {user: true}  });
  // }

  async create(
    name: string,
    description: string,
    status: string,
    client: string,
    repositories: Repos[],
    databaseServerName: string,
    databaseUserName: string,
    databasePassword: string,
    projectMemberBadgeNumbers: number[],
    technologyIds: number[]
  ) {
    const projectMembers: User[] = [];
    const technologies: Technology[] = [];

    for (const projectMemberBadgeNumber of projectMemberBadgeNumbers) {
      const projectMemberResult = await this.userRepository.findOneBy({
        badge: projectMemberBadgeNumber,
      });

      if (projectMemberResult) {
        projectMembers.push(projectMemberResult);
      } else {
        throw new NotFoundException(
          `Project Member with badge ${projectMemberBadgeNumber} not found`
        );
      }
    }

    for (const technologyId of technologyIds) {
      const technologyResult = await this.technologyRepository.findOneBy({
        id: technologyId,
      });

      if (technologyResult) {
        technologies.push(technologyResult);
      } else {
        throw new NotFoundException(
          `Technology with id ${technologyId} not found`
        );
      }
    }

    const project = new Project();
    project.name = name;
    project.description = description;
    project.status = status;
    project.client = client;
    project.repositories = repositories;
    project.databaseServerName = databaseServerName;
    project.databaseUserName = databaseUserName;
    project.databasePassword = databasePassword;
    project.projectMembers = projectMembers;
    project.technologies = technologies;

    return this.projectRepository.save(project);
  }

  async update(
    id: number,
    name: string,
    description: string,
    status: string,
    client: string,
    repositories: Repos[],
    databaseServerName: string,
    databaseUserName: string,
    databasePassword: string,
    projectMemberBadgeNumbers: number[],
    technologyIds: number[]
  ) {
    const projectMembers: User[] = [];
    const technologies: Technology[] = [];

    const project = await this.projectRepository.findOne({ where: { id: id } });

    if (!project) {
      throw new NotFoundException(`Technology with id ${project.id} not found`);
    }

    for (const projectMemberBadgeNumber of projectMemberBadgeNumbers) {
      const projectMemberResult = await this.userRepository.findOneBy({
        badge: projectMemberBadgeNumber,
      });

      if (projectMemberResult) {
        projectMembers.push(projectMemberResult);
      } else {
        throw new NotFoundException(
          `Project Member with badge ${projectMemberBadgeNumber} not found`
        );
      }
    }

    for (const technologyId of technologyIds) {
      const technologyResult = await this.technologyRepository.findOneBy({
        id: technologyId,
      });

      if (technologyResult) {
        technologies.push(technologyResult);
      } else {
        throw new NotFoundException(
          `Technology with id ${technologyId} not found`
        );
      }
    }

    if (project && id) {
      project.name = name;
      project.description = description;
      project.status = status;
      project.client = client;
      project.repositories = repositories;
      project.databaseServerName = databaseServerName;
      project.databaseUserName = databaseUserName;
      project.databasePassword = databasePassword;
      project.projectMembers = projectMembers;
      project.technologies = technologies;
      return this.projectRepository.save(project);
    }
    return null;
  }

  async delete(id: number) {
    return this.projectRepository.delete(id);
  }
}
