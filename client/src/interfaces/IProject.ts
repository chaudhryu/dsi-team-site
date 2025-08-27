import { ITeamMember } from "./ITeamMember";

export interface IProject {
  id: number;
  name: string;
  description: string;
  status: string;
  technologies: string[];
  teamMembers: ITeamMember[];
  repositoryUrl?: string;
  client: string;
}
