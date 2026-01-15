// src/pages/AccomplishmentsTable.tsx
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { envConfig } from "../config/envConfig";

/* ⬇️ DOMPurify + Quill viewer CSS so stored HTML renders correctly */
import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";
import { useLogin } from "@/context/LoginContext";
import { AccomplishmentSummaryDialog } from "@/components/modal/AccomplishmentSummaryDialog";
import { sendEmail } from "@/Data/actions/MailAction";
import { User, Row, SummarizeResponse, WA } from "./types";
import DatePicker from "@/components/form/date-picker";
import { getTeamMembersByCostCenter } from "@/Data/actions/UserAction";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3000/api";

/* Hide these badges everywhere in this table */
const HIDDEN_BADGES = new Set<string>(["93467"]);

/* -------------------- Full-screen Spinner -------------------- */
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
  const loginContext = useLogin();

  /* Load users once, then per-week accomplishments */
  useEffect(() => {
    (async () => {
      try {
        const ures = await getTeamMembersByCostCenter(loginContext?.loginEmployee.costCenter, true);
        if (ures.status !== 200) {
          // Optionally parse server error message

          throw new Error(`Failed to load team (HTTP ${ures.status})`);
        }

        const raw: User[] = await ures.data;

        // ⬇️ Filter out hidden badges (e.g., 93467) BEFORE sorting/setting state
        const udata = raw.filter((u) => !HIDDEN_BADGES.has(String(u.badge)));

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

  // useEffect(() => {
  //   if (!users.length) {
  //     setRows([]);
  //     setLoading(false);
  //     return;
  //   }
  //   setLoading(true);
  //   (async () => {
  //     try {
  //       const perUser = await Promise.all(
  //         users.map(async (u) => {
  //           try {
  //             const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${u.badge}`, {
  //               credentials: "include",
  //             });
  //             const data: WA[] = res.ok ? await res.json() : [];
  //             const match =
  //               data.find((d) => d.startWeekDate === weekStart && d.endWeekDate === weekEnd) || null;
  //             return { user: u, wa: match } as Row;
  //           } catch {
  //             return { user: u, wa: null } as Row;
  //           }
  //         })
  //       );
  //       setRows(perUser);
  //     } catch (e) {
  //       console.error("Failed to load accomplishments per user", e);
  //       setRows(users.map((u) => ({ user: u, wa: null })));
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, [users, weekStart, weekEnd]);

  useEffect(() => {
    if (!users.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        // const perUser = await Promise.all(
        //   users.map(async (u) => {
        //     try {
        //       const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${u.badge}`, {
        //         credentials: "include",
        //       });
        //       const data: WA[] = res.ok ? await res.json() : [];
        //       const match =
        //         data.find((d) => d.startWeekDate === weekStart && d.endWeekDate === weekEnd) || null;
        //       return { user: u, wa: match } as Row;
        //     } catch {
        //       return { user: u, wa: null } as Row;
        //     }
        //   })
        // );
        // setRows(perUser);

        try {
          console.log(loginContext?.loginEmployee);
          console.log(loginContext);
          const res = await fetch(
            `${API_BASE}/weekly-accomplishments/by-cost-center-and-date-range?costCenter=${loginContext?.loginEmployee.costCenter}&startWeekDate=${weekStart}&endWeekDate=${weekEnd}`,
            {
              credentials: "include",
            }
          );
          const weeklyAccomplishments: WA[] = res.ok ? await res.json() : [];
          const filteredWeeklyAccomplishments =
            weeklyAccomplishments.find((d) => d.startWeekDate === weekStart && d.endWeekDate === weekEnd) || null;
          console.log(filteredWeeklyAccomplishments);

          const usersWithWeeklyAccomplishment: Row[] = users.map((user) => {
            const usersWeeklyAccomplishment: WA | undefined = weeklyAccomplishments.find(
              (wa) => wa.user.badge === user.badge
            );
            return { user: user, wa: usersWeeklyAccomplishment } as Row;
          });
          console.log(usersWithWeeklyAccomplishment);
          setRows(usersWithWeeklyAccomplishment);
        } catch {}
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
              role: u.role ? u.role : "user", // used for distinguishing managers
              costCenter: u.costCenter ?? 0,
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

    const hasTeams = Array.isArray((summaryData as any)?.teams);

    // Helper to ensure we always show something
    const asBullets = (arr: any, fallback: string) => {
      if (Array.isArray(arr) && arr.length) return arr.map((x) => String(x));
      return [fallback];
    };

    if (hasTeams) {
      const teams = (summaryData as any).teams as any[];

      for (const team of teams) {
        const costCenter = team?.costCenter ?? "N/A";
        const mgrName = team?.manager?.name ?? "N/A";
        const mgrBadge = team?.manager?.badge ?? 0;

        lines.push(`\n## Cost Center ${costCenter}`);
        lines.push(`**Manager:** ${mgrName} (#${mgrBadge})`);

        // Manager achievements (always show)
        lines.push(`\n### Manager achievements`);
        asBullets(team?.manager_achievements, "No comment").forEach((a) => lines.push(`- ${a}`));

        // Team summary (always show)
        const teamSummary = String(team?.team_summary ?? "").trim() || "No accomplishments reported for this period.";
        lines.push(`\n### Team summary`);
        lines.push(teamSummary);

        // Team themes (always show)
        lines.push(`\n### Team themes`);
        asBullets(team?.team_themes, "No accomplishments reported for this period.").forEach((t) =>
          lines.push(`- ${t}`)
        );

        // Individuals
        lines.push(`\n### Individuals`);
        const users = Array.isArray(team?.users) ? team.users : [];

        if (users.length === 0) {
          lines.push(`- (No individuals with accomplishments found in this range.)`);
        } else {
          for (const u of users) {
            lines.push(`\n#### ${u?.name ?? "Unknown"} (#${u?.badge ?? "?"})\n`);
            const md = String(u?.summary_md ?? "").trim();
            lines.push(md.length ? md : "- (No accomplishments found in this range.)");

            if (Array.isArray(u?.blockers) && u.blockers.length) {
              lines.push(`\n**Blockers**`);
              u.blockers.forEach((b: any) => lines.push(`- ${String(b)}`));
            }

            if (Array.isArray(u?.next_focus) && u.next_focus.length) {
              lines.push(`\n**Next focus**`);
              u.next_focus.forEach((n: any) => lines.push(`- ${String(n)}`));
            }
          }
        }

        lines.push(`\n---`);
      }
    } else {
      // Legacy 1-team shape (your old prompt response)
      const legacy = summaryData as any;

      if (Array.isArray(legacy?.team_themes) && legacy.team_themes.length) {
        lines.push(`\n## Team themes`);
        legacy.team_themes.forEach((t: any) => lines.push(`- ${String(t)}`));
      } else {
        lines.push(`\n## Team themes`);
        lines.push(`- No accomplishments reported for this period.`);
      }

      lines.push(`\n## Individuals`);
      (legacy.users ?? []).forEach((u: any) => {
        lines.push(`\n### ${u?.name ?? "Unknown"} (#${u?.badge ?? "?"})\n`);
        const md = String(u?.summary_md ?? "").trim();
        lines.push(md.length ? md : "- (No accomplishments found in this range.)");

        if (Array.isArray(u?.blockers) && u.blockers.length) {
          lines.push(`\n**Blockers**`);
          u.blockers.forEach((b: any) => lines.push(`- ${String(b)}`));
        }

        if (Array.isArray(u?.next_focus) && u.next_focus.length) {
          lines.push(`\n**Next focus**`);
          u.next_focus.forEach((n: any) => lines.push(`- ${String(n)}`));
        }
      });
    }

    const blob = new Blob([lines.join("\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summaries_${from}_${to}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
        {/* <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        /> */}
        <DatePicker
          id="date-pickerFrom"
          placeholder="Select a date"
          value={from ? from : undefined}
          // onChange={(dates, currentDateString) => {
          //   // Handle your logic
          //   console.log({ dates, currentDateString });
          //   if (dates?.length) setFrom(ymdLocal(dates[0]));
          // }}
          onChange={(dates, currentDateString) => {
            debugger;
            if (dates?.length) setFrom(currentDateString);
          }}
          mode="single"
        />
        <span className="text-gray-500 text-theme-xs">→</span>
        {/* <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        /> */}{" "}
        <DatePicker
          id="date-pickerTo"
          placeholder="Select a date"
          value={to ? to : undefined}
          // onChange={(dates, currentDateString) => {
          //   // Handle your logic
          //   console.log({ dates, currentDateString });
          //   if (dates?.length) setFrom(ymdLocal(dates[0]));
          // }}
          onChange={(dates, currentDateString) => {
            debugger;
            if (dates?.length) setTo(currentDateString);
          }}
          mode="single"
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
                Team Member
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
              rows
                .filter(({ user }) => !HIDDEN_BADGES.has(String(user.badge))) // extra guard
                .map(({ user, wa }) => (
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

            {!loading && rows.filter(({ user }) => !HIDDEN_BADGES.has(String(user.badge))).length === 0 && (
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

      <AccomplishmentSummaryDialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        from={from}
        to={to}
        costCenter={null}
        summaryData={summaryData}
        sumError={sumError}
        downloadMarkdown={downloadMarkdown}
        Button={Button}
        onSendEmail={async (draft) => {
          const response = await sendEmail({
            to: draft.to.split(/[;,]/).map((s) => s.trim()),
            subject: draft.subject,
            body: draft.body,
          });

          if (!(response.status === 200 || response.status === 201)) {
            let msg = "Failed to send email.";

            throw new Error(msg);
          }
        }}
      />
      {/* 🔄 Full-screen spinner while loading */}
      {loading && <FullscreenSpinner label="Loading team accomplishments…" />}
    </div>
  );
}
