export type NormalizedManager = { badge: number; name: string };

export type NormalizedUser = {
  badge: number;
  name: string;
  summary_md: string;
  // Optional: keep only if present (you said ignore/remove if not needed)
  blockers?: string[];
  next_focus?: string[];
  highlights?: string[];
};

export type NormalizedTeam = {
  costCenter: number;
  manager: NormalizedManager;
  manager_achievements: string[];
  team_summary: string;
  team_themes: string[];
  users: NormalizedUser[];
};

export type NormalizedTeamsResponse = { teams: NormalizedTeam[] };
