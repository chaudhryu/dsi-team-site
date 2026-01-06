/* -------------------- Types -------------------- */
export type User = {
  badge: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  position?: string | number | null;
  role?: string | null;
  costCenter?: number | null;
};

export type WA = {
  id: number;
  accomplishments: string | null;
  user: User;
  costCenter?: number;
  startWeekDate: string;
  endWeekDate: string;
  taskStatus?: string | null;
};

export type Row = {
  user: User;
  wa: WA | null; // accomplishment for the selected week (or null)
};
export type PayloadEntry = {
  startWeekDate: string;
  endWeekDate: string;
  text: string;
};
export type PayloadUser = {
  badge: number;
  name: string;
  entries: PayloadEntry[];
  role: string | "user";
  costCenter: number | 0;
};

export type UserSummary = {
  badge: number;
  name: string;
  summary_md: string;
  highlights?: string[];
  blockers?: string[];
  next_focus?: string[];
};

// export type SummarizeResponse = { users: UserSummary[]; team_themes?: string[] };
export type SummaryUser = {
  badge: number;
  name: string;
  summary_md: string;
  highlights?: string[];
  blockers?: string[];
  next_focus?: string[];
};

export type ManagerRef = {
  badge: number;
  name: string;
};

export type TeamSummary = {
  costCenter: number;
  manager: ManagerRef; // {badge, name}
  team_summary?: string;
  team_themes?: string[];
  users: SummaryUser[];
};

export type SummarizeResponse = {
  teams: TeamSummary[];
  org_themes?: string[]; // optional if you later add org rollup
};
