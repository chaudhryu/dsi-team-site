// src/pages/Users.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { envConfig } from "../config/envConfig";
import { Form, FormControl, FormMessage, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IProjectMember } from "@/interfaces/IProjectMember";
import { IRole } from "@/interfaces/IRole";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Input } from "@/components/ui/input";
import { fetchEmployeeDetails, fetchEmployeeHierarchy } from "@/Data/actions/EmployeeAction";
import { IReportTo } from "@/interfaces/IReportTo";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { UserRow } from "@/interfaces/IUser";
import { report } from "process";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";

const userFormSchema = z.object({
  badge: z.string().length(5, "Badge number must have 5 characters"),
  role: z.object({
    id: z.int(),
    name: z.string(),
  }),
});

const roles = [
  { id: 0, name: "user" },
  { id: 1, name: "manager" },
  { id: 2, name: "high_manager" },
];

export default function Users() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // modal state
  const [openUserForm, setOpenUserForm] = useState(false);
  const [openManagerForm, setOpenManagerForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [costCenter, setCostCenter] = useState<number>();
  const [readOnly, setReadOnly] = useState(false);
  const [reportToLevelOne, setReportToLevelOne] = useState<IReportTo>();
  const [reportToLevelTwo, setReportToLevelTwo] = useState<IReportTo>();
  const [roleDropdownValues, setRoleDropdownValues] = useState<IRole[]>();
  const [isPerformingAction, setIsPerformingAction] = useState<boolean>();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      badge: "",
      role: {
        id: undefined,
        name: "",
      },
    },
  });

  const firstInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    form.reset();
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
      // focus the first input when modal opens
      setTimeout(() => firstInputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((u) => {
      const hay = `${u.badge} ${u.firstName ?? ""} ${u.lastName ?? ""} ${u.email ?? ""} ${
        u.position ?? ""
      }`.toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q]);

  const handleOpenManagerForm = () => {
    resetForm();
    const managerRoleDropdownValues = roles.filter((role) => role.name !== "user");
    setRoleDropdownValues(managerRoleDropdownValues);
    setOpenManagerForm(true);
  };

  const handleOpenUserForm = () => {
    resetForm();
    const roleDropdownValue = roles.find((roleDropdownValue) => roleDropdownValue.name === "user");
    console.log(roleDropdownValue);
    if (
      roleDropdownValue &&
      (roleDropdownValue.id !== null || roleDropdownValue.id !== undefined) &&
      roleDropdownValue.name
    ) {
      form.setValue("role", { id: roleDropdownValue?.id, name: roleDropdownValue?.name });
    }
    setOpenUserForm(true);
  };

  const handleClose = () => {
    setOpenManagerForm(false);
    setOpenUserForm(false);
    resetForm();
  };

  // const validate = () => {
  //   if (!badge || isNaN(Number(badge))) return "Badge must be a number.";
  //   if (!firstName.trim()) return "First name is required.";
  //   if (!lastName.trim()) return "Last name is required.";
  //   if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Valid email is required.";
  //   return null;
  // };

  const handleSubmit = async (data: z.infer<typeof userFormSchema>) => {
    // const v = validate();
    // if (v) {
    //   setErrMsg(v);
    //   return;
    // }
    // setSaving(true);
    // setErrMsg(null);

    try {
      setIsPerformingAction(true);
      setTimeout(async () => {
        // if (!project) {
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
            costCenter: costCenter,
            readOnly,
            role: data.role?.name,
            reportToLevelOne: reportToLevelOne?.badge,
            reportToLevelTwo: reportToLevelTwo?.badge,
          }),
        });
        // } else {
        // updateProject(data);
        if (!res.ok) {
          const text = await res.text();
          console.error("POST /users failed", res.status, text);
          setErrMsg("Failed to save user. The badge might already exist or the server rejected the data.");
          return;
        }

        const created: UserRow = await res.json();
        // Optimistic: append & sort by badge; or just reload()
        setRows((prev) => {
          const next = [...prev, created];
          next.sort((a, b) => a.badge - b.badge);
          return next;
        });
        handleClose();
        resetForm();
      }, 1200);
    } catch (err) {
      console.error("Network error creating user:", err);
      setErrMsg("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getUserDetails = async (badgeNumber: string) => {
    if (badgeNumber.length === 5) {
      const employeeDetails = (await fetchEmployeeDetails(badgeNumber))?.data;
      const employeeHierarchy = (await fetchEmployeeHierarchy(badgeNumber))?.data;
      console.log(employeeDetails);
      setFirstName(employeeDetails.employeeFirstName);
      setLastName(employeeDetails.employeeLastName);
      setCostCenter(employeeDetails.costCenter);
      setPosition(employeeDetails.jobClassTitle);
      setEmail(employeeDetails.employeeEmailAddress);
      setReportToLevelOne({ badge: employeeHierarchy[1].employeeBadgeNumber, name: employeeHierarchy[1].employeeName });
      setReportToLevelTwo({ badge: employeeHierarchy[2].employeeBadgeNumber, name: employeeHierarchy[2].employeeName });
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPosition("");
      setCostCenter(undefined);
      setReadOnly(false);
      setReportToLevelOne({ badge: undefined, name: undefined });
      setReportToLevelTwo({ badge: undefined, name: undefined });
      console.log(reportToLevelOne);
    }
  };

  return (
    <div className="-m-4 md:-m-6">
      {/* Header */}
      <header className="p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Users</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Directory of users from the backend (SQLite via Nest + TypeORM).
        </p>
      </header>

      {/* Filters / Actions */}
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

      {/* Table */}
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
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Dialog open={openManagerForm || openUserForm} onOpenChange={handleClose}>
        {!isLoading ? (
          <DialogContent className="w-full max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{openUserForm ? "Add User" : "Add Manager"}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                className="px-6 py-5 space-y-4"
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Badge <span className="text-red-600">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value);
                                  getUserDetails(value);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
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
                              <div className="flex gap-3">
                                <Select
                                  key={field.name || ""}
                                  value={field.value?.id?.toString()}
                                  onValueChange={(value) => {
                                    if (value) {
                                      console.log(value);
                                      const role = roleDropdownValues?.find(
                                        (roleDropdownValue) => roleDropdownValue?.id?.toString() === value
                                      );
                                      console.log(role);
                                      field.onChange({ id: role?.id, name: role?.name });
                                    }
                                  }}
                                >
                                  <SelectTrigger
                                    className={`w-full ${form.formState.errors.role ? "border-red-500" : ""}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roleDropdownValues &&
                                      roleDropdownValues.length > 0 &&
                                      roleDropdownValues.map((managerTypeDropdownValue: IRole) => (
                                        <SelectItem
                                          key={managerTypeDropdownValue.id}
                                          value={managerTypeDropdownValue.id.toString()}
                                        >
                                          {managerTypeDropdownValue.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
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
                      <Input
                        disabled
                        value={firstName}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last name <span className="text-red-600">*</span>
                      </label>
                      <Input
                        disabled
                        value={lastName}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <Input
                        disabled
                        value={email}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Position <span className="text-red-600">*</span>
                      </label>
                      <Input
                        disabled
                        value={position}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
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
                          reportToLevelOne && reportToLevelOne?.name && reportToLevelOne?.badge
                            ? `${reportToLevelOne?.name} (${reportToLevelOne?.badge})`
                            : ""
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Report To Level Two <span className="text-red-600">*</span>
                      </label>
                      <Input
                        disabled
                        value={
                          reportToLevelTwo && reportToLevelTwo.name && reportToLevelTwo.badge
                            ? `${reportToLevelTwo?.name} (${reportToLevelTwo?.badge})`
                            : ""
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cost Center <span className="text-red-600">*</span>
                      </label>
                      <Input
                        disabled
                        type="number"
                        value={costCenter}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="flex items-center w-1/2">
                      <Input
                        disabled
                        id="readonly"
                        type="checkbox"
                        checked={readOnly}
                        onChange={(e) => setReadOnly(e.target.checked)}
                        className="flex justify-center items-center h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                    disabled={saving}
                    className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : openUserForm ? "Add user" : "Add manager"}
                  </button>
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
    </div>
  );
}
