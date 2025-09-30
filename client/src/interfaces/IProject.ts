import { IRepository } from "./IRepository";
import { IProjectMember } from "./IProjectMember";
import { ITechnology } from "./ITechnology";

export interface IProject {
  id: number | null | undefined;
  name: string;
  description: string;
  status: string;
  technologies: ITechnology[] | null | undefined;
  projectMembers: IProjectMember[] | null | undefined;
  repositories: IRepository[] | null | undefined;
  // databaseUserName: string | null | undefined;
  // databaseServerName: string | null | undefined;
  // databasePassword: string | null | undefined;
  client: string | null | undefined;
}
