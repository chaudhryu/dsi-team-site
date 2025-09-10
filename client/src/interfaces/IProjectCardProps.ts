import { IProject } from "./IProject";

export interface IProjectCardProps {
  openEditProjectForm: (project: IProject) => void;
  project: IProject;
  openDeleteProjectConfirmationDialog: (project: IProject) => void;
  isInternal: boolean;
}
