import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class ProjectsService {
  private projects = [
    {
      id: 0,
      name: "AFSCME Ot",
      description: "application for...",
      status: "In Progress",
    },
  ];

  getProjects() {
    return this.projects;
  }
}
