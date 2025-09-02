import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Github,
  Search,
  Users,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Badge from "@/components/ui/badge/Badge";
import { IProject } from "@/interfaces/IProject";
import ProjectCard from "./ProjectCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ProjectForm } from "./ProjectForm";
import { projectsData } from "./ProjectsData";
import ProjectsDialog from "./ProjectsDialog";

export const Projects = () => {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<IProject[]>([]);
  const [searchFilterValue, setSearchFilterValue] = useState<string>("");
  const [statusFilterValue, setStatusFilterValue] = useState<string>("all");
  const [isAddProjectFormOpen, setIsAddProjectFormOpen] =
    useState<boolean>(false);
  const [isEditProjectFormOpen, setIsEditProjectFormOpen] =
    useState<boolean>(false);
  const [project, setProject] = useState<IProject | null | undefined>();
  const [totalCount, setTotalCount] = useState<number>();
  const [completedCount, setCompletedCount] = useState<number>();
  const [planningCount, setPlanningCount] = useState<number>();
  const [inProgressCount, setInProgressCount] = useState<number>();
  const [
    isDeleteProjectConfirmationDialogOpen,
    setIsDeleteProjectConfirmationDialogOpen,
  ] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<IProject | null>();

  const closeAddProjectForm = () => {
    setIsAddProjectFormOpen(false);
  };

  const closeProjectsDialog = () => {
    setIsDeleteProjectConfirmationDialogOpen(false);
  };

  const openDeleteProjectConfirmationDialog = (project: IProject) => {
    setProjectToDelete(project);
    setIsDeleteProjectConfirmationDialogOpen(true);
  };

  const deleteProject = () => {
    closeProjectsDialog();
    handleProjectsCache("delete", projectToDelete?.id, null);
    setProjectToDelete(null);
  };

  const openEditProjectForm = (project: IProject) => {
    setProject(project);
    setIsEditProjectFormOpen(true);
  };

  const closeEditProjectForm = () => {
    setIsEditProjectFormOpen(false);
  };

  useEffect(() => {
    setProjects(projectsData);
    setFilteredProjects(projectsData);
    setStats(projectsData);
  }, []);

  const setStats = (projects: IProject[]) => {
    let inProgressCount = 0;
    let completedCount = 0;
    let planningCount = 0;

    projects.forEach((project) => {
      if (project.status === "completed") {
        completedCount += 1;
      } else if (project.status === "planning") {
        planningCount += 1;
      } else if (project.status === "in progress") {
        inProgressCount += 1;
      }
    });

    setTotalCount(projects.length);
    setCompletedCount(completedCount);
    setPlanningCount(planningCount);
    setInProgressCount(inProgressCount);
  };

  const filterProjects = (
    searchFilterValue: string,
    statusFilterValue: string,
    projects: IProject[]
  ) => {
    console.log(statusFilterValue);
    setSearchFilterValue(searchFilterValue);
    setStatusFilterValue(statusFilterValue);
    setFilteredProjects(() => {
      const searchFilteredProjects = searchFilterValue
        ? projects.filter((project) => {
            return (
              project.name
                .toLowerCase()
                .includes(searchFilterValue.toLowerCase()) ||
              project.description
                .toLowerCase()
                .includes(searchFilterValue.toLowerCase()) ||
              project.technologies?.some((technology) =>
                technology
                  .toLowerCase()
                  .includes(searchFilterValue.toLowerCase())
              )
            );
          })
        : projects;

      const searchAndStatusFilteredProjects =
        statusFilterValue && statusFilterValue !== "all"
          ? searchFilteredProjects.filter((prevFilteredProject) => {
              console.log(prevFilteredProject.status);
              console.log(statusFilterValue);

              return (
                prevFilteredProject.status.toLowerCase() ===
                statusFilterValue.toLowerCase()
              );
            })
          : searchFilteredProjects;

      console.log(searchAndStatusFilteredProjects);

      return searchAndStatusFilteredProjects;
    });
  };

  const handleProjectsCache = (
    action: string,
    projectId: number | null | undefined,
    project: IProject | null
  ) => {
    setProjects((prevProjects: IProject[]) => {
      if (action === "add" && project) {
        const newProjects = [...prevProjects, project];
        filterProjects(searchFilterValue, statusFilterValue, newProjects)
        return newProjects;
      }
      else if(action === "update" && project){
        const newProjects = prevProjects.map((prevProject: IProject) => prevProject.id === project.id ? project : prevProject)
        filterProjects(searchFilterValue, statusFilterValue, newProjects)
        return newProjects
      }
      else if (action === "delete") {
        const newProjects = prevProjects.filter(
          (prevProject) => prevProject.id !== projectId
        );
        filterProjects(searchFilterValue, statusFilterValue, newProjects)
        return newProjects;
      } else {
        return prevProjects;
      }
    });
  };

  return (
    <div className="h-auto">
      <ProjectForm
        isProjectFormOpen={isAddProjectFormOpen || isEditProjectFormOpen}
        closeProjectForm={() => {
          if (isAddProjectFormOpen) {
            closeAddProjectForm();
          } else if (isEditProjectFormOpen) {
            closeEditProjectForm();
          }
        }}
        project={project}
        handleProjectsCache={handleProjectsCache}
        projects={projects}
      />
      <ProjectsDialog
        isDialogOpen={isDeleteProjectConfirmationDialogOpen}
        dialogType={"delete"}
        title={"Confirm Deletion"}
        description={`Are you sure you would like to delete this project: ${projectToDelete?.name}?`}
        close={closeProjectsDialog}
        clickAction={deleteProject}
      />
      <div className="flex justify-between items-center mb-10">
        <div className="font-bold text-2xl">Projects</div>
        <Button
          size="default"
          variant="outline"
          onClick={() => setIsAddProjectFormOpen(true)}
        >
          <PlusIcon className="size-3.5" color="black" />
          Add
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-black text-center text-5xl">
                {totalCount}
              </p>
              <p className="font-medium text-gray-600 text-lg">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-green-600 text-center text-5xl">
                {completedCount}
              </p>
              <p className="font-medium text-gray-600 text-lg">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-yellow-600 text-center text-5xl">
                {inProgressCount}
              </p>
              <p className="font-medium text-gray-600 text-lg">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-blue-600 text-center text-5xl">
                {planningCount}
              </p>
              <p className="font-medium text-gray-600 text-lg">Planning</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <section>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects, technologies, or descriptions..."
              value={searchFilterValue}
              onChange={(e) =>
                filterProjects(e.target.value, statusFilterValue, projects)
              }
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilterValue}
            onValueChange={(value) => filterProjects(searchFilterValue, value, projects)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-5">
          {filteredProjects &&
            filteredProjects.map((project, index) => {
              return (
                <ProjectCard
                  key={index}
                  project={project}
                  openEditProjectForm={openEditProjectForm}
                  openDeleteProjectConfirmationDialog={
                    openDeleteProjectConfirmationDialog
                  }
                />
              );
            })}
        </div>
      </section>
    </div>
  );
};
