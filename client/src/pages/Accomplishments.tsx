// src/pages/Accomplishments.tsx
import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/ui/button/Button";
import { BoxIcon } from "../icons";
import ReactQuillEditor from "../components/TextEditor/ReactQuillEditor";
import { envConfig } from "../config/envConfig";

import DOMPurify from "dompurify";
import { useLogin } from "@/context/LoginContext";
import { AccomplishmentSummaryDialog } from "@/components/modal/AccomplishmentSummaryDialog";
import { sendEmail } from "@/Data/actions/MailAction";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";
const LOGIN_KEY = envConfig.loginEmpKey || "loginEmployee";
const AI_SUMMARY_ENDPOINT = `${API_BASE}/ai/summarize-accomplishments`;

const ALLOWED_YEARS: number[] = [2025, 2026];

function FullscreenSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        <span className="text-white text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

type Accomplishment = {
  id: number;
  accomplishments: string;
  dateSubmitted: string | null;
  startWeekDate: string;
  endWeekDate: string;
  taskStatus?: string | null;
  costCenter: number | null;
};

type PersonalSummaryUser = {
  badge: number;
  name: string;
  summary_md: string;
  highlights?: string[];
  blockers?: string[];
  next_focus?: string[];
};
type PersonalSummaryResp = { users: PersonalSummaryUser[] };

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
function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function mondayStart(date = new Date()) {
  const d = new Date(date);
  const dow = d.getDay(); // 0..6 (Sun..Sat)
  const diff = dow === 0 ? -6 : 1 - dow;
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
function isoWeekNumber(d: Date) {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week: weekNo, year: utc.getUTCFullYear() };
}
function fmtShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type WeekOpt = { start: string; end: string; label: string };

function isoYearStartMonday(isoYear: number) {
  return mondayStart(new Date(isoYear, 0, 4));
}

function buildWeekOptionsForIsoYear(isoYear: number, maxStart?: Date): WeekOpt[] {
  const start = isoYearStartMonday(isoYear);
  const next = isoYearStartMonday(isoYear + 1);

  const weeks: WeekOpt[] = [];
  for (let mon = new Date(start); mon < next; mon = addDays(mon, 7)) {
    if (maxStart && mon.getTime() > maxStart.getTime()) break;

    const sun = sundayEnd(mon);
    const { week, year } = isoWeekNumber(mon);
    const label = `${year}-W${String(week).padStart(2, "0")} (${fmtShort(mon)} – ${fmtShort(sun)})`;
    weeks.push({ start: ymdLocal(mon), end: ymdLocal(sun), label });
  }

  return weeks.sort((a, b) => (a.start < b.start ? 1 : -1));
}

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ["class", "target", "rel", "data-list", "data-checked", "data-indent", "data-value"],
  });

const plainTextFromHtml = (html: string) =>
  DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\u00a0/g, " ")
    .trim();

function statusBadgeClasses(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "submitted") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (s === "missing") return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  if (s === "draft") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

function isFutureWeekStart(startYmd: string) {
  const start = mondayStart(parseYMD(startYmd));
  const current = mondayStart(new Date());
  return start.getTime() > current.getTime();
}

export default function Accomplishments() {
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

  const loginContext = useLogin();

  const currentIsoYear = useMemo(() => isoWeekNumber(new Date()).year, []);
  const yearOptions = useMemo(() => ALLOWED_YEARS.filter((y) => y <= currentIsoYear), [currentIsoYear]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (yearOptions.includes(currentIsoYear)) return currentIsoYear;
    return yearOptions[yearOptions.length - 1] ?? ALLOWED_YEARS[0];
  });

  useEffect(() => {
    if (yearOptions.length && !yearOptions.includes(selectedYear)) {
      setSelectedYear(yearOptions[yearOptions.length - 1] ?? ALLOWED_YEARS[0]);
    }
  }, [yearOptions, selectedYear]);

  const weekOptions = useMemo(() => {
    const cutoff = selectedYear === currentIsoYear ? mondayStart(new Date()) : undefined;
    return buildWeekOptionsForIsoYear(selectedYear, cutoff);
  }, [selectedYear, currentIsoYear]);

  const [weekStart, setWeekStart] = useState<string>(() => weekOptions[0]?.start ?? ymdLocal(mondayStart()));
  const [weekEnd, setWeekEnd] = useState<string>(() => weekOptions[0]?.end ?? ymdLocal(sundayEnd(mondayStart())));

  useEffect(() => {
    if (!weekOptions.length) return;
    const opt = weekOptions.find((w) => w.start === weekStart);
    if (!opt) {
      setWeekStart(weekOptions[0].start);
      setWeekEnd(weekOptions[0].end);
    } else if (opt.end !== weekEnd) {
      setWeekEnd(opt.end);
    }
  }, [weekOptions, weekStart, weekEnd]);

  const selectedLabel = useMemo(() => {
    const opt = weekOptions.find((w) => w.start === weekStart);
    return opt ? opt.label : `${weekStart} – ${weekEnd}`;
  }, [weekOptions, weekStart, weekEnd]);

  const [rows, setRows] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");

  const currentRecord = useMemo(() => rows.find((r) => r.startWeekDate === weekStart) || null, [rows, weekStart]);

  const [from, setFrom] = useState<string>(() => ymdLocal(addDays(mondayStart(new Date()), -21)));
  const [to, setTo] = useState<string>(() => ymdLocal(sundayEnd(mondayStart(new Date()))));
  const [summarizing, setSummarizing] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<PersonalSummaryResp | null>(null);
  const [sumError, setSumError] = useState<string | null>(null);

  useEffect(() => {
    if (!badge) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, { credentials: "include" });
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

  const openModal = (prefill = "") => {
    setText(prefill);
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!badge) {
      setError("No logged-in user.");
      return;
    }
    if (isFutureWeekStart(weekStart)) {
      setError("You cannot submit accomplishments for a future week.");
      return;
    }
    if (plainTextFromHtml(text).length === 0) {
      setError("Please enter your accomplishments for the week.");
      return;
    }

    setSaving(true);
    setError(null);

    const cleanHtml = sanitizeHtml(text);

    try {
      if (currentRecord) {
        const res = await fetch(`${API_BASE}/weekly-accomplishments/${currentRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            accomplishments: cleanHtml,
            startWeekDate: currentRecord.startWeekDate,
            endWeekDate: currentRecord.endWeekDate,
            taskStatus: "Submitted",
            costCenter: currentRecord.costCenter,
          }),
        });
        if (!res.ok) {
          console.error("PUT weekly-accomplishments failed", res.status, await res.text());
          setError("Failed to update. Please try again.");
          return;
        }
      } else {
        const today = ymdLocal(new Date());
        const res = await fetch(`${API_BASE}/weekly-accomplishments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userBadge: badge,
            costCenter: loginContext?.loginEmployee?.costCenter ?? null,
            accomplishments: cleanHtml,
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

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, { credentials: "include" });
        const data = res.ok ? await res.json() : [];
        setRows(Array.isArray(data) ? data : []);
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

  const displayRows = useMemo(() => {
    const byStart = new Map<string, Accomplishment>();
    for (const r of rows) byStart.set(r.startWeekDate, r);

    return weekOptions.map((w, idx) => {
      const found = byStart.get(w.start);
      if (found) return found;

      return {
        id: -1 - idx,
        accomplishments: "",
        dateSubmitted: null,
        startWeekDate: w.start,
        endWeekDate: w.end,
        taskStatus: "Missing",
        costCenter: null,
      } as Accomplishment;
    });
  }, [rows, weekOptions]);

  async function onSummarizeRange() {
    if (!badge) return;

    try {
      setSummarizing(true);
      setSumError(null);

      const inRange = rows.filter((d) => d.endWeekDate >= from && d.startWeekDate <= to);
      if (inRange.length === 0) {
        setSumError("No entries found in the selected date range.");
        return;
      }

      const payload = {
        from,
        to,
        includeTeamSummary: false,
        users: [
          {
            badge,
            name: lsUser ? `${lsUser.firstName ?? ""} ${lsUser.lastName ?? ""}`.trim() : `User #${badge}`,
            entries: inRange.map((d) => ({
              startWeekDate: d.startWeekDate,
              endWeekDate: d.endWeekDate,
              text: plainTextFromHtml(d.accomplishments || ""),
            })),
          },
        ],
      };

      const resp = await fetch(AI_SUMMARY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        try {
          const errJson = JSON.parse(errText);
          throw new Error(errJson.message ? JSON.stringify(errJson.message) : errText);
        } catch {
          throw new Error(errText);
        }
      }

      const json = (await resp.json()) as PersonalSummaryResp;
      setSummaryData(json);
      setSummaryOpen(true);
    } catch (e: any) {
      console.error(e);
      setSumError(e?.message || "Summarization failed. Please try again or adjust the date range.");
    } finally {
      setSummarizing(false);
    }
  }

  function downloadMarkdown() {
    if (!summaryData?.users?.length) return;
    const u = summaryData.users[0];

    const lines: string[] = [];
    lines.push(`# Weekly summary (${from} → ${to}) — ${u.name} (#${u.badge})\n`);
    lines.push(u.summary_md || "_(no generated summary)_");

    if (u.highlights?.length) {
      lines.push(`\n\n## Highlights`);
      u.highlights.forEach((h) => lines.push(`- ${h}`));
    }
    if (u.blockers?.length) {
      lines.push(`\n\n## Blockers`);
      u.blockers.forEach((b) => lines.push(`- ${b}`));
    }
    if (u.next_focus?.length) {
      lines.push(`\n\n## Next focus`);
      u.next_focus.forEach((n) => lines.push(`- ${n}`));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary_${u.badge}_${from}_${to}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!badge) return;
                  setLoading(true);
                  fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, { credentials: "include" })
                    .then((r) => (r.ok ? r.json() : []))
                    .then((d) => setRows(Array.isArray(d) ? d : []))
                    .catch(() => {})
                    .finally(() => setLoading(false));
                }}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </Button>

              <span className="text-xs text-gray-600 dark:text-gray-400">Year</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Gemini summary range</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-gray-500 text-xs">→</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <Button size="sm" variant="primary" onClick={onSummarizeRange} disabled={summarizing}>
                {summarizing ? "Summarizing…" : "Summarize (Gemini)"}
              </Button>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3 font-medium w-56">Week</th>
                  <th className="px-5 py-3 font-medium">Accomplishment</th>
                  <th className="px-5 py-3 font-medium w-44">Status / Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {displayRows.map((r) => {
                  const hasText = plainTextFromHtml(r.accomplishments || "").length > 0;
                  const status =
                    r.id > 0 ? r.taskStatus ?? (hasText ? "Submitted" : "Missing") : hasText ? "Submitted" : "Missing";
                  const isSubmitted = r.id > 0 && String(status).toLowerCase() === "submitted";
                  const futureWeek = isFutureWeekStart(r.startWeekDate);

                  return (
                    <tr
                      key={`${r.startWeekDate}-${r.endWeekDate}-${r.id}`}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {r.startWeekDate} → {r.endWeekDate}
                      </td>

                      <td className="px-5 py-4 text-gray-800 dark:text-gray-200">
                        {hasText ? (
                          <div className="ql-snow">
                            <div
                              className="ql-editor max-w-none"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.accomplishments) }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                            <span className="italic">No submission for this week.</span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={futureWeek}
                              onClick={() => {
                                setWeekStart(r.startWeekDate);
                                setWeekEnd(r.endWeekDate);
                                openModal("");
                              }}
                            >
                              Submit now
                            </Button>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClasses(
                              hasText ? "Submitted" : "Missing"
                            )}`}
                          >
                            {hasText ? "Submitted" : "Missing"}
                          </span>

                          {isSubmitted && (
                            <Button
                              size="sm"
                              variant="outline"
                              startIcon={<BoxIcon className="size-5" />}
                              onClick={() => {
                                setWeekStart(r.startWeekDate);
                                setWeekEnd(r.endWeekDate);
                                openModal(r.accomplishments ?? "");
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>

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

              <ReactQuillEditor
                value={text}
                onChange={(value) => setText(value)}
                className="text-sm text-gray-900 dark:text-gray-100 pb-6"
              />
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

      <AccomplishmentSummaryDialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        from={from}
        to={to}
        summaryData={summaryData}
        sumError={sumError}
        downloadMarkdown={downloadMarkdown}
        Button={Button}
        costCenter={loginContext?.loginEmployee?.costCenter ?? null}
        onSendEmail={async (draft) => {
          const response = await sendEmail({
            to: draft.to
              .split(/[;,]/)
              .map((s) => s.trim())
              .filter(Boolean),
            subject: draft.subject,
            body: draft.body,
          });

          if (!(response.status === 200 || response.status === 201)) {
            throw new Error("Failed to send email.");
          }
        }}
      />

      {loading && <FullscreenSpinner label="Loading your accomplishments…" />}
    </div>
  );
}
