import { IProject } from "./IProject";

export interface IMyProjectFormProps {
  isProjectFormOpen: boolean;
  closeProjectForm: () => void | null;
  project: IProject | null | undefined;
  handleProjectsCache: (
    action: string,
    projectId: number | null,
    project: IProject | null
  ) => void;
  projects: IProject[];
}
