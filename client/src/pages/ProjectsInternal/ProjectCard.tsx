import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IProject } from "@/interfaces/IProject";
import { IProjectCardProps } from "@/interfaces/IProjectCardProps";
import {
  CalendarDays,
  Ellipsis,
  EllipsisVertical,
  Github,
  Pencil,
  Trash,
} from "lucide-react";
import { el } from "node_modules/@fullcalendar/core/internal-common";
import React, { useState } from "react";
import { MyProjectForm } from "./ProjectForm";

const getStatusColor = (status: string) => {
  if (status === "in progress") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  } else if (status === "completed") {
    return "bg-green-100 text-green-800 border-green-200";
  } else if (status === "planning") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

const ProjectCard: React.FC<IProjectCardProps> = ({
  index,
  project,
  openEditProjectForm,
  handleProjectsCache,
}) => {
  const deleteProject = (id: number) => {
    handleProjectsCache("delete", id, null);
  };

  return (
    // <div>
    <Card
      key={project.id}
      className="hover:shadow-lg transition-shadow duration-200"
    >
      <CardHeader className="pb-4">
        <div className="flex items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 flex justify-between">
              <span>{project.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <EllipsisVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => openEditProjectForm(project)}
                  >
                    <Pencil className="mr-3 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash className="mr-3 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Technologies */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Technologies</p>
          <div className="flex flex-wrap gap-1">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Team</p>
          <div className="flex -space-x-2">
            {project.teamMembers.map((teamMember) => (
              <Avatar
                key={teamMember.name}
                className="h-8 w-8 border-2 border-white"
              >
                <AvatarImage src={teamMember.avatar} alt={project.name} />
              </Avatar>
            ))}
          </div>
        </div>

        {/* Timeline
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 mr-2" />
            <span>
              {new Date(startDate).toLocaleDateString()}
              {endDate && ` - ${new Date(endDate).toLocaleDateString()}`}
            </span>
          </div>
        </div> */}

        {/* Client */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Client</p>
          <div className="flex flex-wrap gap-1">{project.client}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {project.repositoryUrl && (
            <Button variant="outline" size="sm">
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex"
              >
                <Github className="h-4 w-4 mr-2" />
                Code
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    // </div>
  );
};

export default ProjectCard;
