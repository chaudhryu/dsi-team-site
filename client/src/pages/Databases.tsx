import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { envConfig } from "@/config/envConfig";
import { PlusIcon, Search } from "lucide-react";

/** ------------ Types ------------ */
type DatabaseLogin = {
  id: number;
  role: string;
  username: string;
};

type Database = {
  id: number;
  name: string;
  host: string;
  serviceName: string;
  port: string;
  engine: string;
  status: string; // "active" | "inactive"
  logins?: DatabaseLogin[];
};

/** ------------ Config ------------ */
const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3005/api";

/** ----------------------------------------------------------------------------
 * Databases page (styled like Projects page)
 * ---------------------------------------------------------------------------*/
export default function Databases() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [filteredDatabases, setFilteredDatabases] = useState<Database[]>([]);

  const [searchFilterValue, setSearchFilterValue] = useState<string>("");
  const [statusFilterValue, setStatusFilterValue] = useState<string>("all");
  const [engineFilterValue, setEngineFilterValue] = useState<string>("all");

  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState<boolean>(false);
  const [dbEditing, setDbEditing] = useState<Database | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [dbToDelete, setDbToDelete] = useState<Database | null>(null);

  // Stats
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [inactiveCount, setInactiveCount] = useState<number>(0);
  const [withLoginsCount, setWithLoginsCount] = useState<number>(0);

  // Drawer for logins
  const [loginsFor, setLoginsFor] = useState<Database | null>(null);

  /** Unique engines for engine filter (derived from data) */
  const engineOptions = useMemo(() => {
    const set = new Set<string>();
    databases.forEach((d) => d.engine && set.add(d.engine.toLowerCase()));
    return ["all", ...Array.from(set)];
  }, [databases]);

  /** Fetch data + initialize UI (mirrors your Projects page timing) */
  const fetchAndSetDatabases = async () => {
    try {
      const res = await fetch(`${API_BASE}/databases`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: Database[] = await res.json();
        setDatabases(data);
        setFilteredDatabases(data);
        setStats(data);
      } else {
        console.error("GET /databases failed", res.status, await res.text());
        setDatabases([]);
        setFilteredDatabases([]);
        setStats([]);
      }
    } catch (e) {
      console.error("Network error /databases:", e);
      setDatabases([]);
      setFilteredDatabases([]);
      setStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAndSetDatabases();
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  /** Stats like your Projects page */
  const setStats = (rows: Database[]) => {
    let active = 0;
    let inactive = 0;
    let withLogins = 0;
    rows.forEach((d) => {
      const s = (d.status || "").toLowerCase();
      if (s === "active") active += 1;
      else if (s === "inactive") inactive += 1;
      if ((d.logins?.length ?? 0) > 0) withLogins += 1;
    });
    setTotalCount(rows.length);
    setActiveCount(active);
    setInactiveCount(inactive);
    setWithLoginsCount(withLogins);
  };

  /** Filter function (search + status + engine) */
  const filterDatabases = (
    searchValue: string,
    statusValue: string,
    engineValue: string,
    rows: Database[],
  ) => {
    setSearchFilterValue(searchValue);
    setStatusFilterValue(statusValue);
    setEngineFilterValue(engineValue);

    const matchesSearch = (d: Database) => {
      if (!searchValue) return true;
      const q = searchValue.toLowerCase();
      return (
        d.name?.toLowerCase().includes(q) ||
        d.host?.toLowerCase().includes(q) ||
        d.serviceName?.toLowerCase().includes(q) ||
        d.engine?.toLowerCase().includes(q)
      );
    };

    const matchesStatus =
      statusValue === "all"
        ? () => true
        : (d: Database) => (d.status || "").toLowerCase() === statusValue.toLowerCase();

    const matchesEngine =
      engineValue === "all"
        ? () => true
        : (d: Database) => (d.engine || "").toLowerCase() === engineValue.toLowerCase();

    const result = rows.filter(
      (d) => matchesSearch(d) && matchesStatus(d) && matchesEngine(d),
    );
    setFilteredDatabases(result);
  };

  /** Local cache updates (add/update/delete) like Projects page */
  const handleDatabasesCache = (
    action: "add" | "update" | "delete",
    id: number | null | undefined,
    db: Database | null,
  ) => {
    setDatabases((prev) => {
      if (action === "add" && db) {
        const next = [...prev, db];
        setStats(next);
        filterDatabases(searchFilterValue, statusFilterValue, engineFilterValue, next);
        return next;
      }
      if (action === "update" && db) {
        const next = prev.map((p) => (p.id === db.id ? db : p));
        setStats(next);
        filterDatabases(searchFilterValue, statusFilterValue, engineFilterValue, next);
        return next;
      }
      if (action === "delete" && id != null) {
        const next = prev.filter((p) => p.id !== id);
        setStats(next);
        filterDatabases(searchFilterValue, statusFilterValue, engineFilterValue, next);
        return next;
      }
      return prev;
    });
  };

  /** Delete with a simple confirm (swap for your dialog if preferred) */
  const confirmDelete = async (db: Database) => {
    setDbToDelete(db);
    const ok = window.confirm(
      `Are you sure you would like to delete this database: ${db.name}?`,
    );
    if (!ok) {
      setDbToDelete(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/databases/${db.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        console.error("DELETE /databases/:id failed", await res.text());
        return;
      }
      handleDatabasesCache("delete", db.id, null);
    } catch (err) {
      console.error("Network error deleting database:", err);
    } finally {
      setDbToDelete(null);
    }
  };

  return !isLoading ? (
    <div className="h-full">
      {/* Forms */}
      <DatabaseForm
        isOpen={isAddFormOpen || isEditFormOpen}
        closeForm={() => {
          setIsAddFormOpen(false);
          setIsEditFormOpen(false);
          setDbEditing(null);
        }}
        database={dbEditing}
        onSaved={(action, entity) => {
          handleDatabasesCache(action, entity?.id, entity ?? null);
        }}
      />

      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div className="font-bold text-2xl">Databases</div>
        <Button
          size="default"
          variant="outline"
          onClick={() => setIsAddFormOpen(true)}
        >
          <PlusIcon className="size-3.5" color="black" />
          Add
        </Button>
      </div>

      {/* Stats cards (like Projects) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-10">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-black text-center text-5xl">{totalCount}</p>
              <p className="font-medium text-gray-600 text-lg">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-green-600 text-center text-5xl">{activeCount}</p>
              <p className="font-medium text-gray-600 text-lg">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-yellow-600 text-center text-5xl">{inactiveCount}</p>
              <p className="font-medium text-gray-600 text-lg">Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-blue-600 text-center text-5xl">{withLoginsCount}</p>
              <p className="font-medium text-gray-600 text-lg">With Logins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters row (search + status + engine) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search name, host, service, or engine..."
            value={searchFilterValue}
            onChange={(e) =>
              filterDatabases(
                e.target.value,
                statusFilterValue,
                engineFilterValue,
                databases,
              )
            }
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilterValue}
          onValueChange={(value) =>
            filterDatabases(searchFilterValue, value, engineFilterValue, databases)
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={engineFilterValue}
          onValueChange={(value) =>
            filterDatabases(searchFilterValue, statusFilterValue, value, databases)
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by engine" />
          </SelectTrigger>
          <SelectContent>
            {engineOptions.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "all" ? "All Engines" : e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table inside a Card */}
      {filteredDatabases && filteredDatabases.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-600 text-sm">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Engine</th>
                  <th className="px-4 py-3">Host</th>
                  <th className="px-4 py-3">Service / DB</th>
                  <th className="px-4 py-3">Port</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Logins</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDatabases.map((db) => (
                  <tr key={db.id} className="text-gray-900">
                    <td className="px-4 py-3">{db.name}</td>
                    <td className="px-4 py-3 uppercase">{db.engine}</td>
                    <td className="px-4 py-3">{db.host}</td>
                    <td className="px-4 py-3">{db.serviceName}</td>
                    <td className="px-4 py-3">{db.port}</td>
                    <td className="px-4 py-3 capitalize">{db.status}</td>
                    <td className="px-4 py-3">{db.logins?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDbEditing(db);
                            setIsEditFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLoginsFor(db)}
                        >
                          Manage Logins
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmDelete(db)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <div className="flex h-full w-full flex-col justify-center items-center gap-3 mt-20">
          <p className="text-xl">No Databases Found!</p>
        </div>
      )}

      {/* Drawer for logins */}
      {loginsFor && (
        <LoginsDrawer
          db={loginsFor}
          onClose={() => setLoginsFor(null)}
          onChanged={async () => {
            await fetchAndSetDatabases();
          }}
        />
      )}
    </div>
  ) : (
    <div className="flex w-full h-full flex-col justify-center items-center gap-3">
      <Spinner key={"circle"} variant={"circle"} className="w-12 h-12" />
      <p className="text-2xl">Loading...</p>
    </div>
  );
}

/** ----------------------------------------------------------------------------
 * Database Form (Add / Edit)
 * ---------------------------------------------------------------------------*/
function DatabaseForm({
  isOpen,
  closeForm,
  database,
  onSaved,
}: {
  isOpen: boolean;
  closeForm: () => void;
  database: Database | null;
  onSaved: (action: "add" | "update", db?: Database) => void;
}) {
  const isEdit = !!database;
  const [form, setForm] = useState<Partial<Database>>({
    name: database?.name ?? "",
    engine: database?.engine ?? "",
    host: database?.host ?? "",
    serviceName: database?.serviceName ?? "",
    port: database?.port ?? "",
    status: database?.status ?? "active",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setForm({
        name: database?.name ?? "",
        engine: database?.engine ?? "",
        host: database?.host ?? "",
        serviceName: database?.serviceName ?? "",
        port: database?.port ?? "",
        status: database?.status ?? "active",
      });
    } else {
      setForm({
        name: "",
        engine: "",
        host: "",
        serviceName: "",
        port: "",
        status: "active",
      });
    }
  }, [isEdit, database?.id]);

  const save = async () => {
    try {
      setSubmitting(true);
      const method = isEdit ? "PATCH" : "POST";
      const url = isEdit
        ? `${API_BASE}/databases/${database!.id}`
        : `${API_BASE}/databases`;

      const res = await fetch(url, {
        method,
               credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const saved: Database = await res.json();
      onSaved(isEdit ? "update" : "add", saved);
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-lg bg-white border p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Database" : "New Database"}
          </h2>
          <Button variant="outline" onClick={closeForm}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput
            label="Name"
            value={form.name ?? ""}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <LabeledInput
            label="Engine"
            placeholder="postgres | oracle | mysql | sqlserver"
            value={form.engine ?? ""}
            onChange={(v) => setForm({ ...form, engine: v })}
          />
          <LabeledInput
            label="Host"
            value={form.host ?? ""}
            onChange={(v) => setForm({ ...form, host: v })}
          />
          <LabeledInput
            label="Service / DB Name"
            value={form.serviceName ?? ""}
            onChange={(v) => setForm({ ...form, serviceName: v })}
          />
          <LabeledInput
            label="Port"
            value={form.port ?? ""}
            onChange={(v) => setForm({ ...form, port: v })}
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">Status</label>
            <Select
              value={form.status ?? "active"}
              onValueChange={(val) => setForm({ ...form, status: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={closeForm}>
            Cancel
          </Button>
          <Button onClick={save} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** ----------------------------------------------------------------------------
 * Logins Drawer – with admin-only Reveal
 * ---------------------------------------------------------------------------*/
function LoginsDrawer({
  db,
  onClose,
  onChanged,
}: {
  db: Database;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [logins, setLogins] = useState<DatabaseLogin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ role: "", username: "", password: "" });
  const [editing, setEditing] = useState<
    { [id: number]: { role: string; username: string; password?: string } }
  >({});

  // Admin check (replace with your real auth/roles if available)
  const isAdmin = true;

  // Ephemeral revealed values: { [loginId]: { value, expiresAt } }
  const [revealed, setRevealed] = useState<Record<number, { value: string; expiresAt: number }>>({});

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/databases/${db.id}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Database = await res.json();
      setLogins(data.logins ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load logins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.id]);

  const startEdit = (l: DatabaseLogin) =>
    setEditing((prev) => ({ ...prev, [l.id]: { role: l.role, username: l.username } }));

  const cancelEdit = (id: number) =>
    setEditing(({ [id]: _, ...rest }) => rest);

  const saveEdit = async (id: number) => {
    const payload = editing[id];
    const res = await fetch(`${API_BASE}/databases/${db.id}/logins/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await refresh();
    cancelEdit(id);
    onChanged();
  };

  const deleteLogin = async (id: number) => {
    if (!confirm("Delete this login?")) return;
    const res = await fetch(`${API_BASE}/databases/${db.id}/logins/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await refresh();
    onChanged();
  };

  const addLogin = async () => {
    const res = await fetch(`${API_BASE}/databases/${db.id}/logins`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    setAddForm({ role: "", username: "", password: "" });
    await refresh();
    onChanged();
  };

  // --- Reveal password flow (admin-only) ---
  const revealPassword = async (loginId: number) => {
    try {
        const res = await fetch(`${API_BASE}/databases/${db.id}/logins/${loginId}/reveal`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
      if (res.status === 403) {
        alert("Admin privileges required to reveal passwords.");
        return;
      }
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const { password } = await res.json();
      const ttlMs = 20_000; // visible for 20s
      const expiresAt = Date.now() + ttlMs;
      setRevealed((prev) => ({ ...prev, [loginId]: { value: password, expiresAt } }));
      setTimeout(() => {
        setRevealed((prev) => {
          const next = { ...prev };
          delete next[loginId];
          return next;
        });
      }, ttlMs);
    } catch (e) {
      console.error(e);
      alert("Failed to reveal password.");
    }
  };

  const hideRevealed = (loginId: number) =>
    setRevealed((prev) => {
      const next = { ...prev };
      delete next[loginId];
      return next;
    });

  const copyRevealed = async (loginId: number) => {
    const value = revealed[loginId]?.value;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex">
      <div className="ml-auto h-full w-full max-w-xl bg-white border-l p-6 overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Manage Logins — <span className="text-gray-500">{db.name}</span>
          </h2>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        {error && (
          <div className="mb-4 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Add new login */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-600 mb-3">Add New Login</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <LabeledInput
                label="Role"
                value={addForm.role}
                onChange={(v) => setAddForm({ ...addForm, role: v })}
              />
              <LabeledInput
                label="Username"
                value={addForm.username}
                onChange={(v) => setAddForm({ ...addForm, username: v })}
              />
              <LabeledInput
                type="password"
                label="Password"
                value={addForm.password}
                onChange={(v) => setAddForm({ ...addForm, password: v })}
              />
            </div>
            <div className="mt-4">
              <Button onClick={addLogin}>Add Login</Button>
            </div>
          </CardContent>
        </Card>

        {/* Logins table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-600 text-sm">
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : logins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-gray-500">
                      No logins
                    </td>
                  </tr>
                ) : (
                  logins.map((l) => {
                    const edit = editing[l.id];
                    const isRevealed =
                      !!revealed[l.id]?.value && revealed[l.id]!.expiresAt > Date.now();
                    return (
                      <tr key={l.id}>
                        <td className="px-4 py-3 align-middle">
                          {edit ? (
                            <Input
                              value={edit.role}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [l.id]: { ...prev[l.id], role: e.target.value },
                                }))
                              }
                            />
                          ) : (
                            l.role
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {edit ? (
                            <Input
                              value={edit.username}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [l.id]: { ...prev[l.id], username: e.target.value },
                                }))
                              }
                            />
                          ) : (
                            l.username
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {edit ? (
                            <Input
                              type="password"
                              placeholder="(leave blank to keep unchanged)"
                              onChange={(e) =>
                                setEditing((prev) => {
                                  const v = e.target.value;
                                  const next = { ...prev[l.id] };
                                  if (v) (next as any).password = v;
                                  else delete (next as any).password;
                                  return { ...prev, [l.id]: next };
                                })
                              }
                            />
                          ) : isRevealed ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono break-all">
                                {revealed[l.id]!.value}
                              </span>
                              <Button size="sm" variant="outline" onClick={() => copyRevealed(l.id)}>
                                Copy
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => hideRevealed(l.id)}>
                                Hide
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">••••••••</span>
                              {isAdmin && (
                                <Button size="sm" variant="outline" onClick={() => revealPassword(l.id)}>
                                  Reveal
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {edit ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveEdit(l.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => cancelEdit(l.id)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(l)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteLogin(l.id)}>
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Simple label + Input combo using your shadcn Input */
function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
