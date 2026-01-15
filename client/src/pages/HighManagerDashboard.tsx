// src/pages/HighManagerDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";

import { Table, TableBody, TableCell, TableRow } from "../components/ui/table";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { envConfig } from "../config/envConfig";

import { AccomplishmentSummaryDialog } from "@/components/modal/AccomplishmentSummaryDialog";
import { sendEmail } from "@/Data/actions/MailAction";
import { User, WA, SummarizeResponse, PayloadUser } from "./types";
import DatePicker from "@/components/form/date-picker";
import { startOfWeek, endOfWeek } from "./helpers";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3005/api";
const HIDDEN_BADGES = new Set<string>();

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

function overlapsRange(startWeekDate: string, endWeekDate: string, from: string, to: string) {
  return endWeekDate >= from && startWeekDate <= to;
}

function normalizeRole(role: unknown): string {
  return String(role ?? "")
    .trim()
    .toLowerCase();
}

function isManagerUser(u: User): boolean {
  return normalizeRole(u.role) === "manager";
}

function costCenterKey(u: User): string {
  return typeof u.costCenter === "number" ? String(u.costCenter) : "Unknown";
}

function userDisplayName(u: User): string {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || `#${u.badge}`;
}

function sortUsersByName(list: User[]): User[] {
  return [...list].sort((a, b) => {
    const al = (a.lastName || "").toLowerCase();
    const bl = (b.lastName || "").toLowerCase();
    if (al !== bl) return al.localeCompare(bl);
    return (a.firstName || "").localeCompare(b.firstName || "", undefined, { sensitivity: "base" });
  });
}

type WeekOpt = { start: string; end: string; label: string };

function buildWeekOptions(center = new Date(), pastWeeks = 52): WeekOpt[] {
  const currentMon = startOfWeek(center, 1);
  const opts: WeekOpt[] = [];
  for (let i = 0; i <= pastWeeks; i++) {
    const start = addDays(currentMon, -7 * i);
    const end = endOfWeek(start, 1);
    const startYmd = ymdLocal(start);
    const endYmd = ymdLocal(end);
    opts.push({ start: startYmd, end: endYmd, label: `${startYmd} → ${endYmd}` });
  }
  return opts;
}

export default function HighManagerDashboard() {
  const [from, setFrom] = useState<string>(() => ymdLocal(startOfWeek(new Date(), 1)));
  const [to, setTo] = useState<string>(() => ymdLocal(endOfWeek(new Date(), 1)));

  const [managerUsers, setManagerUsers] = useState<User[]>([]);
  const [selectedMgr, setSelectedMgr] = useState<User | null>(null);

  const [waCacheByCostCenter, setWaCacheByCostCenter] = useState<Record<string, WA[]>>({});
  const [usersByCostCenter, setUsersByCostCenter] = useState<Record<string, User[]>>({});
  const [managerWAsByBadge, setManagerWAsByBadge] = useState<Record<number, WA[]>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summarizingKey, setSummarizingKey] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SummarizeResponse | null>(null);
  const [sumError, setSumError] = useState<string | null>(null);

  const peopleWeekOptions = useMemo(() => buildWeekOptions(new Date(), 52), []);
  const [peopleWeekStart, setPeopleWeekStart] = useState<string>(() => ymdLocal(startOfWeek(new Date(), 1)));
  const [peopleWeekEnd, setPeopleWeekEnd] = useState<string>(() => ymdLocal(endOfWeek(new Date(), 1)));

  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [peopleWaCacheByCostCenter, setPeopleWaCacheByCostCenter] = useState<Record<string, WA[]>>({});

  async function fetchAllUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`, { credentials: "include" });
    const data = res.ok ? await res.json() : [];
    return Array.isArray(data) ? (data as User[]) : [];
  }

  async function fetchUsersByCostCenter(cc: number): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/users/by-cost-center?costCenter=${cc}`, { credentials: "include" });
      const data = res.ok ? await res.json() : [];
      return Array.isArray(data) ? (data as User[]) : [];
    } catch {
      return [];
    }
  }

  async function fetchWeeklyAccomplishmentsForCostCenter(cc: number, rangeFrom: string, rangeTo: string): Promise<WA[]> {
    try {
      const res = await fetch(
        `${API_BASE}/weekly-accomplishments/by-cost-center-and-date-range?costCenter=${cc}&startWeekDate=${rangeFrom}&endWeekDate=${rangeTo}`,
        { credentials: "include" }
      );
      const data = res.ok ? await res.json() : [];
      const arr = Array.isArray(data) ? (data as WA[]) : [];
      return arr.filter((wa) => overlapsRange(wa.startWeekDate, wa.endWeekDate, rangeFrom, rangeTo));
    } catch {
      return [];
    }
  }

  async function fetchWeeklyAccomplishmentsForUser(badge: number, rangeFrom: string, rangeTo: string): Promise<WA[]> {
    try {
      const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, { credentials: "include" });
      const data = res.ok ? await res.json() : [];
      const arr = Array.isArray(data) ? (data as WA[]) : [];
      return arr.filter((wa) => overlapsRange(wa.startWeekDate, wa.endWeekDate, rangeFrom, rangeTo));
    } catch {
      return [];
    }
  }

  function buildPayloadUsers(allUsers: User[], waList: WA[]): PayloadUser[] {
    const waByBadge = new Map<number, WA[]>();

    for (const wa of waList) {
      const badge = wa?.user?.badge;
      if (typeof badge !== "number") continue;
      const prev = waByBadge.get(badge) ?? [];
      prev.push(wa);
      waByBadge.set(badge, prev);
    }

    return allUsers
      .filter((u) => !HIDDEN_BADGES.has(String(u.badge)))
      .map((u) => {
        const list = (waByBadge.get(u.badge) ?? [])
          .filter((wa) => overlapsRange(wa.startWeekDate, wa.endWeekDate, from, to))
          .sort((a, b) => (a.startWeekDate < b.startWeekDate ? -1 : 1));

        const entries = list
          .filter((wa) => hasContent(wa.accomplishments))
          .map((wa) => ({
            startWeekDate: wa.startWeekDate,
            endWeekDate: wa.endWeekDate,
            text: plainTextFromHtml(wa.accomplishments || ""),
          }))
          .filter((e) => e.text.length > 0);

        return {
          badge: u.badge,
          name: userDisplayName(u),
          role: u.role ? u.role : "user",
          costCenter: u.costCenter ?? 0,
          entries,
        };
      });
  }

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const raw = await fetchAllUsers();

        const managers = raw
          .filter((u) => !HIDDEN_BADGES.has(String(u.badge)))
          .filter(isManagerUser)
          .sort((a, b) => {
            const acc = a.costCenter ?? Number.MAX_SAFE_INTEGER;
            const bcc = b.costCenter ?? Number.MAX_SAFE_INTEGER;
            if (acc !== bcc) return acc - bcc;

            const al = (a.lastName || "").toLowerCase();
            const bl = (b.lastName || "").toLowerCase();
            if (al !== bl) return al.localeCompare(bl);
            return (a.firstName || "").localeCompare(b.firstName || "", undefined, { sensitivity: "base" });
          });

        setManagerUsers(managers);
      } catch (e) {
        console.error(e);
        setError("Failed to load manager users.");
        setManagerUsers([]);
      }
    })();
  }, []);

  const uniqueManagerCostCenters = useMemo(() => {
    return Array.from(
      new Set(managerUsers.map((u) => u.costCenter).filter((x): x is number => typeof x === "number"))
    ).sort((a, b) => a - b);
  }, [managerUsers]);

  async function loadRangeData(rangeFrom = from, rangeTo = to) {
    if (!managerUsers.length) {
      setWaCacheByCostCenter({});
      setUsersByCostCenter({});
      setManagerWAsByBadge({});
      return;
    }

    if (rangeFrom && rangeTo && rangeFrom > rangeTo) {
      setError("Invalid date range: 'From' must be before 'To'.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextCache: Record<string, WA[]> = {};
      const nextUsersByCC: Record<string, User[]> = {};

      await Promise.all(
        uniqueManagerCostCenters.map(async (cc) => {
          const [waList, users] = await Promise.all([
            fetchWeeklyAccomplishmentsForCostCenter(cc, rangeFrom, rangeTo),
            fetchUsersByCostCenter(cc),
          ]);

          nextCache[String(cc)] = waList;
          nextUsersByCC[String(cc)] = sortUsersByName(users.filter((u) => !HIDDEN_BADGES.has(String(u.badge))));
        })
      );

      setWaCacheByCostCenter(nextCache);
      setUsersByCostCenter(nextUsersByCC);

      const nextManagerMap: Record<number, WA[]> = {};

      for (const m of managerUsers) {
        const cc = typeof m.costCenter === "number" ? m.costCenter : null;

        let list: WA[] = [];
        if (cc !== null) {
          const cached = nextCache[String(cc)] ?? [];
          list = cached
            .filter((wa) => wa?.user?.badge === m.badge)
            .filter((wa) => overlapsRange(wa.startWeekDate, wa.endWeekDate, rangeFrom, rangeTo))
            .sort((a, b) => (a.startWeekDate < b.startWeekDate ? -1 : 1));
        }

        if (list.length === 0) {
          const direct = await fetchWeeklyAccomplishmentsForUser(m.badge, rangeFrom, rangeTo);
          list = direct.sort((a, b) => (a.startWeekDate < b.startWeekDate ? -1 : 1));
        }

        nextManagerMap[m.badge] = list;
      }

      setManagerWAsByBadge(nextManagerMap);
    } catch (e) {
      console.error(e);
      setError("Failed to load accomplishments for the selected range.");
      setWaCacheByCostCenter({});
      setUsersByCostCenter({});
      setManagerWAsByBadge({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRangeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerUsers, from, to]);

  async function loadPeopleWeekData(rangeFrom = peopleWeekStart, rangeTo = peopleWeekEnd) {
    if (!uniqueManagerCostCenters.length) {
      setPeopleWaCacheByCostCenter({});
      return;
    }

    setPeopleLoading(true);
    setPeopleError(null);

    try {
      const next: Record<string, WA[]> = {};
      await Promise.all(
        uniqueManagerCostCenters.map(async (cc) => {
          const list = await fetchWeeklyAccomplishmentsForCostCenter(cc, rangeFrom, rangeTo);
          next[String(cc)] = list;
        })
      );
      setPeopleWaCacheByCostCenter(next);
    } catch (e) {
      console.error(e);
      setPeopleError("Failed to load cost center accomplishments for the selected week.");
      setPeopleWaCacheByCostCenter({});
    } finally {
      setPeopleLoading(false);
    }
  }

  useEffect(() => {
    loadPeopleWeekData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueManagerCostCenters, peopleWeekStart, peopleWeekEnd]);

  async function postSummarize(key: string, payloadUsers: PayloadUser[]) {
    try {
      if (from && to && from > to) {
        setSumError("Invalid date range: 'From' must be before 'To'.");
        return;
      }

      setSummarizingKey(key);
      setSumError(null);

      const resp = await fetch(`${API_BASE}/ai/summarize-accomplishments-teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          from,
          to,
          users: payloadUsers,
          includeTeamSummary: false,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      const json = (await resp.json()) as SummarizeResponse;
      setSummaryData(json);
      setSummaryOpen(true);
    } catch (e) {
      console.error(e);
      setSumError("Summarization failed. Try again or reduce the scope.");
    } finally {
      setSummarizingKey(null);
    }
  }

  async function onSummarizeManagerCostCenter(manager: User) {
    const cc = typeof manager.costCenter === "number" ? manager.costCenter : null;
    if (cc === null) return;

    const key = `CC-${cc}`;

    const allUsers = await fetchUsersByCostCenter(cc);

    let waList = waCacheByCostCenter[String(cc)];
    if (!waList) waList = await fetchWeeklyAccomplishmentsForCostCenter(cc, from, to);

    if ((waList?.length ?? 0) === 0 && allUsers.length > 0) {
      const perUser = await Promise.all(
        allUsers.map(async (u) => await fetchWeeklyAccomplishmentsForUser(u.badge, from, to))
      );
      waList = perUser.flat();
    }

    const payloadUsers = buildPayloadUsers(allUsers, waList ?? []);
    await postSummarize(key, payloadUsers);
  }

  async function onSummarizeAll() {
    setSelectedMgr(null);

    const key = "ALL";
    const seenBadges = new Set<number>();
    const allPayload: PayloadUser[] = [];

    for (const cc of uniqueManagerCostCenters) {
      const users = await fetchUsersByCostCenter(cc);

      let waList = waCacheByCostCenter[String(cc)];
      if (!waList) waList = await fetchWeeklyAccomplishmentsForCostCenter(cc, from, to);

      if ((waList?.length ?? 0) === 0 && users.length > 0) {
        const perUser = await Promise.all(
          users.map(async (u) => await fetchWeeklyAccomplishmentsForUser(u.badge, from, to))
        );
        waList = perUser.flat();
      }

      const payload = buildPayloadUsers(users, waList ?? []);
      for (const p of payload) {
        if (seenBadges.has(p.badge)) continue;
        seenBadges.add(p.badge);
        allPayload.push(p);
      }
    }

    await postSummarize(key, allPayload);
  }

  function downloadMarkdown() {
    if (!summaryData) return;

    const isNewShape = typeof (summaryData as any)?.teams !== "undefined" && Array.isArray((summaryData as any).teams);
    const lines: string[] = [];

    lines.push(`# AI Summary (${from} → ${to})`);
    lines.push("");

    if (isNewShape) {
      const teams = (summaryData as any).teams as any[];
      teams.forEach((team) => {
        const costCenter = team?.costCenter ?? "N/A";
        const managerName = team?.manager?.name ?? "N/A";
        const managerBadge = team?.manager?.badge ?? 0;

        lines.push(`## Cost Center ${costCenter}`);
        lines.push(`**Manager:** ${managerName} (#${managerBadge})`);
        lines.push("");

        const teamSummary = String(team?.team_summary ?? "").trim();
        if (teamSummary) {
          lines.push(teamSummary);
          lines.push("");
        }

        const users = Array.isArray(team?.users) ? team.users : [];
        users.forEach((u: any) => {
          lines.push(`### ${u?.name ?? "Unknown"} (#${u?.badge ?? "?"})`);
          lines.push("");
          const md = String(u?.summary_md ?? "").trim();
          lines.push(md.length ? md : "- (No accomplishments found in this range.)");
          lines.push("");
        });

        lines.push("---");
        lines.push("");
      });
    } else {
      const legacy = summaryData as any;
      (legacy.users ?? []).forEach((u: any) => {
        lines.push(`## ${u?.name ?? "Unknown"} (#${u?.badge ?? "?"})`);
        lines.push("");
        const md = String(u?.summary_md ?? "").trim();
        lines.push(md.length ? md : "- (No accomplishments found in this range.)");
        lines.push("");
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_summary_${from}_${to}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const peopleSections = useMemo(() => {
    return uniqueManagerCostCenters.map((cc) => {
      const ccKey = String(cc);
      const users = usersByCostCenter[ccKey] ?? [];
      const waList = peopleWaCacheByCostCenter[ccKey] ?? [];

      const waByBadge = new Map<number, WA[]>();
      for (const wa of waList) {
        const badge = wa?.user?.badge;
        if (typeof badge !== "number") continue;
        const prev = waByBadge.get(badge) ?? [];
        prev.push(wa);
        waByBadge.set(badge, prev);
      }

      const rows = users.map((u) => {
        const list = (waByBadge.get(u.badge) ?? []).sort((a, b) => (a.startWeekDate < b.startWeekDate ? 1 : -1));
        const exact = list.find((wa) => wa.startWeekDate === peopleWeekStart && wa.endWeekDate === peopleWeekEnd) ?? null;
        return { user: u, wa: exact ?? null };
      });

      return { costCenter: cc, rows };
    });
  }, [uniqueManagerCostCenters, usersByCostCenter, peopleWaCacheByCostCenter, peopleWeekStart, peopleWeekEnd]);

  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-2xl border-2 border-gray-400 bg-white shadow-md dark:border-white/[0.18] dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b-2 border-gray-300 dark:border-white/[0.14]">
          <Label className="text-gray-700 text-theme-sm">Date range</Label>

          <DatePicker
            id="date-pickerFrom"
            placeholder="Select a date"
            value={from ? from : undefined}
            onChange={(dates, currentDateString) => {
              if (dates?.length) setFrom(currentDateString);
            }}
            mode="single"
          />

          <span className="text-gray-500 text-theme-xs">→</span>

          <DatePicker
            id="date-pickerTo"
            placeholder="Select a date"
            value={to ? to : undefined}
            onChange={(dates, currentDateString) => {
              if (dates?.length) setTo(currentDateString);
            }}
            mode="single"
          />

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const now = new Date();
              const nextFrom = ymdLocal(startOfWeek(now, 1));
              const nextTo = ymdLocal(endOfWeek(now, 1));

              if (nextFrom === from && nextTo === to) {
                loadRangeData(nextFrom, nextTo);
                return;
              }

              setFrom(nextFrom);
              setTo(nextTo);
            }}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onSummarizeAll}
            disabled={loading || summarizingKey === "ALL" || managerUsers.length === 0}
          >
            {summarizingKey === "ALL" ? "Summarizing…" : "Summarize All"}
          </Button>

          {error && <span className="text-sm text-red-600 dark:text-red-300">{error}</span>}
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableBody className="divide-y-2 divide-gray-200 dark:divide-white/[0.14]">
              {loading && (
                <tr>
                  <td className="px-5 py-6 text-gray-500 text-theme-sm dark:text-gray-400" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && managerUsers.length === 0 && (
                <tr>
                  <td className="px-5 py-10 text-center text-gray-500 dark:text-gray-400" colSpan={3}>
                    No managers found.
                  </td>
                </tr>
              )}

              {!loading &&
                managerUsers.map((mgr) => {
                  const ccLabel = costCenterKey(mgr);
                  const ccNumber = typeof mgr.costCenter === "number" ? mgr.costCenter : null;
                  const key = ccNumber === null ? "CC-unknown" : `CC-${ccNumber}`;

                  const mgrWAs = managerWAsByBadge[mgr.badge] ?? [];

                  return (
                    <TableRow key={mgr.badge}>
                      <TableCell className="px-5 py-4 align-top w-[320px]">
                        <div className="font-medium text-gray-900 dark:text-white/90">{userDisplayName(mgr)}</div>
                        {mgr.position ? <div className="text-xs text-gray-500 mt-1">{String(mgr.position)}</div> : null}
                        <div className="text-xs text-gray-500 mt-1">
                          Cost Center: <span className="font-medium text-gray-700 dark:text-gray-200">{ccLabel}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 align-top">
                        {mgrWAs.length > 0 ? (
                          <div className="space-y-4">
                            {mgrWAs.map((wa) => (
                              <div key={wa.id}>
                                <div className="text-[11px] text-gray-500 mb-1">
                                  {wa.startWeekDate} → {wa.endWeekDate}
                                </div>

                                {hasContent(wa.accomplishments) ? (
                                  <div className="ql-snow">
                                    <div
                                      className="ql-editor max-w-none text-theme-sm text-gray-700 dark:text-gray-300"
                                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(wa.accomplishments!) }}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div />
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 align-top w-[180px]">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedMgr(mgr);
                              onSummarizeManagerCostCenter(mgr);
                            }}
                            disabled={loading || ccNumber === null || summarizingKey === key}
                          >
                            {summarizingKey === key ? "Summarizing…" : "Summarize"}
                          </Button>
                        </div>

                        {ccNumber === null ? (
                          <div className="mt-2 text-xs text-gray-400 text-right">No cost center on user</div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-gray-400 bg-white shadow-md dark:border-white/[0.18] dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-end justify-between gap-3 p-4 border-b-2 border-gray-300 dark:border-white/[0.14]">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Users by Cost Center</div>
            <div className="text-xs text-gray-500">Week filter below does not change summaries above</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Week</span>
            <select
              value={peopleWeekStart}
              onChange={(e) => {
                const start = e.target.value;
                const opt = peopleWeekOptions.find((w) => w.start === start);
                if (!opt) return;
                setPeopleWeekStart(opt.start);
                setPeopleWeekEnd(opt.end);
              }}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {peopleWeekOptions.map((w) => (
                <option key={w.start} value={w.start}>
                  {w.label}
                </option>
              ))}
            </select>

            <span className="text-xs text-gray-500">
              Showing {peopleWeekStart} → {peopleWeekEnd}
            </span>

            {peopleLoading ? <span className="text-xs text-gray-500">Loading…</span> : null}
            {peopleError ? <span className="text-xs text-red-600 dark:text-red-300">{peopleError}</span> : null}
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-10">
            {peopleSections.map((section) => (
              <div
                key={section.costCenter}
                className="rounded-2xl border-2 border-gray-400 bg-white shadow-md overflow-hidden dark:border-white/[0.18] dark:bg-white/[0.02]"
              >
                <div className="px-5 py-4 bg-gray-50 border-b-2 border-gray-300 dark:bg-gray-800/40 dark:border-white/[0.14]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Cost Center {section.costCenter}
                    </div>
                    <div className="text-xs text-gray-500">{section.rows.length} users</div>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    Week: {peopleWeekStart} → {peopleWeekEnd}
                  </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                  <table className="min-w-[900px] w-full text-left text-sm">
                    <thead className="bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border-b-2 border-gray-200 dark:border-white/10">
                      <tr>
                        <th className="px-5 py-3 font-medium w-72">User</th>
                        <th className="px-5 py-3 font-medium">Accomplishment</th>
                        <th className="px-5 py-3 font-medium w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-200 dark:divide-white/10">
                      {section.rows.map(({ user, wa }) => {
                        const submitted = !!wa && hasContent(wa.accomplishments);
                        return (
                          <tr key={user.badge} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                            <td className="px-5 py-4">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{userDisplayName(user)}</div>
                              <div className="text-xs text-gray-500">
                                #{user.badge}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-gray-800 dark:text-gray-200 align-top">
                              {submitted ? (
                                <div className="ql-snow">
                                  <div
                                    className="ql-editor max-w-none text-theme-sm text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(wa!.accomplishments!) }}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  submitted
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                }`}
                              >
                                {submitted ? "Submitted" : "Missing"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {!peopleLoading && section.rows.length === 0 && (
                        <tr>
                          <td className="px-5 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={3}>
                            No users found for this cost center.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AccomplishmentSummaryDialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        from={from}
        to={to}
        costCenter={summarizingKey === "ALL" ? "All Cost Centers" : selectedMgr ? selectedMgr.costCenter : ""}
        summaryData={summaryData as any}
        sumError={sumError}
        downloadMarkdown={downloadMarkdown}
        Button={Button}
        onSendEmail={async (draft: any) => {
          const response = await sendEmail({
            to: draft.to.split(/[;,]/).map((s: string) => s.trim()),
            subject: draft.subject,
            body: draft.body,
          });
          if (!(response.status === 200 || response.status === 201)) {
            throw new Error("Failed to send email.");
          }
        }}
      />
    </div>
  );
}
