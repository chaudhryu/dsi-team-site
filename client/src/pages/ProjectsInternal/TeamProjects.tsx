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
import Button from "@/components/ui/button/Button";

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
  },
];

export const TeamProjects = () => {
  const [filteredProjects, setFilteredProjects] = useState<IProject[]>([]);
  const [totalCount, setTotalCount] = useState<number>();
  const [completedCount, setCompletedCount] = useState<number>();
  const [planningCount, setPlanningCount] = useState<number>();
  const [inProgressCount, setInProgressCount] = useState<number>();
  const [searchFilterValue, setSearchFilterValue] = useState<string>("");
  const [statusFilterValue, setStatusFilterValue] = useState<string>("all");

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
      {/* <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 h-screen">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-50 w-full p-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-6">
              Engineering Excellence in Action
            </h1>
            <p className="text-white mb-8 leading-relaxed">
              Discover the innovative solutions our software engineering team
              has built. From AI-powered platforms to scalable web applications,
              we deliver technology that drives real business impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Explore Our Work
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline">Get In Touch</Button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-row justify-center items-center gap-52">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">5000+</div>
              <div className="text-gray-600">Users Served</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{30}</div>
              <div className="text-gray-600">Projects Delivered</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {avgRating}
              </div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">5</div>
              <div className="text-gray-600">Industry Awards</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Stats Section */}
      <section className="pr-20 pl-20">
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
      </section>
    </div>
  );
};
