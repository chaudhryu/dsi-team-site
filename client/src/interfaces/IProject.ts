import { ITeamMembers } from "./ITeamMembers";

export interface IProject {
  id: number;
  name: string;
  description: string;
  status: "in progress" | "completed" | "planning";
  technologies: string[];
  teamMembers: ITeamMembers[];
  githubUrl?: string;
  startDate: Date;
  endDate: Date;
}