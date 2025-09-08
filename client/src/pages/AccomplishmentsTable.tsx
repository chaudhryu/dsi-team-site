// src/pages/AccomplishmentsTable.tsx
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { envConfig } from "../config/envConfig";

/* ⬇️ DOMPurify + Quill viewer CSS so stored HTML renders correctly */
import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";

/* -------------------- Types -------------------- */
type User = {
  badge: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  position?: string | number | null;
};

type WA = {
  id: number;
  accomplishments: string | null;
  startWeekDate: string; // YYYY-MM-DD
  endWeekDate: string; // YYYY-MM-DD
  taskStatus?: string | null;
};

type Row = {
  user: User;
  wa: WA | null; // accomplishment for the selected week (or null)
};

type UserSummary = {
  badge: number;
  name: string;
  summary_md: string;
  highlights?: string[];
  blockers?: string[];
  next_focus?: string[];
};
type SummarizeResponse = { users: UserSummary[]; team_themes?: string[] };

/* -------------------- HTML helpers -------------------- */
// Keep Quill's data-* attributes so lists/checkboxes render
const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ["class", "target", "rel", "data-list", "data-checked", "data-indent", "data-value"],
  });

const hasContent = (html?: string | null) =>
  !!html &&
  DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\u00a0/g, " ")
    .trim().length > 0;

const plainTextFromHtml = (html: string) =>
  DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

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
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week: weekNo, year: utc.getUTCFullYear() };
}
function fmtShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type WeekOpt = { start: string; end: string; label: string };

// Build a list of week options around "now" (current week first)
function buildWeekOptions(center = new Date(), past = 26, future = 0): WeekOpt[] {
  const currentMon = mondayStart(center);
  const total = past + future + 1;
  const weeks: WeekOpt[] = [];
  for (let i = 0; i < total; i++) {
    const offsetWeeks = future - i; // current week ends up near the top
    const mon = addDays(currentMon, offsetWeeks * 7);
    const sun = sundayEnd(mon);
    const { week } = isoWeekNumber(mon);
    weeks.push({
      start: ymdLocal(mon),
      end: ymdLocal(sun),
      label: `W${String(week).padStart(2, "0")} (${fmtShort(mon)} – ${fmtShort(sun)}, ${sun.getFullYear()})`,
    });
  }
  // Most recent first (current week at top)
  return weeks.sort((a, b) => (a.start < b.start ? 1 : -1));
}

/* -------------------- Component -------------------- */
export default function AccomplishmentsTable() {
  /* Week dropdown (current week + previous N) */
  const weekOptions = useMemo(() => {
    const { week } = isoWeekNumber(new Date());
    return buildWeekOptions(new Date(), Math.max(week - 1, 26), 0);
  }, []);

  const [weekStart, setWeekStart] = useState<string>(() => weekOptions[0]?.start ?? ymdLocal(mondayStart()));
  const [weekEnd, setWeekEnd] = useState<string>(() => weekOptions[0]?.end ?? ymdLocal(sundayEnd(mondayStart())));
  const onSelectWeek = (e: ChangeEvent<HTMLSelectElement>) => {
    const start = e.target.value;
    const opt = weekOptions.find((w) => w.start === start);
    if (opt) {
      setWeekStart(opt.start);
      setWeekEnd(opt.end);
    }
  };

  /* Data state */
  const [users, setUsers] = useState<User[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* 🔹 Summarization (date range + modal) */
  const [from, setFrom] = useState<string>(() => ymdLocal(addDays(mondayStart(new Date()), -21))); // last 3 weeks
  const [to, setTo] = useState<string>(() => ymdLocal(sundayEnd(mondayStart(new Date()))));
  const [summarizing, setSummarizing] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SummarizeResponse | null>(null);
  const [sumError, setSumError] = useState<string | null>(null);

  /* Load users once, then per-week accomplishments */
  useEffect(() => {
    (async () => {
      try {
        const ures = await fetch(`${API_BASE}/users`, { credentials: "include" });
        const udata: User[] = ures.ok ? await ures.json() : [];
        udata.sort((a, b) => {
          const al = (a.lastName || "").toLowerCase();
          const bl = (b.lastName || "").toLowerCase();
          if (al === bl) {
            return (a.firstName || "").localeCompare(b.firstName || "", undefined, { sensitivity: "base" });
          }
          return al.localeCompare(bl);
        });
        setUsers(udata);
      } catch (e) {
        console.error("Failed to load users", e);
        setUsers([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!users.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const perUser = await Promise.all(
          users.map(async (u) => {
            try {
              const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${u.badge}`, {
                credentials: "include",
              });
              const data: WA[] = res.ok ? await res.json() : [];
              const match =
                data.find((d) => d.startWeekDate === weekStart && d.endWeekDate === weekEnd) || null;
              return { user: u, wa: match } as Row;
            } catch {
              return { user: u, wa: null } as Row;
            }
          })
        );
        setRows(perUser);
      } catch (e) {
        console.error("Failed to load accomplishments per user", e);
        setRows(users.map((u) => ({ user: u, wa: null })));
      } finally {
        setLoading(false);
      }
    })();
  }, [users, weekStart, weekEnd]);

  /* Summarize range handler */
  async function onSummarizeRange() {
    try {
      setSummarizing(true);
      setSumError(null);

      const payloadUsers = await Promise.all(
        users.map(async (u) => {
          try {
            const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${u.badge}`, {
              credentials: "include",
            });
            const data: WA[] = res.ok ? await res.json() : [];
            const inRange = data.filter((d) => d.endWeekDate >= from && d.startWeekDate <= to);
            return {
              badge: u.badge,
              name: `${u.firstName} ${u.lastName}`,
              entries: inRange.map((d) => ({
                startWeekDate: d.startWeekDate,
                endWeekDate: d.endWeekDate,
                text: plainTextFromHtml(d.accomplishments || ""),
              })),
            };
          } catch {
            return { badge: u.badge, name: `${u.firstName} ${u.lastName}`, entries: [] };
          }
        })
      );

      const resp = await fetch(`${API_BASE}/ai/summarize-accomplishments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          from,
          to,
          users: payloadUsers,
          includeTeamSummary: true,
        }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const json = (await resp.json()) as SummarizeResponse;
      setSummaryData(json);
      setSummaryOpen(true);
    } catch (e: any) {
      console.error(e);
      setSumError("Summarization failed. Please try again or narrow the date range.");
    } finally {
      setSummarizing(false);
    }
  }

  function downloadMarkdown() {
    if (!summaryData) return;
    const lines: string[] = [];
    lines.push(`# Team summaries (${from} → ${to})`);
    if (summaryData.team_themes?.length) {
      lines.push("\n## Team themes");
      summaryData.team_themes.forEach((t) => lines.push(`- ${t}`));
    }
    lines.push("\n## Individuals");
    summaryData.users.forEach((u) => {
      lines.push(`\n### ${u.name} (#${u.badge})\n`);
      lines.push(u.summary_md);
      if (u.blockers?.length) {
        lines.push(`\n**Blockers**`);
        u.blockers.forEach((b) => lines.push(`- ${b}`));
      }
      if (u.next_focus?.length) {
        lines.push(`\n**Next focus**`);
        u.next_focus.forEach((n) => lines.push(`- ${n}`));
      }
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summaries_${from}_${to}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Week filter */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <Label className="text-gray-700 text-theme-sm">Filter by Week</Label>
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
        <span className="text-gray-500 text-theme-xs">
          Showing {weekStart} → {weekEnd}
        </span>
      </div>

      {/* 🔹 AI Summarize (date range) */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
        <Label className="text-gray-700 text-theme-sm">Summarize range</Label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <span className="text-gray-500 text-theme-xs">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <Button size="sm" variant="primary" onClick={onSummarizeRange} disabled={summarizing}>
          {summarizing ? "Summarizing…" : "Summarize"}
        </Button>
        <span className="text-gray-500 text-theme-xs">(AI summary for all users in range)</span>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-64"
              >
                User
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Accomplishment (selected week)
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-32"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading && (
              <tr>
                <td className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400" colSpan={3}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading &&
              rows.map(({ user, wa }) => (
                <TableRow key={user.badge}>
                  {/* User */}
                  <TableCell className="px-5 py-4 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {`${(user.firstName || "?")[0] ?? "?"}${(user.lastName || "?")[0] ?? "?"}`}
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {String(user.position ?? "")} · #{user.badge}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Accomplishment for selected week */}
                  <TableCell className="px-5 py-4 align-top">
                    {hasContent(wa?.accomplishments) ? (
                      <div className="ql-snow">
                        <div
                          className="ql-editor max-w-none text-theme-sm text-gray-700 dark:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(wa!.accomplishments!) }}
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        (wa?.taskStatus ?? "Missing") === "Submitted"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : wa
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {wa ? wa.taskStatus ?? "Submitted" : "Missing"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-5 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={3}>
                  No users found.
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 🔹 Summary Modal */}
      {summaryOpen && summaryData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === "Escape" && setSummaryOpen(false)}
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold">AI Summary</h3>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {from} → {to}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={downloadMarkdown}>
                  Export .md
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSummaryOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {summaryData.team_themes?.length ? (
                <div>
                  <div className="text-sm font-semibold mb-1">Team themes</div>
                  <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-100">
                    {summaryData.team_themes.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-6">
                {summaryData.users.map((u) => (
                  <div key={u.badge}>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {u.name} <span className="text-gray-500">#{u.badge}</span>
                    </div>
                    {/* Render as plain text Markdown for safety (no HTML injection) */}
                    <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 mt-1">
{u.summary_md}
                    </pre>

                    {u.blockers?.length ? (
                      <div className="mt-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Blockers</div>
                        <ul className="list-disc pl-5 text-sm">
                          {u.blockers.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {u.next_focus?.length ? (
                      <div className="mt-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next focus</div>
                        <ul className="list-disc pl-5 text-sm">
                          {u.next_focus.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {sumError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                  {sumError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
