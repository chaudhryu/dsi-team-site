import { IRepository } from "./IRepository";
import { ITeamMember } from "./ITeamMember";
import { ITechnology } from "./ITechnology";

export interface IProject {
  id: number;
  name: string;
  description: string;
  status: string;
  technologies: ITechnology[];
  teamMembers: ITeamMember[];
  repositories: IRepository[];
  client: string;
}
