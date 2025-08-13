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

export const MyProjectForm: React.FC<IMyProjectFormProps> = ({
  isAddProjectFormOpen,
  closeAddProjectForm,
}) => {
  const teamMembers: ITeamMember[] = [
    { name: "Joel Joshy", avatar: "/", badgeNumber: "58146" },
    { name: "Trung Tu", avatar: "/", badgeNumber: "11111" },
    { name: "Usman Chaudry", avatar: "/", badgeNumber: "22222" },
    { name: "Joe Hang", avatar: "/", badgeNumber: "22221" },
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
  const [clientDepartment, setClientDepartment] = useState<string>();
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
  }, []);

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
    closeAddProjectForm();
    setProjectName("");
    setClientDepartment("");
    setProjectStatus("");
    setDescription("");
    setRepositoryUrl("");
    setSelectedTeamMembers([]);
    setSelectedTechnologies([]);
    setTeamMembersDropdownValues(teamMembers);
    setTechnologiesDropdownValues(technologiesDropdownValues);
  };

  return (
    <Dialog
      open={isAddProjectFormOpen}
      onOpenChange={clearAllFieldsAndCloseAddProjectForm}
    >
      <form>
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
              <Label htmlFor="username-1">Client Department</Label>
              <Input
                id="username-1"
                name="username"
                value={clientDepartment}
                onChange={(e) => setClientDepartment(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
            ></Textarea>
          </div>
          <div>
            <Label htmlFor="username-1">Repository URL</Label>
            <Input
              onChange={(e) => setRepositoryUrl(e.target.value)}
              id="name-1"
              name="name"
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
            <Button type="submit">Add</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
