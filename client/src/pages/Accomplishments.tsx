// src/pages/Accomplishments.tsx
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
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
  startWeekDate: string; // 'YYYY-MM-DD'
  endWeekDate: string;   // 'YYYY-MM-DD'
  taskStatus?: string | null;
};

/* -------------------- date helpers (local-time safe) -------------------- */
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function mondayStart(date = new Date()) {
  const d = new Date(date);
  const dow = d.getDay(); // 0..6 (Sun..Sat)
  const diff = dow === 0 ? -6 : 1 - dow; // back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function sundayEnd(mon: Date) {
  const s = new Date(mon);
  s.setDate(mon.getDate() + 6);
  s.setHours(23, 59, 59, 999);
  return s;
}
// ISO week number (Thursday rule)
function isoWeekNumber(d: Date) {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: utc.getUTCFullYear() };
}
function fmtShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type WeekOpt = {
  start: string; // YYYY-MM-DD (Monday)
  end: string;   // YYYY-MM-DD (Sunday)
  label: string; // e.g. "W34 (Aug 18 – Aug 24, 2025)"
};

// Build a list of week options around "now" (current week first)
function buildWeekOptions(center = new Date(), past = 26, future = 0): WeekOpt[] {
  const currentMon = mondayStart(center);
  const total = past + future + 1;
  const weeks: WeekOpt[] = [];

  for (let i = 0; i < total; i++) {
    const offsetWeeks = future - i; // places current week at index = future
    const mon = addDays(currentMon, offsetWeeks * 7);
    const sun = sundayEnd(mon);
    const { week } = isoWeekNumber(mon);
    const label = `W${String(week).padStart(2, "0")} (${fmtShort(mon)} – ${fmtShort(sun)}, ${sun.getFullYear()})`;
    weeks.push({ start: ymdLocal(mon), end: ymdLocal(sun), label });
  }

  // most recent first (current week at top)
  return weeks.sort((a, b) => (a.start < b.start ? 1 : -1));
}

export default function Accomplishments() {
  /* ---- who is logged in (from localStorage) ---- */
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

  /* ---- week dropdown ---- */
  const weekOptions = useMemo(() => {
    const { week } = isoWeekNumber(new Date());
    return buildWeekOptions(new Date(), week - 1, 0);
  }, []);
    const [weekStart, setWeekStart] = useState<string>(() => weekOptions[0]?.start ?? ymdLocal(mondayStart()));
  const [weekEnd, setWeekEnd] = useState<string>(() => weekOptions[0]?.end ?? ymdLocal(sundayEnd(mondayStart())));

  const selectedLabel = useMemo(() => {
    const opt = weekOptions.find(w => w.start === weekStart);
    return opt ? opt.label : `${weekStart} – ${weekEnd}`;
  }, [weekOptions, weekStart, weekEnd]);

  const onSelectWeek = (e: ChangeEvent<HTMLSelectElement>) => {
    const start = e.target.value;
    const opt = weekOptions.find(w => w.start === start);
    if (opt) {
      setWeekStart(opt.start);
      setWeekEnd(opt.end); // keep end in sync here → no effect needed
    }
  };

  /* ---- data + UI state ---- */
  const [rows, setRows] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // modal state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form
  const [text, setText] = useState("");
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  // current record for selected week
  const currentRecord = useMemo(
    () => rows.find(r => r.startWeekDate === weekStart && r.endWeekDate === weekEnd) || null,
    [rows, weekStart, weekEnd]
  );

  // one effect: load when we know the badge
  useEffect(() => {
    if (!badge) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, {
          credentials: "include",
        });
        if (!res.ok) {
          console.error("GET user accomplishments failed", res.status, await res.text());
          setRows([]);
        } else {
          const data = await res.json();
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Network error loading accomplishments:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [badge]);

  // helper to open modal and focus the textarea (instead of an effect)
  const openModal = (prefill = "") => {
    setText(prefill);
    setError(null);
    setOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 0);
  };

  /* ---- save/create ---- */
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
        const today = ymdLocal(new Date());
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

      // close + refresh
      setOpen(false);
      setText("");

      // re-load without adding another effect
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, {
          credentials: "include",
        });
        const data = res.ok ? await res.json() : [];
        setRows(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    } catch (e) {
      console.error("Network error saving accomplishment:", e);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const rowsSorted = useMemo(
    () => [...rows].sort((a, b) => (a.startWeekDate < b.startWeekDate ? 1 : -1)),
    [rows]
  );

  if (!badge) {
    return (
      <div className="p-8">
        <PageMeta title="Weekly Accomplishments" description="Submit and review your weekly accomplishments" />
        <p className="text-sm text-gray-600 dark:text-gray-300">No logged-in user found. Please sign in first.</p>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Weekly Accomplishments" description="Submit and review your weekly accomplishments" />
      <PageBreadcrumb pageTitle="Weekly Accomplishments" />

      <div className="grid gap-6">
        <ComponentCard title={`Your Weekly Accomplishments (Badge ${badge})`}>
          {/* Week selector + actions */}
          <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600 dark:text-gray-300">Week</Label>
              <select
                value={weekStart}
                onChange={onSelectWeek}
                className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {weekOptions.map((w) => (
                  <option key={w.start} value={w.start}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={() => {
                // simply reuse the same loader
                if (badge) {
                  setLoading(true);
                  fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, { credentials: "include" })
                    .then(r => r.ok ? r.json() : [])
                    .then(d => setRows(Array.isArray(d) ? d : []))
                    .catch(() => {})
                    .finally(() => setLoading(false));
                }
              }}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
              {currentRecord ? (
                <Button
                  size="sm"
                  variant="primary"
                  startIcon={<BoxIcon className="size-5" />}
                  onClick={() => openModal(currentRecord.accomplishments ?? "")}
                >
                  Edit the selected week
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  startIcon={<BoxIcon className="size-5" />}
                  onClick={() => openModal("")}
                >
                  Submit for selected week
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3 font-medium w-56">Week</th>
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
                      No accomplishments yet. Submit one for the selected week.
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
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Week: {selectedLabel}</div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                  {error}
                </div>
              )}

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
