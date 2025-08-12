import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Github,
  Search,
  Users,
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

const projects: IProject[] = [
  {
    id: 1,
    name: "Customer Portal Redesign",
    description:
      "Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.",
    status: "in progress",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
    ],
    teamMembers: [
      { name: "Usman", avatar: "/images/team/usmanChaudhr.jpg" },
      { name: "Joe Hang", avatar: "/images/team/joeHang.jpg" },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    startDate: new Date(),
    endDate: new Date(),
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
      { name: "Usman", avatar: "/images/team/usmanChaudhr.jpg" },
      { name: "Joe Hang", avatar: "/images/team/joeHang.jpg" },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    startDate: new Date(),
    endDate: new Date(),
  },
  {
    id: 3,
    name: "Customer Portal Redesign",
    description:
      "Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.",
    status: "planning",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
    ],
    teamMembers: [
      { name: "Usman", avatar: "/images/team/usmanChaudhr.jpg" },
      { name: "Joe Hang", avatar: "/images/team/joeHang.jpg" },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    startDate: new Date(),
    endDate: new Date(),
  },
  {
    id: 4,
    name: "Customer Portal Redesign",
    description:
      "Complete overhaul of the customer-facing portal with modern UI/UX and improved performance.",
    status: "in progress",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
    ],
    teamMembers: [
      { name: "Usman", avatar: "/images/team/usmanChaudhr.jpg" },
      { name: "Joe Hang", avatar: "/images/team/joeHang.jpg" },
    ],
    githubUrl: "https://github.com/team/customer-portal",
    startDate: new Date(),
    endDate: new Date(),
  },
];

export const ProjectsExternal = () => {
  const [filteredProjects, setFilteredProjects] = useState<IProject[]>([]);
  const [totalCount, setTotalCount] = useState<number>();
  const [completedCount, setCompletedCount] = useState<number>();
  const [planningCount, setPlanningCount] = useState<number>();
  const [inProgressCount, setInProgressCount] = useState<number>();

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
    setPlanningCount(inProgressCount);
    setInProgressCount(inProgressCount);
  };

  useEffect(() => {
    setFilteredProjects(projects);
    setStats(projects);
  }, []);

  return (
    <div className="pl-20 pr-20 pt-10">
      <div className="text-3xl font-bold mb-8">Projects</div>
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
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects, technologies, or descriptions..."
            // value={searchTerm}
            // onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in progress">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-5">
        {filteredProjects.map((project) => {
          return (
            <ProjectCard
              id={project.id}
              name={project.name}
              description={project.description}
              status={project.status}
              technologies={project.technologies}
              teamMembers={project.teamMembers}
              startDate={project.startDate}
              endDate={project.endDate}
            />
          );
        })}
      </div>
    </div>
  );
};
