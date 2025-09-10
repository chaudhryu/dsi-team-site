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
import { ITeamMember } from "@/interfaces/ITeamMember";
import { Badge } from "@/components/ui/badge";
import { IMyProjectFormProps } from "@/interfaces/IMyProjectFormProps";
import { IProject } from "@/interfaces/IProject";
import { setEngine } from "crypto";
import { IRepository } from "@/interfaces/IRepository";
import { envConfig } from "@/config/envConfig";
import { Spinner, type SpinnerProps } from "@/components/ui/shadcn-io/spinner";
import { ITechnology } from "@/interfaces/ITechnology";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";

export const ProjectForm: React.FC<IMyProjectFormProps> = ({
  isProjectFormOpen,
  closeProjectForm,
  project,
  handleProjectsCache,
  projects,
}) => {
  const teamMembers: ITeamMember[] = [
    {
      name: "Joel Joshy",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      badgeNumber: "58146",
    },
    {
      name: "Trung Tu",
      avatar: "/images/team/trungTu.jpg",
      badgeNumber: "11111",
    },
    {
      name: "Usman Chaudry",
      avatar: "/images/team/usmanChaudhr.jpg",
      badgeNumber: "22222",
    },
    {
      name: "Joe Hang",
      avatar: "/images/team/joeHang.jpg",
      badgeNumber: "22221",
    },
    {
      name: "Sangjun Oh",
      avatar: "/images/team/sangjunOh.jpg",
      badgeNumber: "22241",
    },
    {
      name: "Sharadamani Natraj",
      avatar: "/images/team/sharadaNataraj.jpg",
      badgeNumber: "11112",
    },
  ];

  const [projectName, setProjectName] = useState<string>();
  const [client, setClient] = useState<string>();
  const [projectStatus, setProjectStatus] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [repositories, setRepositories] = useState<IRepository[]>([]);
  const [repositoryLabel, setRepositoryLabel] = useState<string>();
  const [repositoryUrl, setRepositoryUrl] = useState<string>();
  const [selectedTeamMemberBadgeNumber, setSelectedTeamMemberBadgeNumber] =
    useState<string>();
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<ITeamMember[]>(
    []
  );
  const [selectedTechnology, setSelectedTechnology] =
    useState<ITechnology | null>(null);
  const [selectedTechnologies, setSelectedTechnologies] = useState<
    ITechnology[]
  >([]);
  const [teamMembersDropdownValues, setTeamMembersDropdownValues] = useState<
    ITeamMember[]
  >([]);
  const [technologiesDropdownValues, setTechnologiesDropdownValues] = useState<
    ITechnology[]
  >([]);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchAndSetTeamMembersDropdownValues = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setTeamMembersDropdownValues(Array.isArray(data) ? data : []);
      } else {
        const text = await res.text();
        console.error("GET /users failed", res.status, text);
        setTeamMembersDropdownValues([]);
      }
    } catch (e) {
      console.error("Network error /users:", e);
      setTeamMembersDropdownValues([]);
    }
  };

  useEffect(() => {
    if (isProjectFormOpen) {
      setTimeout(() => {
        fetchAndSetTechnologiesDropdown();
        fetchAndSetTeamMembersDropdownValues();
        setIsLoading(false);
      }, 1200);
    }
  }, [isProjectFormOpen]);

  useEffect(() => {
    // if (project) {
    //   setProjectName(project.name);
    //   setRepositories(project.repositories);
    //   setClient(project.client);
    //   setProjectStatus(project.status);
    //   setDescription(project.description);
    //   setSelectedTeamMembers(project.teamMembers);
    //   setSelectedTechnologies(project.technologies);
    // }
  }, [project]);

  const addTeamMember = () => {
    setSelectedTeamMembers((prevSelectedTeamMembers) => {
      const teamMemberObject = teamMembers.find(
        (teamMember) => teamMember.badgeNumber === selectedTeamMemberBadgeNumber
      );

      if (teamMemberObject) {
        return [...prevSelectedTeamMembers, teamMemberObject];
      } else {
        return prevSelectedTeamMembers;
      }
    });

    setTeamMembersDropdownValues((prevTeamMembersDropdownValues) => {
      return prevTeamMembersDropdownValues.filter(
        (prevTeamMembersDropdownValue) =>
          prevTeamMembersDropdownValue.badgeNumber !==
          selectedTeamMemberBadgeNumber
      );
    });

    setSelectedTeamMemberBadgeNumber("");
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

      setSelectedTechnology(null);
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
    setProjectName("");
    setClient("");
    setProjectStatus("");
    setDescription("");
    setRepositories([]);
    setSelectedTeamMembers([]);
    setSelectedTechnologies([]);
    setTeamMembersDropdownValues(teamMembers);
    setTechnologiesDropdownValues(technologiesDropdownValues);
    setIsLoading(true);
  };

  const performAction = () => {
    setIsPerformingAction(true);
    setTimeout(() => {
      if (!project) {
        if (
          projectName &&
          client &&
          projectStatus &&
          description &&
          repositories &&
          selectedTeamMembers &&
          selectedTechnologies
        ) {
          const newProject: IProject = {
            id: projects.length + 1,
            name: projectName,
            description: description,
            status: projectStatus,
            technologies: selectedTechnologies,
            teamMembers: selectedTeamMembers,
            repositories: repositories,
            client: client,
          };
          handleProjectsCache("add", null, newProject);
          clearAllFieldsAndCloseProjectForm();
          console.log("Success!");
        } else {
          console.log("Empty Fields!");
        }
      } else {
        if (
          projectName &&
          client &&
          projectStatus &&
          description &&
          repositories &&
          selectedTeamMembers &&
          selectedTechnologies
        ) {
          const updatedProject: IProject = {
            id: project.id,
            name: projectName,
            description: description,
            status: projectStatus,
            technologies: selectedTechnologies,
            teamMembers: selectedTeamMembers,
            repositories: repositories,
            client: client,
          };
          handleProjectsCache("update", null, updatedProject);
          clearAllFieldsAndCloseProjectForm();
          console.log("Success!");
        } else {
          console.log("Empty Fields!");
        }
      }
      setIsPerformingAction(false);
    }, 1200);
  };

  const removeSelectedTeamMember = (
    selectedTeamMemberBadgeNumberForRemoval: string
  ) => {
    setSelectedTeamMembers((prevSelectedTeamMembers) =>
      prevSelectedTeamMembers.filter(
        (prevSelectedTeamMember: ITeamMember) =>
          prevSelectedTeamMember.badgeNumber !==
          selectedTeamMemberBadgeNumberForRemoval
      )
    );
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
    }
  };

  const findAndSetSelectedTechnology = () => {};

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
          <div className="flex flex-row gap-10 justify-between">
            <div className="">
              <Label htmlFor="name-1">Project Name</Label>
              <Input
                id="name-1"
                name="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="">
              <Label htmlFor="username-1">Client</Label>
              <Input
                id="username-1"
                name="username"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="username-1">Project Status</Label>
              <Select
                value={projectStatus}
                onValueChange={(value) => setProjectStatus(value)}
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
          <div>
            <Label htmlFor="username-1">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></Textarea>
          </div>
          <div>
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
                Add
              </Button>
            </div>
          </div>
          {repositories.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
          <div>
            <Label htmlFor="username-1">Team Members</Label>
            <div className="flex gap-2">
              <Select
                value={selectedTeamMemberBadgeNumber}
                onValueChange={(value) =>
                  setSelectedTeamMemberBadgeNumber(value)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select Team Members" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembersDropdownValues.map((teamMember) => (
                    <SelectItem
                      value={teamMember.badgeNumber}
                      key={teamMember.badgeNumber}
                    >
                      {teamMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addTeamMember}
                disabled={!selectedTeamMemberBadgeNumber}
              >
                Add
              </Button>
            </div>
            {selectedTeamMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTeamMembers.map((selectedTeamMember: ITeamMember) => (
                  <Badge
                    key={selectedTeamMember.badgeNumber}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {`${selectedTeamMember.name} (${selectedTeamMember.badgeNumber})`}
                    <div
                      onClick={() =>
                        removeSelectedTeamMember(selectedTeamMember.badgeNumber)
                      }
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </div>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="username-1">Technologies</Label>
            <div className="flex gap-2">
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
                <SelectTrigger className="flex-1">
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
              <Button
                type="button"
                onClick={addTechnology}
                disabled={!selectedTechnology}
              >
                Add
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Spinner key={"circle"} variant={"circle"} />
            <p>Loading...</p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
