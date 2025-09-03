import { IProject } from "@/interfaces/IProject";

export const projectsData: IProject[] = [
  {
    id: 1,
    name: "AFSCME OT",
    description: "Overtime Portal",
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
        name: "Joel Joshy",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        badgeNumber: "12121",
      },
      {
        name: "Joe Hang",
        avatar: "/images/team/joeHang.jpg",
        badgeNumber: "12222",
      },
    ],
    repositories: [
      {
        label: "Front Office",
        url: "https://github.com/METRO-APPS/afscme-ot-forms-spfx",
      },
      {
        label: "Back Office",
        url: "https://github.com/METRO-APPS/afscme-ot-backoffice",
      },
    ],
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
    repositories: [
      {
        label: "Front Office",
        url: "https://github.com/METRO-APPS/afscme-ot-forms-spfx",
      },
      {
        label: "Back Office",
        url: "https://github.com/METRO-APPS/afscme-ot-backoffice",
      },
    ],
    client: "RTOS/TOS",
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
    repositories: [
      {
        label: "Front Office",
        url: "https://github.com/METRO-APPS/afscme-ot-forms-spfx",
      },
      {
        label: "Back Office",
        url: "https://github.com/METRO-APPS/afscme-ot-backoffice",
      },
    ],
    client: "RTOS/TOS",
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
    repositories: [
      {
        label: "Front Office",
        url: "https://github.com/METRO-APPS/afscme-ot-forms-spfx",
      },
      {
        label: "Back Office",
        url: "https://github.com/METRO-APPS/afscme-ot-backoffice",
      },
    ],
    client: "RTOS/TOS",
  },
];
