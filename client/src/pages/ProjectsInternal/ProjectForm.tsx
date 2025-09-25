import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Label from "@/components/form/Label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, PlusIcon, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { IMyProjectFormProps } from "@/interfaces/IMyProjectFormProps";
import { IProject } from "@/interfaces/IProject";
import { setEngine } from "crypto";
import { IRepository } from "@/interfaces/IRepository";
import { envConfig } from "@/config/envConfig";
import { Spinner, type SpinnerProps } from "@/components/ui/shadcn-io/spinner";
import { ITechnology } from "@/interfaces/ITechnology";
import { IProjectMember } from "@/interfaces/IProjectMember";
import { Plus } from "lucide-react";
import bcrypt from "bcrypt";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";

export const ProjectForm: React.FC<IMyProjectFormProps> = ({
  isProjectFormOpen,
  closeProjectForm,
  project,
  handleProjectsCache,
}) => {
  const [name, setName] = useState<string>();
  const [client, setClient] = useState<string | null | undefined>();
  const [status, setStatus] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [repositories, setRepositories] = useState<IRepository[]>([]);
  const [repositoryLabel, setRepositoryLabel] = useState<string>();
  const [repositoryUrl, setRepositoryUrl] = useState<string>();
  const [selectedProjectMember, setSelectedProjectMember] =
    useState<IProjectMember>();
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<
    IProjectMember[]
  >([]);
  const [selectedTechnology, setSelectedTechnology] = useState<ITechnology>();
  const [selectedTechnologies, setSelectedTechnologies] = useState<
    ITechnology[]
  >([]);
  const [projectMembersDropdownValues, setProjectMembersDropdownValues] =
    useState<IProjectMember[]>([]);
  const [technologiesDropdownValues, setTechnologiesDropdownValues] = useState<
    ITechnology[]
  >([]);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [databaseServerName, setDatabaseServerName] = useState<
    string | null | undefined
  >();
  const [databaseUserName, setDatabaseUserName] = useState<
    string | null | undefined
  >();
  const [databasePassword, setDatabasePassword] = useState<
    string | null | undefined
  >();

  const fetchAndSetTechnologiesDropdown = async () => {
    try {
      const res = await fetch(`${API_BASE}/technologies`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setTechnologiesDropdownValues(data);
      } else {
        const text = await res.text();
        console.error("GET /technologies failed", res.status, text);
        setTechnologiesDropdownValues([]);
      }
    } catch (e) {
      console.error("Network error /technologies:", e);
      setTechnologiesDropdownValues([]);
    }
  };

  const fetchAndSetProjectMembersDropdownValues = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProjectMembersDropdownValues(data);
      } else {
        const text = await res.text();
        console.error("GET /users failed", res.status, text);
        setProjectMembersDropdownValues([]);
      }
    } catch (e) {
      console.error("Network error /users:", e);
      setProjectMembersDropdownValues([]);
    }
  };

  useEffect(() => {
    if (isProjectFormOpen) {
      setTimeout(() => {
        fetchAndSetTechnologiesDropdown();
        fetchAndSetProjectMembersDropdownValues();
        setIsLoading(false);
      }, 1200);
      if (project) {
        setName(project.name);
        setRepositories(project.repositories ?? []);
        setClient(project.client);
        setStatus(project.status);
        setDescription(project.description);
        setSelectedProjectMembers(project.projectMembers ?? []);
        setSelectedTechnologies(project.technologies ?? []);
      }
    }
  }, [isProjectFormOpen, project]);

  useEffect(() => {
    // if (project) {
    //   setProjectName(project.name);
    //   setRepositories(project.repositories);
    //   setClient(project.client);
    //   setProjectStatus(project.status);
    //   setDescription(project.description);
    //   setSelectedProjectMembers(project.ProjectMembers);
    //   setSelectedTechnologies(project.technologies);
    // }
  }, [project]);

  const addProjectMember = () => {
    if (selectedProjectMember) {
      setSelectedProjectMembers((prevSelectedProjectMembers) => {
        return [...prevSelectedProjectMembers, selectedProjectMember];
      });

      setProjectMembersDropdownValues((prevProjectMembersDropdownValues) => {
        return prevProjectMembersDropdownValues.filter(
          (prevProjectMembersDropdownValue) =>
            prevProjectMembersDropdownValue.badge !==
            selectedProjectMember?.badge
        );
      });

      setSelectedProjectMember(undefined);
    }
  };

  const addTechnology = () => {
    if (selectedTechnology) {
      setSelectedTechnologies((prevSelectedTechnologies) =>
        selectedTechnology
          ? [...prevSelectedTechnologies, selectedTechnology]
          : prevSelectedTechnologies
      );

      setTechnologiesDropdownValues((prevTechnologiesDropDownValues) => {
        return prevTechnologiesDropDownValues.filter(
          (prevTechnologiesDropdownValue) =>
            prevTechnologiesDropdownValue.id !== selectedTechnology?.id
        );
      });

      setSelectedTechnology(undefined);
    }
  };

  const addRepository = () => {
    setRepositories((prevRepositories) =>
      repositoryLabel && repositoryUrl
        ? [...prevRepositories, { label: repositoryLabel, url: repositoryUrl }]
        : prevRepositories
    );

    setRepositoryLabel("");
    setRepositoryUrl("");
  };

  const clearAllFieldsAndCloseProjectForm = () => {
    closeProjectForm();
    setName("");
    setClient("");
    setStatus("");
    setDescription("");
    setRepositories([]);
    setSelectedProjectMembers([]);
    setSelectedTechnologies([]);
    setProjectMembersDropdownValues([]);
    setTechnologiesDropdownValues([]);
    setSelectedProjectMember(undefined);
    setSelectedTechnology(undefined);
    setIsLoading(true);
  };

  const addProject = async () => {
    try {
      if (name && status && description) {
        const selectedTechnologyIds = selectedTechnologies.map(
          (selectedTechnology) => selectedTechnology.id
        );

        const selectedProjectMemberIds = selectedProjectMembers.map(
          (selectedProjectMember) => selectedProjectMember.badge
        );

        const res = await fetch(`${API_BASE}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name,
            description: description,
            status: status,
            technologyIds: selectedTechnologyIds,
            projectMemberBadgeNumbers: selectedProjectMemberIds,
            repositories: repositories,
            // databaseServerName: databaseServerName,
            // databaseUserName: databaseUserName,
            // databasePassword: databasePassword,
            client: client,
          }),
        });

        if (res.ok) {
          const newProject = await res.json();
          handleProjectsCache("add", null, newProject);
        }
      } else {
        console.log("Empty Fields!");
      }
    } catch (err) {
      console.error("Network error adding project:", err);
    } finally {
      setIsPerformingAction(false);
      clearAllFieldsAndCloseProjectForm();
    }
  };

  const updateProject = async () => {
    try {
      if (project?.id && name && status && description) {
        const selectedTechnologyIds = selectedTechnologies.map(
          (selectedTechnology) => selectedTechnology.id
        );

        const selectedProjectMemberIds = selectedProjectMembers.map(
          (selectedProjectMember) => selectedProjectMember.badge
        );

        const res = await fetch(`${API_BASE}/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name,
            description: description,
            status: status,
            technologyIds: selectedTechnologyIds,
            projectMemberBadgeNumbers: selectedProjectMemberIds,
            repositories: repositories,
            // databaseServerName: databaseServerName,
            // databaseUserName: databaseUserName,
            client: client,
          }),
        });

        const updatedProject: IProject = {
          id: project.id,
          name: name,
          description: description,
          status: status,
          technologies: selectedTechnologies,
          projectMembers: selectedProjectMembers,
          // databaseServerName: databaseServerName,
          // databaseUserName: databaseUserName,
          // databasePassword: databasePassword,
          repositories: repositories,
          client: client,
        };

        if (res.ok) {
          handleProjectsCache("update", null, updatedProject);
        }
      } else {
        console.log("Empty Fields!");
      }
    } catch (err) {
      console.error("Network error updating project:", err);
    } finally {
      setIsPerformingAction(false);
      clearAllFieldsAndCloseProjectForm();
    }
  };

  const performAction = () => {
    setIsPerformingAction(true);
    setTimeout(() => {
      if (!project) {
        addProject();
      } else {
        updateProject();
      }
    }, 1200);
  };

  const removeSelectedProjectMember = (
    selectedProjectMemberForRemoval: IProjectMember
  ) => {
    if (selectedProjectMemberForRemoval) {
      setSelectedProjectMembers((prevSelectedProjectMembers) =>
        prevSelectedProjectMembers.filter(
          (prevSelectedProjectMember: IProjectMember) =>
            prevSelectedProjectMember.badge !==
            selectedProjectMemberForRemoval.badge
        )
      );

      // setProjectMembersDropdownValues((prevProjectMembersDropdownValues) => [
      //   ...prevProjectMembersDropdownValues,
      //   selectedProjectMemberForRemoval,
      // ]);
    }
  };

  const removeSelectedTechnology = (
    selectedTechnologyForRemoval: ITechnology
  ) => {
    if (selectedTechnologyForRemoval) {
      setSelectedTechnologies((prevSelectedTechnologies) =>
        prevSelectedTechnologies.filter(
          (prevSelectedTechnology) =>
            prevSelectedTechnology.id !== selectedTechnologyForRemoval.id
        )
      );

      // setTechnologiesDropdownValues((prevTechnologiesDropDownValues) => [
      //   selectedTechnologyForRemoval,
      //   ...prevTechnologiesDropDownValues,
      // ]);
    }
  };

  const removeRepository = (indexToRemove: number) => {
    setRepositories((prevRepositories) =>
      prevRepositories.filter((_, index) => index !== indexToRemove)
    );
  };

  return (
    <Dialog
      open={isProjectFormOpen}
      onOpenChange={clearAllFieldsAndCloseProjectForm}
    >
      {!isLoading ? (
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {project ? "Edit Project" : "Add Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-row gap-5 justify-between">
            <div className="">
              <Label htmlFor="name-1">Project Name</Label>
              <Input
                id="name-1"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="">
              <Label>Client</Label>
              <Input
                value={client ?? ""}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="username-1">Project Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2">
            <div>
              <Label htmlFor="username-1">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></Textarea>
            </div>
          </div>
          <div className="mt-2">
            <Label htmlFor="username-1">Repositories</Label>
            <div className="flex gap-3">
              <Input
                onChange={(e) => setRepositoryLabel(e.target.value)}
                value={repositoryLabel}
                className="w-[30%]"
                placeholder="Repository Label"
              />
              <Input
                onChange={(e) => setRepositoryUrl(e.target.value)}
                value={repositoryUrl}
                className="w-[60%]"
                placeholder="Repository Url"
              />
              <Button
                type="button"
                onClick={addRepository}
                disabled={!repositoryLabel || !repositoryUrl}
                className="w-[10%]"
              >
                <Plus />
              </Button>
            </div>
          </div>
          {repositories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {repositories.map((repository: IRepository, index: number) => {
                return (
                  <Button variant="outline" size="sm">
                    <a
                      href={repository.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center items-center"
                    >
                      <Github className="h-4 w-4 mr-1" />
                      <span className="mr-2">{repository.label}</span>
                    </a>
                    <div
                      onClick={() => removeRepository(index)}
                      className="flex justify-center items-center"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
          {/* <div className="mt-2">
            <Label>Database Information</Label>
            <div className="flex flex-row gap-5 justify-between">
              <Input
                placeholder="Database Server Name"
                value={databaseServerName ?? ""}
                onChange={(e) => setDatabaseServerName(e.target.value)}
              />
              <Input
                placeholder="Database User Name"
                value={databaseUserName ?? ""}
                onChange={(e) => setDatabaseUserName(e.target.value)}
              />
              <Input
                placeholder="Database Password"
                value={databasePassword ?? ""}
                onChange={(e) => setDatabasePassword(e.target.value)}
              />
            </div>
          </div> */}
          <div className="mt-2">
            <Label htmlFor="username-1">Project Members</Label>
            <div className="flex gap-3">
              <div className="w-[90%]">
                <Select
                  value={selectedProjectMember?.badge}
                  onValueChange={(value) => {
                    const projectMemberObject =
                      projectMembersDropdownValues.find(
                        (projectMembersDropdownValue) =>
                          projectMembersDropdownValue.badge === value
                      );
                    setSelectedProjectMember(() => {
                      if (projectMemberObject) {
                        return projectMemberObject;
                      } else {
                        return undefined;
                      }
                    });
                  }}
                >
                  <SelectTrigger className="flex-1 w-[100%]">
                    <SelectValue placeholder="Select Project Members" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectMembersDropdownValues.map((projectMember) => (
                      <SelectItem
                        value={projectMember.badge}
                        key={projectMember.badge}
                      >
                        {`${projectMember.firstName} ${projectMember.lastName} (${projectMember.badge})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={addProjectMember}
                disabled={!selectedProjectMember}
                className="w-[10%]"
              >
                <Plus />
              </Button>
            </div>
            {selectedProjectMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProjectMembers.map(
                  (selectedProjectMember: IProjectMember) => (
                    <Badge
                      key={selectedProjectMember.badge}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {`${selectedProjectMember.firstName} ${selectedProjectMember.lastName} (${selectedProjectMember.badge})`}
                      <div
                        onClick={() =>
                          removeSelectedProjectMember(selectedProjectMember)
                        }
                      >
                        <X className="h-3 w-3 cursor-pointer" />
                      </div>
                    </Badge>
                  )
                )}
              </div>
            )}
          </div>
          <div className="mt-2">
            <Label>Technologies</Label>
            <div className="flex gap-3">
              <div className="w-[90%]">
                <Select
                  value={selectedTechnology?.id}
                  onValueChange={(value) =>
                    setSelectedTechnology({
                      id: value,
                      name:
                        technologiesDropdownValues.find(
                          (technologiesDropdownValue) =>
                            technologiesDropdownValue.id === value
                        )?.name ?? "",
                    })
                  }
                >
                  <SelectTrigger className="flex-1 w-[100%]">
                    <SelectValue placeholder="Select Technologies" />
                  </SelectTrigger>
                  <SelectContent>
                    {technologiesDropdownValues &&
                      technologiesDropdownValues.map((technology) => (
                        <SelectItem key={technology.id} value={technology.id}>
                          {technology.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={addTechnology}
                disabled={!selectedTechnology}
                className="w-[10%]"
              >
                <Plus />
              </Button>
            </div>
            {selectedTechnologies && selectedTechnologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTechnologies.map((selectedTechnology) => (
                  <Badge
                    key={selectedTechnology.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {selectedTechnology.name}
                    <div>
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          removeSelectedTechnology(selectedTechnology)
                        }
                      />
                    </div>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            {!isPerformingAction ? (
              <div>
                <Button
                  variant="outline"
                  onClick={clearAllFieldsAndCloseProjectForm}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" onClick={performAction}>
                  {project ? "Update" : "Add"}
                </Button>
              </div>
            ) : (
              <div>{project ? "Updating..." : "Adding..."}</div>
            )}
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent>
          <div className="flex w-full h-full flex-col justify-center items-center gap-3">
            <Spinner key={"circle"} variant={"circle"} className="w-10 h-10" />
            <p className="text-xl">Loading...</p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
