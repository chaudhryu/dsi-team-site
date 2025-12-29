// src/pages/HighManagerDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";

import { Table, TableBody, TableCell, TableRow } from "../components/ui/table";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { envConfig } from "../config/envConfig";

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3005/api";

/**
 * IMPORTANT:
 * We are NOT hiding any badges on this page.
 */
const HIDDEN_BADGES = new Set<string>();

/* -------------------- HTML helpers -------------------- */
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

/* -------------------- date helpers -------------------- */
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

/** overlap check (string compare works for YYYY-MM-DD) */
function overlapsRange(startWeekDate: string, endWeekDate: string, from: string, to: string) {
  // overlap if end >= from AND start <= to
  return endWeekDate >= from && startWeekDate <= to;
}

/* -------------------- Types -------------------- */
type User = {
  badge: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  position?: string | number | null;
  role?: string | null;
  costCenter?: number | null;
};

type WA = {
  id: number;
  accomplishments: string | null;
  user: User;
  costCenter?: number;
  startWeekDate: string;
  endWeekDate: string;
  taskStatus?: string | null;
};

type PayloadUser = {
  badge: number;
  name: string;
  entries: { startWeekDate: string; endWeekDate: string; text: string }[];
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

function normalizeRole(role: unknown): string {
  return String(role ?? "").trim().toLowerCase();
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

/* -------------------- Component -------------------- */
export default function HighManagerDashboard() {
  // ✅ Date range (no week selector)
  const [from, setFrom] = useState<string>(() => ymdLocal(addDays(new Date(), -28)));
  const [to, setTo] = useState<string>(() => ymdLocal(new Date()));

  const [managerUsers, setManagerUsers] = useState<User[]>([]);

  // cache: costCenter -> WAs (for current date range)
  const [waCacheByCostCenter, setWaCacheByCostCenter] = useState<Record<string, WA[]>>({});

  // manager badge -> manager's OWN WAs in range (for display)
  const [managerWAsByBadge, setManagerWAsByBadge] = useState<Record<number, WA[]>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Summaries */
  const [summarizingKey, setSummarizingKey] = useState<string | null>(null); // "ALL" or `CC-####`
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SummarizeResponse | null>(null);
  const [sumError, setSumError] = useState<string | null>(null);

  /* -------------------- data fetch helpers -------------------- */

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

  /**
   * Tries the cost-center range endpoint.
   * If your backend expects week-aligned dates and returns 0 rows, we'll fall back elsewhere.
   */
  async function fetchWeeklyAccomplishmentsForCostCenter(cc: number): Promise<WA[]> {
    try {
      const res = await fetch(
        `${API_BASE}/weekly-accomplishments/by-cost-center-and-date-range?costCenter=${cc}&startWeekDate=${from}&endWeekDate=${to}`,
        { credentials: "include" }
      );
      const data = res.ok ? await res.json() : [];
      const arr = Array.isArray(data) ? (data as WA[]) : [];

      // extra safety: filter overlap in UI
      return arr.filter((wa) => overlapsRange(wa.startWeekDate, wa.endWeekDate, from, to));
    } catch {
      return [];
    }
  }

  async function fetchWeeklyAccomplishmentsForUser(badge: number): Promise<WA[]> {
    try {
      const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${badge}`, { credentials: "include" });
      const data = res.ok ? await res.json() : [];
      const arr = Array.isArray(data) ? (data as WA[]) : [];
      return arr.filter((wa) => overlapsRange(wa.startWeekDate, wa.endWeekDate, from, to));
    } catch {
      return [];
    }
  }

  function buildPayloadUsers(allUsers: User[], waList: WA[]): PayloadUser[] {
    // Group ALL WAs by badge (not just one!)
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
          entries,
        };
      });
  }

  /* -------------------- Load managers once -------------------- */

  useEffect(() => {
    (async () => {
      try {
        setError(null);

        console.log("[ManagerDashboard] Fetching users:", `${API_BASE}/users`);
        const raw = await fetchAllUsers();

        console.groupCollapsed(`[ManagerDashboard] /users returned ${raw.length} users`);
        raw.forEach((u) => {
          const roleRaw = u?.role;
          const roleNorm = normalizeRole(roleRaw);
          const isHidden = HIDDEN_BADGES.has(String(u?.badge));
          const isManager = roleNorm === "manager";

          console.log({
            badge: u?.badge,
            name: userDisplayName(u),
            roleRaw,
            roleNorm,
            costCenter: u?.costCenter,
            isHidden,
            isManager,
            willShow: !isHidden && isManager,
          });
        });
        console.groupEnd();

        const managers = raw.filter((u) => !HIDDEN_BADGES.has(String(u.badge))).filter(isManagerUser);

        // sort by cost center, then name
        managers.sort((a, b) => {
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

  /* -------------------- Prefetch accomplishments for current range -------------------- */

  const uniqueManagerCostCenters = useMemo(() => {
    return Array.from(
      new Set(managerUsers.map((u) => u.costCenter).filter((x): x is number => typeof x === "number"))
    ).sort((a, b) => a - b);
  }, [managerUsers]);

  async function loadRangeData() {
    if (!managerUsers.length) {
      setWaCacheByCostCenter({});
      setManagerWAsByBadge({});
      return;
    }

    // guard: if from > to, don't fetch
    if (from && to && from > to) {
      setError("Invalid date range: 'From' must be before 'To'.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) Fetch WAs per CC (best effort)
      const nextCache: Record<string, WA[]> = {};
      await Promise.all(
        uniqueManagerCostCenters.map(async (cc) => {
          const list = await fetchWeeklyAccomplishmentsForCostCenter(cc);
          nextCache[String(cc)] = list;
        })
      );
      setWaCacheByCostCenter(nextCache);

      // 2) Build manager display WAs (prefer CC cache, fallback to per-user)
      const nextManagerMap: Record<number, WA[]> = {};

      for (const m of managerUsers) {
        const cc = typeof m.costCenter === "number" ? m.costCenter : null;

        let list: WA[] = [];
        if (cc !== null) {
          const cached = nextCache[String(cc)] ?? [];
          list = cached
            .filter((wa) => wa?.user?.badge === m.badge)
            .filter((wa) => overlapsRange(wa.startWeekDate, wa.endWeekDate, from, to))
            .sort((a, b) => (a.startWeekDate < b.startWeekDate ? -1 : 1));
        }

        // fallback: if cost-center call didn’t return manager entries, fetch manager directly
        if (list.length === 0) {
          const direct = await fetchWeeklyAccomplishmentsForUser(m.badge);
          list = direct.sort((a, b) => (a.startWeekDate < b.startWeekDate ? -1 : 1));
        }

        nextManagerMap[m.badge] = list;
      }

      setManagerWAsByBadge(nextManagerMap);
    } catch (e) {
      console.error(e);
      setError("Failed to load accomplishments for the selected range.");
      setWaCacheByCostCenter({});
      setManagerWAsByBadge({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRangeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerUsers, from, to]);

  /* -------------------- Summarization -------------------- */

  async function postSummarize(scopeLabel: string, key: string, payloadUsers: PayloadUser[]) {
    try {
      setSummarizingKey(key);
      setSumError(null);

      const resp = await fetch(`${API_BASE}/ai/summarize-accomplishments`, {
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

  /**
   * ✅ Summarize ALL USERS in manager's cost center across the date range.
   * Fixes "names only" by:
   * - grouping multiple WAs per user into entries[]
   * - falling back to per-user WA fetch if CC-range endpoint returns empty
   */
  async function onSummarizeManagerCostCenter(manager: User) {
    const cc = typeof manager.costCenter === "number" ? manager.costCenter : null;
    if (cc === null) return;

    const key = `CC-${cc}`;
    const managerName = userDisplayName(manager);

    // 1) Fetch all users in CC
    const allUsers = await fetchUsersByCostCenter(cc);

    // 2) Try CC range endpoint first (cached), else fetch
    let waList = waCacheByCostCenter[String(cc)];
    if (!waList) {
      waList = await fetchWeeklyAccomplishmentsForCostCenter(cc);
    }

    // 3) If CC endpoint returned nothing but there are users,
    // fallback to per-user fetch so we still get text for arbitrary date ranges.
    if ((waList?.length ?? 0) === 0 && allUsers.length > 0) {
      const perUser = await Promise.all(
        allUsers.map(async (u) => await fetchWeeklyAccomplishmentsForUser(u.badge))
      );
      waList = perUser.flat();
    }

    const payloadUsers = buildPayloadUsers(allUsers, waList ?? []);

    await postSummarize(`Cost Center ${cc} (All Users) · requested by ${managerName}`, key, payloadUsers);
  }

  async function onSummarizeAll() {
    const key = "ALL";

    // Summarize all users across cost centers that appear on this page
    const seenBadges = new Set<number>();
    const allPayload: PayloadUser[] = [];

    for (const cc of uniqueManagerCostCenters) {
      const users = await fetchUsersByCostCenter(cc);

      let waList = waCacheByCostCenter[String(cc)];
      if (!waList) waList = await fetchWeeklyAccomplishmentsForCostCenter(cc);

      if ((waList?.length ?? 0) === 0 && users.length > 0) {
        const perUser = await Promise.all(users.map(async (u) => await fetchWeeklyAccomplishmentsForUser(u.badge)));
        waList = perUser.flat();
      }

      const payload = buildPayloadUsers(users, waList ?? []);
      for (const p of payload) {
        if (seenBadges.has(p.badge)) continue;
        seenBadges.add(p.badge);
        allPayload.push(p);
      }
    }

    await postSummarize(`All Cost Centers (All Users)`, key, allPayload);
  }

  function downloadMarkdown() {
    if (!summaryData) return;

    const lines: string[] = [];

    if (summaryData.team_themes?.length) {
      lines.push("\n## Team themes");
      summaryData.team_themes.forEach((t) => lines.push(`- ${t}`));
    }

    lines.push("\n## Individuals");
    summaryData.users.forEach((u) => {
      lines.push(`\n### ${u.name} (#${u.badge})\n`);

      const md = String(u.summary_md ?? "").trim();
      lines.push(md.length ? md : "- (No accomplishments found in this range.)");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* -------------------- Render -------------------- */

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Toolbar (date range) */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <Label className="text-gray-700 text-theme-sm">Date range</Label>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
        />

        <span className="text-gray-500 text-theme-xs">→</span>

        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
        />

        <Button size="sm" variant="primary" onClick={loadRangeData} disabled={loading}>
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
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
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
                    {/* Left: Manager name + position + cost center */}
                    <TableCell className="px-5 py-4 align-top w-[320px]">
                      <div className="font-medium text-gray-900 dark:text-white/90">{userDisplayName(mgr)}</div>

                      {mgr.position ? (
                        <div className="text-xs text-gray-500 mt-1">{String(mgr.position)}</div>
                      ) : null}

                      <div className="text-xs text-gray-500 mt-1">
                        Cost Center:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-200">{ccLabel}</span>
                      </div>
                    </TableCell>

                    {/* Middle: Manager accomplishments in range (blank if none; no dashes) */}
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
                        <div /> // blank (no "—")
                      )}
                    </TableCell>

                    {/* Right: Summarize ALL USERS for this manager's CC */}
                    <TableCell className="px-5 py-4 align-top w-[180px]">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onSummarizeManagerCostCenter(mgr)}
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

      {/* Summary Modal */}
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


              <div className="space-y-6">
                {summaryData.users.map((u) => {
                  const md = String(u.summary_md ?? "").trim();
                  return (
                    <div key={u.badge}>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {u.name} <span className="text-gray-500">#{u.badge}</span>
                      </div>

                      <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 mt-1">
                        {md.length ? md : "- (No accomplishments found in this range.)"}
                      </pre>
                    </div>
                  );
                })}
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
