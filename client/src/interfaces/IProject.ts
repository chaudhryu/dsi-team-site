import { IRepository } from "./IRepository";
import { IProjectMember } from "./IProjectMember";
import { ITechnology } from "./ITechnology";

export interface IProject {
  id: number | null | undefined;
  name: string;
  description: string;
  status: string;
  technologies: ITechnology[];
  projectMembers: IProjectMember[];
  repositories: IRepository[];
  client: string;
}
