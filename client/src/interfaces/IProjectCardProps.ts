import { IProject } from "./IProject";
import { ITeamMember } from "./ITeamMember";

export interface IProjectCardProps {
  index: number;
  openEditProjectForm: (project: IProject) => void;
  project: IProject;
  handleProjectsCache: (
    action: string,
    projectId: number | null,
    project: IProject | null
  ) => void;
}
