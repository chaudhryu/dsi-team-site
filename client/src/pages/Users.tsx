import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { envConfig } from "../config/envConfig";
import { Form, FormControl, FormMessage, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IRole } from "@/interfaces/IRole";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { fetchEmployeeDetails, fetchEmployeeHierarchy } from "@/Data/actions/EmployeeAction";
import { IReportTo } from "@/interfaces/IReportTo";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { UserRow } from "@/interfaces/IUser";
import { toggleUserAudit } from "@/Data/actions/UserActivityAction";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";

const userFormSchema = z.object({
  badge: z.string().length(5, "Badge number must have 5 characters"),
  role: z.object({
    id: z.number().int(),
    name: z.string().min(1, "Role is required"),
  }),
});

const roles: IRole[] = [
  { id: 0, name: "user" },
  { id: 1, name: "manager" },
  { id: 2, name: "high_manager" },
];

export default function Users() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [openUserForm, setOpenUserForm] = useState(false);
  const [openManagerForm, setOpenManagerForm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [costCenter, setCostCenter] = useState<number | undefined>(undefined);
  const [readOnly, setReadOnly] = useState(false);
  const [reportToLevelOne, setReportToLevelOne] = useState<IReportTo | undefined>(undefined);
  const [reportToLevelTwo, setReportToLevelTwo] = useState<IReportTo | undefined>(undefined);
  const [roleDropdownValues, setRoleDropdownValues] = useState<IRole[] | undefined>(undefined);

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      badge: "",
      role: { id: roles[0].id, name: roles[0].name },
    },
  });

  const firstInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    form.reset({
      badge: "",
      role: { id: roles[0].id, name: roles[0].name },
    });
    setFirstName("");
    setLastName("");
    setEmail("");
    setPosition("");
    setCostCenter(undefined);
    setReadOnly(false);
    setReportToLevelOne(undefined);
    setReportToLevelTwo(undefined);
    setErrMsg(null);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        console.error("GET /users failed", res.status, text);
        setRows([]);
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Network error /users:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (openUserForm || openManagerForm) {
      setTimeout(() => firstInputRef.current?.focus(), 0);
    }
  }, [openUserForm, openManagerForm]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((u) => {
      const hay = `${u.badge} ${u.firstName ?? ""} ${u.lastName ?? ""} ${u.email ?? ""} ${u.position ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q]);

  const handleOpenManagerForm = () => {
    resetForm();

    const managerRoleDropdownValues = roles.filter((r) => r.name !== "user");
    setRoleDropdownValues(managerRoleDropdownValues);

    const first = managerRoleDropdownValues[0];
    if (first) form.setValue("role", { id: first.id, name: first.name });

    setOpenManagerForm(true);
  };

  const handleOpenUserForm = () => {
    resetForm();

    const userRole = roles.find((r) => r.name === "user")!;
    form.setValue("role", { id: userRole.id, name: userRole.name });

    setRoleDropdownValues(undefined);
    setOpenUserForm(true);
  };

  const handleClose = () => {
    setOpenManagerForm(false);
    setOpenUserForm(false);
    resetForm();
  };

  const handleSubmit = async (data: z.infer<typeof userFormSchema>) => {
    try {
      setSaving(true);
      setErrMsg(null);

      await new Promise((r) => setTimeout(r, 500));

      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          badge: Number(data.badge),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          position: position.trim() || null,
          costCenter,
          readOnly,
          role: data.role.name,
          reportToLevelOne: reportToLevelOne?.badge,
          reportToLevelTwo: reportToLevelTwo?.badge,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("POST /users failed", res.status, text);
        setErrMsg("Failed to save user. The badge might already exist or the server rejected the data.");
        return;
      }

      const created: UserRow = await res.json();

      setRows((prev) => {
        const next = [...prev.filter((u) => u.badge !== created.badge), created];
        next.sort((a, b) => a.badge - b.badge);
        return next;
      });

      handleClose();
    } catch (err) {
      console.error("Network error creating user:", err);
      setErrMsg("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getUserDetails = async (badgeNumber: string) => {
    if (badgeNumber.length !== 5) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPosition("");
      setCostCenter(undefined);
      setReadOnly(false);
      setReportToLevelOne(undefined);
      setReportToLevelTwo(undefined);
      return;
    }

    try {
      setDetailsLoading(true);

      const [detailsResp, hierarchyResp] = await Promise.all([
        fetchEmployeeDetails(badgeNumber),
        fetchEmployeeHierarchy(badgeNumber),
      ]);

      const employeeDetails = detailsResp?.data;
      const employeeHierarchy = hierarchyResp?.data;

      setFirstName(employeeDetails?.employeeFirstName ?? "");
      setLastName(employeeDetails?.employeeLastName ?? "");
      setPosition(employeeDetails?.jobClassTitle ?? "");
      setEmail(employeeDetails?.employeeEmailAddress ?? "");

      const cc = Number(employeeDetails?.costCenter);
      setCostCenter(Number.isFinite(cc) ? cc : undefined);

      const levelOne = Array.isArray(employeeHierarchy) ? employeeHierarchy[1] : undefined;
      const levelTwo = Array.isArray(employeeHierarchy) ? employeeHierarchy[2] : undefined;

      setReportToLevelOne(levelOne ? { badge: levelOne.employeeBadgeNumber, name: levelOne.employeeName } : undefined);

      setReportToLevelTwo(levelTwo ? { badge: levelTwo.employeeBadgeNumber, name: levelTwo.employeeName } : undefined);
    } catch (e) {
      console.error("Failed to fetch employee details/hierarchy:", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleAudit = async (badge: number, currentValue: boolean) => {
    try {
      await toggleUserAudit(badge, !currentValue);
      setRows((prev) =>
        prev.map((u) => (u.badge === badge ? { ...u, auditEnabled: !currentValue } : u))
      );
    } catch (err) {
      console.error("Failed to toggle audit:", err);
      alert("Failed to toggle audit. Please try again.");
    }
  };

  const handleViewLogs = (badge: number) => {
    navigate(`/user-activity-logs/${badge}`);
  };

  const dialogOpen = openManagerForm || openUserForm;

  return (
    <div className="-m-4 md:-m-6">
      <header className="p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Users</h1>
      </header>

      <section className="px-6 md:px-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by badge, name, email, position"
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={load}
                className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>

              <button
                onClick={handleOpenUserForm}
                className="inline-flex items-center rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                + Add user
              </button>

              <button
                onClick={handleOpenManagerForm}
                className="inline-flex items-center rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                + Add manager
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      <section className="p-6 md:p-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-auto">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Users</h2>
          </div>

          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3 font-medium">Badge</th>
                <th className="px-6 py-3 font-medium">First Name</th>
                <th className="px-6 py-3 font-medium">Last Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Position</th>
                <th className="px-6 py-3 font-medium">Cost Center</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Report To Level One</th>
                <th className="px-6 py-3 font-medium">Report To Level Two</th>
                <th className="px-6 py-3 font-medium">Read Only</th>
                <th className="px-6 py-3 font-medium">Audit Enabled</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((u) => (
                <tr key={u.badge} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                  <td className="px-6 py-3">{u.badge}</td>
                  <td className="px-6 py-3">{u.firstName ?? ""}</td>
                  <td className="px-6 py-3">{u.lastName ?? ""}</td>
                  <td className="px-6 py-3">{u.email ?? ""}</td>
                  <td className="px-6 py-3">{u.position ?? ""}</td>
                  <td className="px-6 py-3">{u.costCenter ?? ""}</td>
                  <td className="px-6 py-3">{u.role ?? ""}</td>
                  <td className="px-6 py-3">{u.reportToLevelOne ?? ""}</td>
                  <td className="px-6 py-3">{u.reportToLevelTwo ?? ""}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.readOnly
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}
                    >
                      {u.readOnly ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleToggleAudit(u.badge, u.auditEnabled ?? false)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                        u.auditEnabled
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                      }`}
                    >
                      {u.auditEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    {u.auditEnabled && (
                      <button
                        onClick={() => handleViewLogs(u.badge)}
                        className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                      >
                        View Logs
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={12}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleClose();
        }}
      >
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{openUserForm ? "Add User" : "Add Manager"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              className="px-6 py-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(handleSubmit)();
              }}
            >
              {errMsg ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                  {errMsg}
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="badge"
                      render={({ field }) => {
                        const { ref: rhfRef, ...fieldProps } = field;

                        return (
                          <FormItem>
                            <FormLabel>
                              Badge <span className="text-red-600">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...fieldProps}
                                  type="number"
                                  ref={(el) => {
                                    rhfRef(el);
                                    firstInputRef.current = el;
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value);
                                    getUserDetails(value);
                                  }}
                                  className="w-full"
                                />
                                {detailsLoading ? (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <Spinner key={"circle"} variant={"circle"} className="w-5 h-5" />
                                  </div>
                                ) : null}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="w-1/2">
                    {openManagerForm && (
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Role <span className="text-red-600">*</span>
                            </FormLabel>

                            <Select
                              value={field.value?.id?.toString()}
                              onValueChange={(value) => {
                                const role = roleDropdownValues?.find((r) => r.id.toString() === value);
                                if (role) field.onChange({ id: role.id, name: role.name });
                              }}
                            >
                              <SelectTrigger className={`w-full ${form.formState.errors.role ? "border-red-500" : ""}`}>
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent>
                                {(roleDropdownValues ?? []).map((r: IRole) => (
                                  <SelectItem key={r.id} value={r.id.toString()}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First name <span className="text-red-600">*</span>
                    </label>
                    <Input disabled value={firstName} className="mt-1 block w-full" />
                  </div>

                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last name <span className="text-red-600">*</span>
                    </label>
                    <Input disabled value={lastName} className="mt-1 block w-full" />
                  </div>
                </div>

                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <Input disabled value={email} className="mt-1 block w-full" />
                  </div>

                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Position <span className="text-red-600">*</span>
                    </label>
                    <Input disabled value={position} className="mt-1 block w-full" />
                  </div>
                </div>

                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Report To Level One <span className="text-red-600">*</span>
                    </label>
                    <Input
                      disabled
                      value={
                        reportToLevelOne?.name && reportToLevelOne?.badge
                          ? `${reportToLevelOne.name} (${reportToLevelOne.badge})`
                          : ""
                      }
                      className="mt-1 block w-full"
                    />
                  </div>

                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Report To Level Two <span className="text-red-600">*</span>
                    </label>
                    <Input
                      disabled
                      value={
                        reportToLevelTwo?.name && reportToLevelTwo?.badge
                          ? `${reportToLevelTwo.name} (${reportToLevelTwo.badge})`
                          : ""
                      }
                      className="mt-1 block w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cost Center <span className="text-red-600">*</span>
                    </label>
                    <Input disabled type="number" value={costCenter ?? ""} className="mt-1 block w-full" />
                  </div>

                  <div className="flex items-center w-1/2">
                    <Input
                      disabled
                      id="readonly"
                      type="checkbox"
                      checked={readOnly}
                      onChange={(e) => setReadOnly(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="readonly" className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                      Read-only user
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || detailsLoading}
                  className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : openUserForm ? "Add user" : "Add manager"}
                </button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
