// src/pages/Accomplishments.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import DatePicker from "../components/form/date-picker";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { BoxIcon } from "../icons";
import { envConfig } from "../config/envConfig";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";
const LOGIN_KEY = envConfig.loginEmpKey || "loginEmployee";

type Accomplishment = {
  id: number;
  accomplishments: string;
  dateSubmitted: string | null;
  startWeekDate: string;
  endWeekDate: string;
  taskStatus?: string | null;
};

function mondayStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function sundayEnd(date = new Date()) {
  const mon = mondayStart(date);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return sun;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Accomplishments() {
  // Read user from localStorage (AuthCallback writes this)
  const lsUser = useMemo(() => {
    try {
      const raw = localStorage.getItem(LOGIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const badge = useMemo<number | null>(() => {
    const n = Number(lsUser?.badge);
    return Number.isFinite(n) ? n : null;
  }, [lsUser]);

  const [rows, setRows] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [weekStart, setWeekStart] = useState<string>(ymd(mondayStart()));
  const [weekEnd, setWeekEnd] = useState<string>(ymd(sundayEnd()));
  const [text, setText] = useState("");
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  const currentRecord = useMemo(
    () =>
      rows.find(
        (r) => r.startWeekDate === weekStart && r.endWeekDate === weekEnd,
      ) || null,
    [rows, weekStart, weekEnd],
  );

  const load = async () => {
    if (!badge) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, {
        credentials: "include",
      });
      if (!res.ok) {
        console.error("GET user accomplishments failed", res.status, await res.text());
        setRows([]);
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Network error loading accomplishments:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setWeekStart(ymd(mondayStart()));
    setWeekEnd(ymd(sundayEnd()));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge]);

  // if no record for the current week, prompt to submit
  useEffect(() => {
    if (!badge || loading) return;
    const exists = rows.some(
      (r) => r.startWeekDate === weekStart && r.endWeekDate === weekEnd,
    );
    if (!exists) {
      setText("");
      setError(null);
      setOpen(true);
    }
  }, [badge, rows, loading, weekStart, weekEnd]);

  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [open]);

  const handleSave = async () => {
    if (!badge) {
      setError("No logged-in user.");
      return;
    }
    if (!text.trim()) {
      setError("Please enter your accomplishments for the week.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (currentRecord) {
        // EDIT
        const res = await fetch(`${API_BASE}/weekly-accomplishments/${currentRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            accomplishments: text.trim(),
            startWeekDate: currentRecord.startWeekDate,
            endWeekDate: currentRecord.endWeekDate,
            taskStatus: "Submitted",
          }),
        });
        if (!res.ok) {
          console.error("PUT weekly-accomplishments failed", res.status, await res.text());
          setError("Failed to update. Please try again.");
          return;
        }
      } else {
        // CREATE
        const today = ymd(new Date());
        const res = await fetch(`${API_BASE}/weekly-accomplishments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userBadge: badge,
            accomplishments: text.trim(),
            dateSubmitted: today,
            startWeekDate: weekStart,
            endWeekDate: weekEnd,
            taskStatus: "Submitted",
          }),
        });
        if (!res.ok) {
          console.error("POST weekly-accomplishments failed", res.status, await res.text());
          setError("Failed to save. The record may already exist.");
          return;
        }
      }

      setOpen(false);
      setText("");
      await load();
    } catch (e) {
      console.error("Network error saving accomplishment:", e);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const rowsSorted = useMemo(
    () => [...rows].sort((a, b) => (a.startWeekDate < b.startWeekDate ? 1 : -1)),
    [rows],
  );

  if (!badge) {
    return (
      <div className="p-8">
        <PageMeta
          title="Weekly Accomplishments"
          description="Submit and review your weekly accomplishments"
        />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No logged-in user found. Please sign in first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Weekly Accomplishments"
        description="Submit and review your weekly accomplishments"
      />
      <PageBreadcrumb pageTitle="Weekly Accomplishments" />

      <div className="grid gap-6">
        <ComponentCard title={`Your Weekly Accomplishments (Badge ${badge})`}>
          <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Current week: <span className="font-medium">{weekStart}</span> →{" "}
              <span className="font-medium">{weekEnd}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={load}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
              {currentRecord ? (
                <Button
                  size="sm"
                  variant="primary"
                  startIcon={<BoxIcon className="size-5" />}
                  onClick={() => {
                    setText(currentRecord.accomplishments ?? "");
                    setError(null);
                    setOpen(true);
                  }}
                >
                  Edit current week
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  startIcon={<BoxIcon className="size-5" />}
                  onClick={() => {
                    setText("");
                    setError(null);
                    setOpen(true);
                  }}
                >
                  Submit this week
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3 font-medium w-44">Week</th>
                  <th className="px-5 py-3 font-medium">Accomplishment</th>
                  <th className="px-5 py-3 font-medium w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {rowsSorted.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {r.startWeekDate} → {r.endWeekDate}
                    </td>
                    <td className="px-5 py-4 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {r.accomplishments || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          (r.taskStatus ?? "Submitted") === "Submitted"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {r.taskStatus ?? "Submitted"}
                      </span>
                    </td>
                  </tr>
                ))}
                {rowsSorted.length === 0 && !loading && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={3}>
                      No accomplishments yet. Submit your first one for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === "Escape" && !saving && setOpen(false)}
        >
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentRecord ? "Edit Weekly Accomplishment" : "Submit Weekly Accomplishment"}
              </h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Week start</Label>
                  <DatePicker
                    id="week-start"
                    label=""
                    placeholder="YYYY-MM-DD"
                    defaultDate={new Date(weekStart)}
                    onChange={(_, s) => s && setWeekStart(s)}
                  />
                </div>
                <div>
                  <Label>Week end</Label>
                  <DatePicker
                    id="week-end"
                    label=""
                    placeholder="YYYY-MM-DD"
                    defaultDate={new Date(weekEnd)}
                    onChange={(_, s) => s && setWeekEnd(s)}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <textarea
                  ref={firstInputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : currentRecord ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
