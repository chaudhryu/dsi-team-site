import { IProjectMember } from "./IProjectMember";
import { ITechnology } from "./ITechnology";

export interface IProjectForm {
  name: string;
  client: string;
  status: string;
  description: string;
  repositoryLabel: string;
  repositoryUrl: string;
  selectedProjectMember: IProjectMember;
  selectedTechnology: ITechnology;
}
