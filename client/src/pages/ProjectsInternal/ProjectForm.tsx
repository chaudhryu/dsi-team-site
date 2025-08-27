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
import { PlusIcon, X } from "lucide-react";
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

export const MyProjectForm: React.FC<IMyProjectFormProps> = ({
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
      badgeNumber: "22221",
    },
  ];

  const technologies = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "Java",
    "C#",
    "Go",
    "Rust",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Tailwind CSS",
    "GraphQL",
  ];

  const [projectName, setProjectName] = useState<string>();
  const [client, setClient] = useState<string>();
  const [projectStatus, setProjectStatus] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [repositoryUrl, setRepositoryUrl] = useState<string>();
  const [selectedTeamMemberBadgeNumber, setSelectedTeamMemberBadgeNumber] =
    useState<string>();
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<ITeamMember[]>(
    []
  );
  const [selectedTechnology, setSelectedTechnology] = useState<string>();
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    []
  );
  const [teamMembersDropdownValues, setTeamMembersDropdownValues] = useState<
    ITeamMember[]
  >([]);

  const [technologiesDropdownValues, setTechnologiesDropdownValues] = useState<
    string[]
  >([]);

  useEffect(() => {
    setTeamMembersDropdownValues(teamMembers);
    setTechnologiesDropdownValues(technologies);

    if (project) {
      setProjectName(project.name);
      setClient(project.client);
      setProjectStatus(project.status);
      setDescription(project.description);
      setSelectedTeamMembers(project.teamMembers);
      setSelectedTechnologies(project.technologies);
    }
  }, []);

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setRepositoryUrl(project.repositoryUrl);
      setClient(project.client);
      setProjectStatus(project.status);
      setDescription(project.description);
      setSelectedTeamMembers(project.teamMembers);
      setSelectedTechnologies(project.technologies);
    }
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
    setSelectedTechnologies((prevSelectedTechnologies) =>
      selectedTechnology
        ? [...prevSelectedTechnologies, selectedTechnology]
        : prevSelectedTechnologies
    );

    setTechnologiesDropdownValues((prevTechnologiesDropDownValues) => {
      return prevTechnologiesDropDownValues.filter(
        (prevTechnologiesDropdownValue) =>
          prevTechnologiesDropdownValue !== selectedTechnology
      );
    });

    setSelectedTechnology("");
  };

  const clearAllFieldsAndCloseAddProjectForm = () => {
    closeProjectForm();
    setProjectName("");
    setClient("");
    setProjectStatus("");
    setDescription("");
    setRepositoryUrl("");
    setSelectedTeamMembers([]);
    setSelectedTechnologies([]);
    setTeamMembersDropdownValues(teamMembers);
    setTechnologiesDropdownValues(technologiesDropdownValues);
  };

  const submit = () => {
    if (
      projectName &&
      client &&
      projectStatus &&
      description &&
      repositoryUrl &&
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
        repositoryUrl: repositoryUrl,
        client: client,
      };
      handleProjectsCache("add", null, newProject);
      clearAllFieldsAndCloseAddProjectForm();
      console.log("Success!");
    } else {
      console.log("Empty Fields!");
    }
  };

  return (
    <Dialog
      open={isProjectFormOpen}
      onOpenChange={clearAllFieldsAndCloseAddProjectForm}
    >
      <form onSubmit={submit}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
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
            <Label htmlFor="username-1">Repository URL</Label>
            <Input
              onChange={(e) => setRepositoryUrl(e.target.value)}
              id="name-1"
              name="name"
              value={repositoryUrl}
            />
          </div>
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
                    <SelectItem value={teamMember.badgeNumber}>
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
                    <X
                      className="h-3 w-3 cursor-pointer"
                      // onClick={() => removeSelectedTechnology(tech)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="username-1">Technologies</Label>
            <div className="flex gap-2">
              <Select
                value={selectedTechnology}
                onValueChange={(value) => setSelectedTechnology(value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select Technologies" />
                </SelectTrigger>
                <SelectContent>
                  {technologiesDropdownValues.map((technology) => (
                    <SelectItem value={technology}>{technology}</SelectItem>
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
            {selectedTechnologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTechnologies.map((selectedTechnology) => (
                  <Badge
                    key={selectedTechnology}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {selectedTechnology}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      // onClick={() => removeTechStack(tech)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={submit}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
