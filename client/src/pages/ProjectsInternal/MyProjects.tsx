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
import { MyProjectForm } from "./MyProjectForm";
import { Trash } from "lucide-react";

const projects: IProject[] = [
  {
    id: 1,
    name: "Customer Portal Redesign",
    description:
      "Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.Complete overhaul of the customer-facing portal with modern UI/UX and improved performance. Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.",
    status: "in progress",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
    ],
    teamMembers: [
      {
        name: "Usman",
        avatar: "/images/team/usmanChaudhr.jpg",
        badgeNumber: "12121",
      },
      {
        name: "Joe Hang",
        avatar: "/images/team/joeHang.jpg",
        badgeNumber: "12222",
      },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    startDate: new Date(),
    endDate: new Date(),
    client: "RTOS/TOS",
  },
  {
    id: 2,
    name: "Customer Portal Redesign",
    description:
      "Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.",
    status: "completed",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
    ],
    teamMembers: [
      {
        name: "Usman",
        avatar: "/images/team/usmanChaudhr.jpg",
        badgeNumber: "12121",
      },
      {
        name: "Joe Hang",
        avatar: "/images/team/joeHang.jpg",
        badgeNumber: "12231",
      },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    client: "RTOS/TOS",
    startDate: new Date(),
    endDate: new Date(),
  },
  {
    id: 3,
    name: "Customer Portal Redesign",
    description:
      "Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.",
    status: "planning",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL"],
    teamMembers: [
      {
        name: "Usman",
        avatar: "/images/team/usmanChaudhr.jpg",
        badgeNumber: "12121",
      },
      {
        name: "Joe Hang",
        avatar: "/images/team/joeHang.jpg",
        badgeNumber: "12231",
      },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    client: "RTOS/TOS",
    startDate: new Date(),
    endDate: new Date(),
  },
  {
    id: 4,
    name: "Customer Portal Redesign",
    description:
      "Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.",
    status: "in progress",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL"],
    teamMembers: [
      {
        name: "Usman",
        avatar: "/images/team/usmanChaudhr.jpg",
        badgeNumber: "12121",
      },
      {
        name: "Joe Hang",
        avatar: "/images/team/joeHang.jpg",
        badgeNumber: "12231",
      },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    startDate: new Date(),
    endDate: new Date(),
    client: "RTOS/TOS",
  },
];

export const MyProjects = () => {
  const [filteredProjects, setFilteredProjects] = useState<IProject[]>([]);
  const [searchFilterValue, setSearchFilterValue] = useState<string>("");
  const [statusFilterValue, setStatusFilterValue] = useState<string>("all");
  const [isAddProjectFormOpen, setIsAddProjectFormOpen] =
    useState<boolean>(false);
  const [isEditProjectFormOpen, setIsEditProjectFormOpen] =
    useState<boolean>(false);
  const [project, setProject] = useState<IProject | null | undefined>();

  const closeAddProjectForm = () => {
    setIsEditProjectFormOpen(false);
  };

  const openEditProjectForm = (project: IProject) => {
    setIsEditProjectFormOpen(false);
    // const project: IProject = {
    //   id: id,
    //   name: name,
    //   description: description,
    //   status: status,
    //   technologies: technologies,
    //   teamMembers: teamMembers,
    //   githubUrl: githubUrl,
    //   startDate: startDate,
    //   endDate: endDate,
    // };

    setProject(project);
    setIsEditProjectFormOpen(true);
  };

  const closeEditProjectForm = () => {
    setIsEditProjectFormOpen(false);
  };

  useEffect(() => {
    setFilteredProjects(projects);
  }, []);

  const filterProjects = (
    searchFilterValue: string,
    statusFilterValue: string
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

  return (
    <div className="h-auto">
      <MyProjectForm
        isProjectFormOpen={isAddProjectFormOpen || isEditProjectFormOpen}
        closeProjectForm={() => {
          if (isAddProjectFormOpen) {
            closeAddProjectForm();
          } else if (isEditProjectFormOpen) {
            closeEditProjectForm();
          }
        }}
        project={project}
      />
      <div className="flex justify-between items-center mb-10">
        <div className="font-bold text-2xl">My Projects</div>
        <Button
          size="default"
          variant="outline"
          onClick={() => setIsAddProjectFormOpen(true)}
        >
          <PlusIcon className="size-3.5" color="black" />
          Add
        </Button>
      </div>
      <section>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects, technologies, or descriptions..."
              value={searchFilterValue}
              onChange={(e) =>
                filterProjects(e.target.value, statusFilterValue)
              }
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilterValue}
            onValueChange={(value) => filterProjects(searchFilterValue, value)}
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
            filteredProjects.map((project) => {
              return (
                <ProjectCard
                  project={project}
                  openEditProjectForm={openEditProjectForm}
                />
              );
            })}
        </div>
      </section>
    </div>
  );
};
