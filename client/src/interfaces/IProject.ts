import { ITeamMember } from "./ITeamMember";

export interface IProject {
  id: number;
  name: string;
  description: string;
  status: "in progress" | "completed" | "planning";
  technologies: string[];
  teamMembers: ITeamMember[];
  githubUrl?: string;
  startDate: Date;
  endDate: Date;
  client: string;
}
