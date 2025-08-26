import { IProject } from "./IProject";

export interface IMyProjectFormProps {
  isProjectFormOpen: boolean;
  closeProjectForm: () => void | null;
  project: IProject | null | undefined;
}
