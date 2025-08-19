import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IProject } from "@/interfaces/IProject";
import { CalendarDays, Github } from "lucide-react";
import React from "react";

const getStatusColor = (status: string) => {
  if (status === "in progress") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  } else if (status === "completed") {
    return "bg-green-100 text-green-800 border-green-200";
  } else if (status === "planning") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

const ProjectCard: React.FC<IProject> = ({
  id,
  name,
  description,
  status,
  technologies,
  teamMembers,
  githubUrl,
  startDate,
  endDate,
}) => {
  return (
    <Card key={id} className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{name}</CardTitle>
            <div className="flex gap-2 mb-3">
              <Badge variant="outline" className={getStatusColor(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Technologies */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Technologies</p>
          <div className="flex flex-wrap gap-1">
            {technologies.map((tech) => (
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
            {teamMembers.map((teamMember) => (
              <Avatar
                key={teamMember.name}
                className="h-8 w-8 border-2 border-white"
              >
                <AvatarImage src={teamMember.avatar} alt={name} />
              </Avatar>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 mr-2" />
            <span>
              {new Date(startDate).toLocaleDateString()}
              {endDate && ` - ${new Date(endDate).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {githubUrl && (
            <Button variant="outline" size="sm">
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                Code
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
