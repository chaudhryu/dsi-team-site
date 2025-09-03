import { IProject } from "./IProject";
import { ITeamMember } from "./ITeamMember";

export interface IProjectCardProps {
  openEditProjectForm: (project: IProject) => void;
  project: IProject;
  openDeleteProjectConfirmationDialog: (project: IProject) => void,
}
