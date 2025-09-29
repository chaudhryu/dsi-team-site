import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IProjectCardProps } from "@/interfaces/IProjectCardProps";
import { EllipsisVertical, Github, Pencil, Trash } from "lucide-react";
import React from "react";
import { IRepository } from "@/interfaces/IRepository";
import { getUserImage } from "./UserImageUtil";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getStatusColor = (status: string) => {
  if (status === "in development") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  } else if (status === "in production") {
    return "bg-green-100 text-green-800 border-green-200";
  } else if (status === "planning") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

const ProjectCard: React.FC<IProjectCardProps> = ({
  project,
  openEditProjectForm,
  openDeleteProjectConfirmationDialog,
  isInternal,
}) => {
  return (
    // <div>
    <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex justify-between">
              <CardTitle className="text-xl mb-2 flex justify-between">{project.name}</CardTitle>
              {isInternal && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <EllipsisVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditProjectForm(project)}>
                      <Pencil className="mr-3 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => openDeleteProjectConfirmationDialog(project)}
                    >
                      <Trash className="mr-3 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <Badge variant="outline" className={`text-sm ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="text-md leading-relaxed">{project.description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Technologies */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Technologies</p>
          <div className="flex flex-wrap gap-1">
            {project.technologies?.map((technology) => (
              <Badge key={technology?.id} variant="secondary" className="text-md">
                {technology.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-4">
          <p className="text-md font-medium text-gray-700 mb-2">Team</p>
          <div className="flex -space-x-2">
            {project.projectMembers?.map((projectMember) => (
              <Tooltip>
                <TooltipTrigger>
                  <Avatar key={projectMember.badge} className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={getUserImage(projectMember.badge.toString())} alt={project.name} />
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent className="text-md">
                  {`${projectMember.firstName} ${projectMember.lastName} (${projectMember.badge})`}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Client */}
        <div className="mb-4">
          <p className="text-md font-medium text-gray-700 ">Client</p>
          <CardDescription className="text-md leading-relaxed">{project.client}</CardDescription>
        </div>

        {isInternal && (
          <div className="flex flex-wrap gap-2">
            {project.repositories?.map((repository: IRepository, index) => {
              return (
                <Button variant="outline" size="sm" key={index}>
                  <a href={repository.url} target="_blank" rel="noopener noreferrer" className="flex">
                    <Github className="h-4 w-4 mr-2" />
                    {repository.label}
                  </a>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
    // </div>
  );
};

export default ProjectCard;
