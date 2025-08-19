import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Label from "../components/form/Label";
import { envConfig } from "../config/envConfig";

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
  endWeekDate: string;   // YYYY-MM-DD
  taskStatus?: string | null;
};

type Row = {
  user: User;
  wa: WA | null; // accomplishment for the selected week (or null)
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
  // 1) Build dropdown weeks (current week + previous N)
  const weekOptions = useMemo(() => {
    // go back to the first week of the year (or up to 26 weeks)
    const { week } = isoWeekNumber(new Date());
    return buildWeekOptions(new Date(), Math.max(week - 1, 26), 0);
  }, []);

  // 2) Selected week (defaults to the top option = current week)
  const [weekStart, setWeekStart] = useState<string>(() => weekOptions[0]?.start ?? ymdLocal(mondayStart()));
  const [weekEnd, setWeekEnd] = useState<string>(() => weekOptions[0]?.end ?? ymdLocal(sundayEnd(mondayStart())));

  const onSelectWeek = (e: ChangeEvent<HTMLSelectElement>) => {
    const start = e.target.value;
    const opt = weekOptions.find(w => w.start === start);
    if (opt) {
      setWeekStart(opt.start);
      setWeekEnd(opt.end);
    }
  };

  // 3) Data state
  const [users, setUsers] = useState<User[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 4) Load users once, then load accomplishments for that week
  useEffect(() => {
    (async () => {
      try {
        // a) load all users
        const ures = await fetch(`${API_BASE}/users`, { credentials: "include" });
        const udata: User[] = ures.ok ? await ures.json() : [];
        // sort by last, then first
        udata.sort((a, b) => {
          const al = (a.lastName || "").toLowerCase();
          const bl = (b.lastName || "").toLowerCase();
          if (al === bl) return (a.firstName || "").localeCompare(b.firstName || "", undefined, { sensitivity: "base" });
          return al.localeCompare(bl);
        });
        setUsers(udata);
      } catch (e) {
        console.error("Failed to load users", e);
        setUsers([]);
      }
    })();
  }, []);

  // 5) Whenever users list or selected week changes, fetch each user's WA for that week
  useEffect(() => {
    if (!users.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        // Fetch each user's history in parallel, pick the record matching weekStart/weekEnd
        const perUser = await Promise.all(
          users.map(async (u) => {
            try {
              const res = await fetch(`${API_BASE}/weekly-accomplishments/user/${u.badge}`, { credentials: "include" });
              const data: WA[] = res.ok ? await res.json() : [];
              const match = data.find(d => d.startWeekDate === weekStart && d.endWeekDate === weekEnd) || null;
              return { user: u, wa: match } as Row;
            } catch {
              return { user: u, wa: null } as Row;
            }
          })
        );
        setRows(perUser);
      } catch (e) {
        console.error("Failed to load accomplishments per user", e);
        setRows(users.map(u => ({ user: u, wa: null })));
      } finally {
        setLoading(false);
      }
    })();
  }, [users, weekStart, weekEnd]);

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
              <TableRow>
                <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400" colSpan={3}>
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {!loading && rows.map(({ user, wa }) => (
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
                <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300 whitespace-pre-wrap max-w-4xl">
                  {wa?.accomplishments?.trim() || "—"}
                </TableCell>

                {/* Status */}
                <TableCell className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      (wa?.taskStatus ?? "Missing") === "Submitted"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : wa ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    {wa ? (wa.taskStatus ?? "Submitted") : "Missing"}
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={3}>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
