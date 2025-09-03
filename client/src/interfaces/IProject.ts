import { IRepository } from "./IRepository";
import { ITeamMember } from "./ITeamMember";

export interface IProject {
  id: number;
  name: string;
  description: string;
  status: string;
  technologies: string[];
  teamMembers: ITeamMember[];
  repositories: IRepository[];
  client: string;
}
