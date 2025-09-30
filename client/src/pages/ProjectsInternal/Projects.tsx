import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { envConfig } from "@/config/envConfig";
import { IProject } from "@/interfaces/IProject";
import { IProjectProps } from "@/interfaces/IProjectProps";
import { PlusIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard";
import { ProjectForm } from "./ProjectForm";
import ProjectsDialog from "./ProjectsDialog";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3005/api";

export const Projects: React.FC<IProjectProps> = ({ isInternal }) => {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<IProject[]>([]);
  const [searchFilterValue, setSearchFilterValue] = useState<string>("");
  const [statusFilterValue, setStatusFilterValue] = useState<string>("all");
  const [isAddProjectFormOpen, setIsAddProjectFormOpen] = useState<boolean>(false);
  const [isEditProjectFormOpen, setIsEditProjectFormOpen] = useState<boolean>(false);
  const [project, setProject] = useState<IProject | null | undefined>();
  const [totalCount, setTotalCount] = useState<number>();
  const [inProductionCount, setInProductionCount] = useState<number>();
  const [planningCount, setPlanningCount] = useState<number>();
  const [inDevelopmentCount, setInDevelopmentCount] = useState<number>();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<IProject | null>();
  const [isLoading, setIsLoading] = useState(true);

  const closeAddProjectForm = () => {
    setIsAddProjectFormOpen(false);
  };

  const closeProjectsDialog = () => {
    setIsDialogOpen(false);
  };

  const openDeleteProjectConfirmationDialog = (project: IProject) => {
    setProjectToDelete(project);
    setIsDialogOpen(true);
  };

  const deleteProject = async () => {
    try {
      if (projectToDelete) {
        await fetch(`${API_BASE}/projects/${projectToDelete.id}`, {
          method: "DELETE",
        });
        handleProjectsCache("delete", projectToDelete?.id, null);
      }
    } catch (err) {
      console.error("Network error deleting project:", err);
    } finally {
      closeProjectsDialog();
      setProjectToDelete(null);
    }
  };

  const openEditProjectForm = (project: IProject) => {
    setProject(project);
    setIsEditProjectFormOpen(true);
  };

  const closeEditProjectForm = () => {
    setProject(null);
    setIsEditProjectFormOpen(false);
  };

  const fetchAndSetProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        setFilteredProjects(data);
        setStats(data);
      } else {
        const text = await res.text();
        console.error("GET /projects failed", res.status, text);
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (e) {
      console.error("Network error /projects:", e);
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchAndSetProjects();
    }, 1200);
  }, []);

  const setStats = (projects: IProject[]) => {
    let inDevelopmentCount = 0;
    let inProductionCount = 0;
    let planningCount = 0;

    projects.forEach((project) => {
      if (project.status === "in production") {
        inProductionCount += 1;
      } else if (project.status === "planning") {
        planningCount += 1;
      } else if (project.status === "in development") {
        inDevelopmentCount += 1;
      }
    });

    setTotalCount(projects.length);
    setInProductionCount(inProductionCount);
    setPlanningCount(planningCount);
    setInDevelopmentCount(inDevelopmentCount);
  };

  const filterProjects = (searchFilterValue: string, statusFilterValue: string, projects: IProject[]) => {
    console.log(statusFilterValue);
    setSearchFilterValue(searchFilterValue);
    setStatusFilterValue(statusFilterValue);
    setFilteredProjects(() => {
      const searchFilteredProjects = searchFilterValue
        ? projects.filter((project) => {
            return (
              project.name.toLowerCase().includes(searchFilterValue.toLowerCase()) ||
              project.description.toLowerCase().includes(searchFilterValue.toLowerCase()) ||
              project.technologies?.some((technology) =>
                technology.name.toLowerCase().includes(searchFilterValue.toLowerCase())
              )
            );
          })
        : projects;

      const searchAndStatusFilteredProjects =
        statusFilterValue && statusFilterValue !== "all"
          ? searchFilteredProjects.filter((prevFilteredProject) => {
              console.log(prevFilteredProject.status);
              console.log(statusFilterValue);

              return prevFilteredProject.status.toLowerCase() === statusFilterValue.toLowerCase();
            })
          : searchFilteredProjects;

      console.log(searchAndStatusFilteredProjects);

      return searchAndStatusFilteredProjects;
    });
  };

  const handleProjectsCache = (action: string, projectId: number | null | undefined, project: IProject | null) => {
    setProjects((prevProjects: IProject[]) => {
      if (action === "add" && project) {
        const newProjects = [...prevProjects, project];
        setStats(newProjects);
        filterProjects(searchFilterValue, statusFilterValue, newProjects);
        return newProjects;
      } else if (action === "update" && project) {
        const newProjects = prevProjects.map((prevProject: IProject) =>
          prevProject.id === project.id ? project : prevProject
        );
        setStats(newProjects);
        filterProjects(searchFilterValue, statusFilterValue, newProjects);
        return newProjects;
      } else if (action === "delete") {
        const newProjects = prevProjects.filter((prevProject) => prevProject.id !== projectId);
        setStats(newProjects);
        filterProjects(searchFilterValue, statusFilterValue, newProjects);
        return newProjects;
      } else {
        return prevProjects;
      }
    });
  };

  return !isLoading ? (
    <div className={`h-full ${!isInternal && "mr-16 ml-16"}`}>
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
      />
      <ProjectsDialog
        isDialogOpen={isDialogOpen}
        dialogType={"delete"}
        title={"Confirm Deletion"}
        description={`Are you sure you would like to delete this project: ${projectToDelete?.name}?`}
        close={closeProjectsDialog}
        clickDialogAction={deleteProject}
      />
      {isInternal && (
        <div className="flex justify-between items-center">
          <div className="font-bold text-2xl">Projects</div>
          <Button size="default" variant="outline" onClick={() => setIsAddProjectFormOpen(true)}>
            <PlusIcon className="size-3.5" color="black" />
            Add
          </Button>
        </div>
      )}
      {!isInternal && (
        <div className="flex flex-col items-center mt-5">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Our Projects </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Explore our complete portfolio of innovative solutions
          </p>
        </div>
      )}
      {projects && projects.length > 0 ? (
        <div className={`w-full h-full ${isInternal ? "mt-10" : "mt-5"}`}>
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="font-bold text-black text-center text-5xl">{totalCount}</p>
                  <p className="font-medium text-gray-600 text-lg">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="font-bold text-green-600 text-center text-5xl">{inProductionCount}</p>
                  <p className="font-medium text-gray-600 text-lg">In&nbsp;&nbsp;Production</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="font-bold text-yellow-600 text-center text-5xl">{inDevelopmentCount}</p>
                  <p className="font-medium text-gray-600 text-lg">In&nbsp;&nbsp;Development</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="font-bold text-blue-600 text-center text-5xl">{planningCount}</p>
                  <p className="font-medium text-gray-600 text-lg">Planning</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects, technologies, or descriptions..."
                  value={searchFilterValue}
                  onChange={(e) => filterProjects(e.target.value, statusFilterValue, projects)}
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
                  <SelectItem value="in development">In Development</SelectItem>
                  <SelectItem value="in production">In Production</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-5">
                {filteredProjects.map((project, index) => {
                  return (
                    <ProjectCard
                      key={index}
                      project={project}
                      openEditProjectForm={openEditProjectForm}
                      openDeleteProjectConfirmationDialog={openDeleteProjectConfirmationDialog}
                      isInternal={isInternal}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full w-full flex-col justify-center items-center gap-3 mt-20">
                {" "}
                <p className="text-xl">No Projects Found!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col justify-center items-center gap-3">
          {" "}
          <p className="text-2xl">No Projects Found!</p>
        </div>
      )}
    </div>
  ) : (
    <div className="flex w-full h-full flex-col justify-center items-center gap-3">
      <Spinner key={"circle"} variant={"circle"} className="w-12 h-12" />
      <p className="text-2xl">Loading...</p>
    </div>
  );
};
