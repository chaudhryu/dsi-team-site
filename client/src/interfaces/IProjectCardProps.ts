import { ITeamMember } from "./ITeamMember";

export interface IProjectCardProps {
   id: string;
    name: string;
    description: string;
    status: "in progress" | "completed" | "planning";
    technologies: string[];
    teamMembers: ITeamMember[];
    githubUrl?: string;
}