import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Textarea } from "@/components/ui/textarea";
import { envConfig } from "@/config/envConfig";
import { IMyProjectFormProps } from "@/interfaces/IMyProjectFormProps";
import { IProject } from "@/interfaces/IProject";
import { IProjectMember } from "@/interfaces/IProjectMember";
import { IRepository } from "@/interfaces/IRepository";
import { ITechnology } from "@/interfaces/ITechnology";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github, Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";

const projectFormSchema = z
  .object({
    name: z.string().min(1, "Project Name is required"),
    status: z.string().min(1, "Project Status is required"),
    description: z.string().min(1, "Description is required"),
    client: z.string().optional(),
    repositoryLabel: z.string().optional(),
    repositoryUrl: z.string().optional(),
    selectedProjectMemberBadgeNumber: z.string().optional(),
    selectedTechnologyId: z.string().optional(),
    autoFocusRepository: z.boolean(),
    autoFocusSelectedProjectMemberBadgeNumber: z.boolean(),
    autoFocusSelectedTechnologyId: z.boolean(),
  })
  .refine(
    (data) =>
      data.autoFocusRepository === false ||
      (!data.repositoryLabel && !data.repositoryUrl) ||
      (!data.repositoryLabel && data.repositoryUrl) ||
      (data.repositoryLabel && !data.repositoryUrl),
    {
      message: " ",
      path: ["repositoryLabel"],
    }
  )
  .refine(
    (data) =>
      data.autoFocusRepository === false ||
      (!data.repositoryLabel && !data.repositoryUrl) ||
      (!data.repositoryLabel && data.repositoryUrl) ||
      (data.repositoryLabel && !data.repositoryUrl),
    {
      message: " ",
      path: ["repositoryUrl"],
    }
  )
  .refine((data) => (!data.repositoryLabel && !data.repositoryUrl) || data.repositoryUrl, {
    message: "Repository url is required",
    path: ["repositoryUrl"],
  })
  .refine((data) => (!data.repositoryLabel && !data.repositoryUrl) || data.repositoryLabel, {
    message: "Repository label Is required",
    path: ["repositoryLabel"],
  })
  .refine(
    (data) =>
      data.autoFocusSelectedProjectMemberBadgeNumber === false || data.selectedProjectMemberBadgeNumber === undefined,
    {
      message: "Click + to add your selected project member",
      path: ["selectedProjectMemberBadgeNumber"],
    }
  )
  .refine((data) => data.autoFocusSelectedTechnologyId === false || data.selectedTechnologyId === undefined, {
    message: "Click + to add your selected technology",
    path: ["selectedTechnologyId"],
  });

export const ProjectForm: React.FC<IMyProjectFormProps> = ({
  isProjectFormOpen,
  closeProjectForm,
  project,
  handleProjectsCache,
}) => {
  //form.handleSubmit will only run onSubmit if validation passes
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      status: "",
      description: "",
      client: "",
      repositoryLabel: "",
      repositoryUrl: "",
      selectedProjectMemberBadgeNumber: undefined,
      selectedTechnologyId: undefined,
      autoFocusRepository: false,
      autoFocusSelectedProjectMemberBadgeNumber: false,
      autoFocusSelectedTechnologyId: false,
    },
  });

  const [repositories, setRepositories] = useState<IRepository[]>([]);
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<IProjectMember[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<ITechnology[]>([]);
  const [projectMembersDropdownValues, setProjectMembersDropdownValues] = useState<IProjectMember[]>([]);
  const [technologiesDropdownValues, setTechnologiesDropdownValues] = useState<ITechnology[]>([]);
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

  const fetchAndSetProjectMembersDropdownValues = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setProjectMembersDropdownValues(data);
      } else {
        const text = await res.text();
        console.error("GET /users failed", res.status, text);
        setProjectMembersDropdownValues([]);
      }
    } catch (e) {
      console.error("Network error /users:", e);
      setProjectMembersDropdownValues([]);
    }
  };

  useEffect(() => {
    if (isProjectFormOpen) {
      setIsLoading(true);
      setTimeout(() => {
        fetchAndSetTechnologiesDropdown();
        fetchAndSetProjectMembersDropdownValues();

        if (project) {
          form.setValue("name", project.name, { shouldValidate: true, shouldDirty: true });
          form.setValue("client", project.client ?? "", { shouldValidate: true, shouldDirty: true });
          form.setValue("status", project.status, { shouldValidate: true, shouldDirty: true });
          form.setValue("description", project.description, { shouldValidate: true, shouldDirty: true });
          setRepositories(project.repositories ?? []);
          setSelectedProjectMembers(project.projectMembers ?? []);
          setSelectedTechnologies(project.technologies ?? []);
        }

        setIsLoading(false);
      }, 1200);
    }
  }, [isProjectFormOpen, project]);

  const addProjectMember = () => {
    const selectedProjectMemberBadgeNumber = form.watch("selectedProjectMemberBadgeNumber");
    if (selectedProjectMemberBadgeNumber) {
      const selectedProjectMember: IProjectMember | undefined = projectMembersDropdownValues.find(
        (projectMembersDropdownValue) => projectMembersDropdownValue.badge === +selectedProjectMemberBadgeNumber
      );

      if (selectedProjectMember) {
        setSelectedProjectMembers((prevSelectedProjectMembers) => {
          return [...prevSelectedProjectMembers, selectedProjectMember];
        });

        setProjectMembersDropdownValues((prevProjectMembersDropdownValues) => {
          return prevProjectMembersDropdownValues.filter(
            (prevProjectMembersDropdownValue) => prevProjectMembersDropdownValue.badge !== selectedProjectMember?.badge
          );
        });

        form.resetField("selectedProjectMemberBadgeNumber");
        form.setValue("autoFocusSelectedProjectMemberBadgeNumber", false);
      }
    }
  };

  const addTechnology = () => {
    const selectedTechnologyId = form.watch("selectedTechnologyId");
    if (selectedTechnologyId) {
      form.clearErrors("selectedTechnologyId");
      const selectedTechnology: ITechnology | undefined = technologiesDropdownValues.find(
        (technologiesDropdownValue) => technologiesDropdownValue.id === +selectedTechnologyId
      );

      if (selectedTechnology) {
        setSelectedTechnologies((prevSelectedTechnologies) =>
          selectedTechnology ? [...prevSelectedTechnologies, selectedTechnology] : prevSelectedTechnologies
        );

        setTechnologiesDropdownValues((prevTechnologiesDropDownValues) => {
          return prevTechnologiesDropDownValues.filter(
            (prevTechnologiesDropdownValue) => prevTechnologiesDropdownValue.id !== selectedTechnology?.id
          );
        });

        form.resetField("selectedTechnologyId");
        form.setValue("autoFocusSelectedTechnologyId", false);
      }
    }
  };

  const addRepository = () => {
    const repositoryLabel = form.watch("repositoryLabel");
    const repositoryUrl = form.watch("repositoryUrl");

    if (repositoryLabel && repositoryUrl) {
      setRepositories((prevRepositories) =>
        repositoryLabel && repositoryUrl
          ? [...prevRepositories, { label: repositoryLabel, url: repositoryUrl }]
          : prevRepositories
      );

      form.resetField("repositoryLabel");
      form.resetField("repositoryUrl");
      form.setValue("autoFocusRepository", false);
    }
  };

  const clearAllFieldsAndCloseProjectForm = () => {
    closeProjectForm();
    setTimeout(() => {
      form.reset();
      setSelectedProjectMembers([]);
      setSelectedTechnologies([]);
      setProjectMembersDropdownValues([]);
      setTechnologiesDropdownValues([]);
      setRepositories([]);
    }, 200);
    // setIsLoading(true);
  };

  const addProject = async (data: z.infer<typeof projectFormSchema>) => {
    try {
      if (data.name && data.status && data.description) {
        const selectedTechnologyIds = selectedTechnologies.map((selectedTechnology) => selectedTechnology.id);

        const selectedProjectMemberIds = selectedProjectMembers.map(
          (selectedProjectMember) => selectedProjectMember.badge
        );

        const res = await fetch(`${API_BASE}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            status: data.status,
            client: data.client,
            technologyIds: selectedTechnologyIds,
            projectMemberBadgeNumbers: selectedProjectMemberIds,
            repositories: repositories,
          }),
        });

        if (res.ok) {
          const newProject = await res.json();
          handleProjectsCache("add", null, newProject);
        }
      } else {
        console.log("Empty Fields!");
      }
    } catch (err) {
      console.error("Network error adding project:", err);
    } finally {
      setIsPerformingAction(false);
      clearAllFieldsAndCloseProjectForm();
    }
  };

  const updateProject = async (data: z.infer<typeof projectFormSchema>) => {
    try {
      if (project?.id && data.name && data.status && data.description) {
        const selectedTechnologyIds = selectedTechnologies.map((selectedTechnology) => selectedTechnology.id);

        const selectedProjectMemberIds = selectedProjectMembers.map(
          (selectedProjectMember) => selectedProjectMember.badge
        );

        const res = await fetch(`${API_BASE}/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            status: data.status,
            client: data.client,
            technologyIds: selectedTechnologyIds,
            projectMemberBadgeNumbers: selectedProjectMemberIds,
            repositories: repositories,
          }),
        });

        const updatedProject: IProject = {
          id: project?.id,
          name: data.name,
          description: data.description,
          status: data.status,
          technologies: selectedTechnologies,
          projectMembers: selectedProjectMembers,
          repositories: repositories,
          client: data.client,
        };

        if (res.ok) {
          handleProjectsCache("update", null, updatedProject);
        }
      } else {
        console.log("Empty Fields!");
      }
    } catch (err) {
      console.error("Network error updating project:", err);
    } finally {
      setIsPerformingAction(false);
      clearAllFieldsAndCloseProjectForm();
    }
  };

  const onSubmit = (data: z.infer<typeof projectFormSchema>) => {
    console.log("hello");
    setIsPerformingAction(true);
    setTimeout(() => {
      if (!project) {
        addProject(data);
      } else {
        updateProject(data);
      }
    }, 1200);
  };

  const removeSelectedProjectMember = (selectedProjectMemberForRemoval: IProjectMember) => {
    if (selectedProjectMemberForRemoval) {
      setSelectedProjectMembers((prevSelectedProjectMembers) =>
        prevSelectedProjectMembers.filter(
          (prevSelectedProjectMember: IProjectMember) =>
            prevSelectedProjectMember.badge !== selectedProjectMemberForRemoval.badge
        )
      );

      setProjectMembersDropdownValues((prevProjectMembersDropdownValues) => [
        ...prevProjectMembersDropdownValues,
        selectedProjectMemberForRemoval,
      ]);
    }
  };

  const removeSelectedTechnology = (selectedTechnologyForRemoval: ITechnology) => {
    if (selectedTechnologyForRemoval) {
      setSelectedTechnologies((prevSelectedTechnologies) =>
        prevSelectedTechnologies.filter(
          (prevSelectedTechnology) => prevSelectedTechnology.id !== selectedTechnologyForRemoval.id
        )
      );

      setTechnologiesDropdownValues((prevTechnologiesDropDownValues) => [
        selectedTechnologyForRemoval,
        ...prevTechnologiesDropDownValues,
      ]);
    }
  };

  const removeRepository = (indexToRemove: number) => {
    setRepositories((prevRepositories) => prevRepositories.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Dialog open={isProjectFormOpen} onOpenChange={clearAllFieldsAndCloseProjectForm}>
      {!isLoading ? (
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{project ? "Update Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                form.watch("selectedProjectMemberBadgeNumber") &&
                  form.setValue("autoFocusSelectedProjectMemberBadgeNumber", true);
                form.watch("selectedTechnologyId") && form.setValue("autoFocusSelectedTechnologyId", true);
                form.watch("repositoryUrl") &&
                  form.watch("repositoryLabel") &&
                  form.setValue("autoFocusRepository", true);
                form.handleSubmit(onSubmit)();
              }}
            >
              <div className="flex flex-row gap-5 justify-between">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Project Name <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input maxLength={125} placeholder="Enter Project Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Project Status <span className="text-red-600">*</span>
                      </FormLabel>
                      <Select
                        key={field.value ?? projectMembersDropdownValues.length}
                        value={field.value}
                        onValueChange={(value) => {
                          console.log(value);
                          field.onChange(value);
                        }}
                      >
                        <SelectTrigger
                          className={`w-full sm:w-48 ${form.formState.errors.status ? "border-red-500" : ""}`}
                        >
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in development">In Development</SelectItem>
                          <SelectItem value="in production">In Production</SelectItem>
                          <SelectItem value="planning">Planning</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <FormControl>
                        <Input maxLength={125} {...field} placeholder="Enter Client" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-7 flex flex-col gap-3">
                <FormLabel>
                  Description <span className="text-red-600">*</span>
                </FormLabel>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea maxLength={5000} {...field} placeholder="Enter Description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col mt-7 gap-2">
                <FormLabel>Repositories</FormLabel>
                <div className="flex gap-3">
                  <div className="w-[45%]">
                    <FormField
                      control={form.control}
                      name="repositoryLabel"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              maxLength={125}
                              {...field}
                              placeholder="Enter Repository Label"
                              onChange={(e) => {
                                field.onChange(e);
                                form.trigger(["repositoryLabel", "repositoryUrl"]);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-[45%]">
                    <FormField
                      control={form.control}
                      name="repositoryUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              maxLength={250}
                              {...field}
                              placeholder="Enter Repository Url"
                              onChange={(e) => {
                                field.onChange(e);
                                form.trigger(["repositoryLabel", "repositoryUrl"]);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addRepository}
                    disabled={
                      (form.watch("repositoryLabel") != "" && form.watch("repositoryUrl") == "") ||
                      (form.watch("repositoryLabel") == "" && form.watch("repositoryUrl") != "") ||
                      (form.watch("repositoryLabel") == "" && form.watch("repositoryUrl") == "")
                    }
                    className="w-[10%]"
                  >
                    <Plus />
                  </Button>
                </div>
                {form.formState.errors.repositoryLabel && form.formState.errors.repositoryUrl && (
                  <p className="text-destructive text-sm">Click + to add repository</p>
                )}
              </div>
              {repositories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
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
                        <div onClick={() => removeRepository(index)} className="flex justify-center items-center">
                          <X className="h-3 w-3 cursor-pointer" />
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}
              {/* <div className="mt-2">
            <Label>Database Information</Label>
            <div className="flex flex-row gap-5 justify-between">
              <Input
                placeholder="Database Server Name"
                value={databaseServerName ?? ""}
                onChange={(e) => setDatabaseServerName(e.target.value)}
              />
              <Input
                placeholder="Database User Name"
                value={databaseUserName ?? ""}
                onChange={(e) => setDatabaseUserName(e.target.value)}
              />
              <Input
                placeholder="Database Password"
                value={databasePassword ?? ""}
                onChange={(e) => setDatabasePassword(e.target.value)}
              />
            </div>
          </div> */}
              <div className="mt-7">
                <FormField
                  control={form.control}
                  name="selectedProjectMemberBadgeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Members</FormLabel>
                      <div className="flex gap-3">
                        <Select
                          key={field.value ?? projectMembersDropdownValues.length}
                          value={field.value?.toString()}
                          onValueChange={(value) => {
                            console.log(value);
                            field.onChange(value.toString());
                          }}
                        >
                          <SelectTrigger
                            className={`w-full  ${
                              form.formState.errors.selectedProjectMemberBadgeNumber ? "border-red-500" : ""
                            }`}
                          >
                            <SelectValue placeholder="Select Technologies" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectMembersDropdownValues &&
                              projectMembersDropdownValues.map((projectMemberDropDownValue) => (
                                <SelectItem
                                  key={projectMemberDropDownValue.badge}
                                  value={projectMemberDropDownValue.badge.toString()}
                                >
                                  {`${projectMemberDropDownValue.firstName} ${projectMemberDropDownValue.lastName} ${projectMemberDropDownValue.badge}`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => addProjectMember()}
                          disabled={!form.watch("selectedProjectMemberBadgeNumber")}
                          className="w-[10%]"
                        >
                          <Plus />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedProjectMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProjectMembers.map((selectedProjectMember: IProjectMember) => (
                      <Badge
                        key={selectedProjectMember.badge}
                        variant="secondary"
                        className="flex items-center gap-1 text-sm"
                      >
                        {`${selectedProjectMember.firstName} ${selectedProjectMember.lastName} (${selectedProjectMember.badge})`}
                        <div onClick={() => removeSelectedProjectMember(selectedProjectMember)}>
                          <X className="h-3 w-3 cursor-pointer" />
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-7 mb-7">
                <div>
                  <FormField
                    control={form.control}
                    name="selectedTechnologyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technologies</FormLabel>
                        <div className="flex gap-3">
                          <Select
                            key={field.value ?? technologiesDropdownValues.length}
                            value={field.value?.toString()}
                            onValueChange={(value) => {
                              console.log(value);
                              field.onChange(value);
                            }}
                          >
                            <SelectTrigger
                              className={`w-full  ${
                                form.formState.errors.selectedTechnologyId ? "border-red-500" : ""
                              }`}
                            >
                              <SelectValue placeholder="Select Technologies" />
                            </SelectTrigger>
                            <SelectContent>
                              {technologiesDropdownValues &&
                                technologiesDropdownValues.map((technology) => (
                                  <SelectItem key={technology.id} value={technology.id.toString()}>
                                    {technology.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            onClick={() => addTechnology()}
                            disabled={!form.watch("selectedTechnologyId")}
                            className="w-[10%]"
                          >
                            <Plus />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {selectedTechnologies && selectedTechnologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTechnologies.map((selectedTechnology) => (
                      <Badge
                        key={selectedTechnology.id}
                        variant="secondary"
                        className="flex items-center gap-1 text-sm"
                      >
                        {selectedTechnology.name}
                        <div>
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeSelectedTechnology(selectedTechnology)}
                          />
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-5 flex justify-end">
                {!isPerformingAction ? (
                  <div>
                    <Button variant="outline" onClick={clearAllFieldsAndCloseProjectForm} className="mr-2">
                      Cancel
                    </Button>
                    <Button type="submit">{project ? "Update" : "Add"}</Button>
                  </div>
                ) : (
                  <div>{project ? "Updating..." : "Adding..."}</div>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      ) : (
        <DialogContent>
          <div className="flex w-full h-full flex-col justify-center items-center gap-3">
            <Spinner key={"circle"} variant={"circle"} className="w-10 h-10" />
            <p className="text-xl">Loading...</p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
