import { ITeamMembers } from "./ITeamMembers";

export interface IProjectCardProps {
   id: string;
    name: string;
    description: string;
    status: "in progress" | "completed" | "planning";
    technologies: string[];
    teamMembers: ITeamMembers[];
    githubUrl?: string;
}