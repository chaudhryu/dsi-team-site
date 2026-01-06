import * as React from "react";
import { EmailComposeDialog, EmailDraft } from "./EmailComposeDialog";

type SummaryUser = {
  badge: number;
  name: string;
  summary_md: string;
  highlights?: string[];
  blockers?: string[];
  next_focus?: string[];
};

type ManagerRef = {
  badge: number;
  name: string;
};

type TeamSummary = {
  costCenter: number;
  manager: { badge: number; name: string };
  manager_achievements?: string[];
  team_summary?: string;
  team_themes?: string[];
  users: SummaryUser[];
};

type NewSummaryData = {
  teams: TeamSummary[];
  org_themes?: string[]; // optional if you later add org rollup
};

// Back-compat with your current shape
type LegacySummaryData = {
  users: SummaryUser[];
  team_themes?: string[];
};

type SummaryData = NewSummaryData | LegacySummaryData;

type Props = {
  open: boolean;
  onClose: () => void;

  from: string;
  to: string;

  summaryData: SummaryData | null;
  sumError?: string | null;

  downloadMarkdown: () => void;
  costCenter: number | string | null | undefined; // legacy single-team subject label
  Button: React.ComponentType<any>;

  // optional: wire this if you want email sending
  onSendEmail?: (draft: EmailDraft) => Promise<void>;
};

function escapeHtml(s: string) {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mdBulletsToHtml(md: string) {
  const rawLines = (md ?? "").split(/\r?\n/).map((l) => l.trim());
  const lines = rawLines.filter((l) => l.length > 0);

  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  closeList();

  if (html.length === 0) return "<p>No accomplishments reported for this period.</p>";

  return html.join("");
}

function isNewSummaryData(data: any): data is NewSummaryData {
  return !!data && Array.isArray(data.teams);
}

function normalizeToTeams(data: SummaryData, fallbackCostCenter?: number | string | null | undefined): TeamSummary[] {
  if (isNewSummaryData(data)) return data.teams ?? [];

  // Legacy -> single “team” wrapper so UI can render the same way
  const cc =
    typeof fallbackCostCenter === "number"
      ? fallbackCostCenter
      : typeof fallbackCostCenter === "string"
      ? Number(fallbackCostCenter)
      : 0;

  return [
    {
      costCenter: Number.isFinite(cc) ? (cc as number) : 0,
      manager: { badge: 0, name: "N/A" },
      team_summary: undefined,
      team_themes: data.team_themes ?? [],
      users: data.users ?? [],
    },
  ];
}

function buildDialogTitle(teams: TeamSummary[], legacyCostCenter?: number | string | null | undefined) {
  if (teams.length === 1) {
    const t = teams[0];
    return `${t.costCenter || legacyCostCenter || ""} - Team Summary`.trim();
  }
  return `Multi-Team Summary (${teams.length} teams)`;
}

function buildEmailSubject(
  teams: TeamSummary[],
  from: string,
  to: string,
  legacyCostCenter?: number | string | null | undefined
) {
  if (teams.length === 1) {
    const t = teams[0];
    const cc = t.costCenter || legacyCostCenter || "";
    return `${cc} - Team Summary (${from} → ${to})`.trim();
  }
  return `Multi-Team Summary (${from} → ${to})`;
}

export function buildEmailHtmlForQuill(
  summaryData: SummaryData,
  from: string,
  to: string,
  legacyCostCenter?: number | string | null | undefined
) {
  const parts: string[] = [];
  const teams = normalizeToTeams(summaryData, legacyCostCenter);

  parts.push(`<p><strong>Date window:</strong> ${escapeHtml(from)} → ${escapeHtml(to)}</p>`);
  parts.push(`<p><br></p>`);

  // Optional org themes (if you add this later)
  const orgThemes = (isNewSummaryData(summaryData) ? summaryData.org_themes : undefined) ?? [];
  if (orgThemes.length) {
    parts.push(`<h2>Organization Themes</h2>`);
    parts.push("<ul>");
    for (const t of orgThemes) parts.push(`<li>${escapeHtml(String(t))}</li>`);
    parts.push("</ul>");
    parts.push(`<p><br></p>`);
  }

  for (const team of teams) {
    const mgrName = team.manager?.name ?? "N/A";
    const mgrBadge = team.manager?.badge ?? 0;

    parts.push(`<h2>Cost Center ${escapeHtml(String(team.costCenter))}</h2>`);
    parts.push(`<p><strong>Manager:</strong> ${escapeHtml(mgrName)} (#${escapeHtml(String(mgrBadge))})</p>`);

    if (team.manager_achievements?.length) {
      parts.push(`<p><strong>Manager Achievements</strong></p>`);
      parts.push("<ul>");
      for (const a of team.manager_achievements) parts.push(`<li>${escapeHtml(String(a))}</li>`);
      parts.push("</ul>");
      parts.push(`<p><br></p>`);
    }

    if (team.team_summary) {
      parts.push(`<p>${escapeHtml(team.team_summary)}</p>`);
    }

    if (team.team_themes?.length) {
      parts.push(`<p><strong>Team Themes</strong></p>`);
      parts.push("<ul>");
      for (const t of team.team_themes) parts.push(`<li>${escapeHtml(String(t))}</li>`);
      parts.push("</ul>");
      parts.push(`<p><br></p>`);
    }

    const users = team.users ?? [];
    for (const u of users) {
      parts.push(`<h3>${escapeHtml(u.name)} <span>(#${escapeHtml(String(u.badge))})</span></h3>`);
      parts.push(mdBulletsToHtml(u.summary_md ?? ""));

      if (u.blockers?.length) {
        parts.push(`<p><strong>Blockers</strong></p>`);
        parts.push("<ul>");
        for (const b of u.blockers) parts.push(`<li>${escapeHtml(String(b))}</li>`);
        parts.push("</ul>");
      }

      if (u.next_focus?.length) {
        parts.push(`<p><strong>Next focus</strong></p>`);
        parts.push("<ul>");
        for (const n of u.next_focus) parts.push(`<li>${escapeHtml(String(n))}</li>`);
        parts.push("</ul>");
      }

      parts.push(`<p><br></p>`);
    }

    parts.push(`<hr />`);
    parts.push(`<p><br></p>`);
  }

  return parts.join("");
}

export function AccomplishmentSummaryDialog({
  open,
  onClose,
  from,
  to,
  summaryData,
  sumError,
  // downloadMarkdown,
  costCenter,
  Button,
  onSendEmail,
}: Props) {
  const [emailOpen, setEmailOpen] = React.useState(false);

  if (!open || !summaryData) return null;

  const teams = normalizeToTeams(summaryData, costCenter);
  const title = buildDialogTitle(teams, costCenter);

  const emailBody = buildEmailHtmlForQuill(summaryData, from, to, costCenter);

  const emailDraft: Partial<EmailDraft> = {
    to: "",
    subject: buildEmailSubject(teams, from, to, costCenter),
    body: emailBody,
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {from} → {to}
              </div>
            </div>

            <div className="flex gap-2">
              {onSendEmail && (
                <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
                  Send Email
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Optional org themes (future-proof) */}
            {isNewSummaryData(summaryData) && summaryData.org_themes?.length ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-sm font-semibold mb-2">Organization Themes</div>
                <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-100">
                  {summaryData.org_themes.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Teams */}
            <div className="space-y-8">
              {teams.map((team) => {
                const mgrName = team.manager?.name ?? "N/A";
                const mgrBadge = team.manager?.badge ?? 0;

                return (
                  <div
                    key={String(team.costCenter)}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Cost Center {team.costCenter}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Manager: {mgrName} <span className="text-gray-500">#{mgrBadge}</span>
                      </div>
                      {team.manager_achievements?.length ? (
                        <div className="mt-3">
                          <div className="text-sm font-semibold mb-1">Manager Comment</div>
                          <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-100">
                            {team.manager_achievements.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {team.team_summary ? (
                        <div className="mt-2 text-sm text-gray-800 dark:text-gray-200">{team.team_summary}</div>
                      ) : null}
                    </div>

                    {/* Team themes */}
                    {team.team_themes?.length ? (
                      <div className="mt-4">
                        <div className="text-sm font-semibold mb-1">Team Achivement</div>
                        <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-100">
                          {team.team_themes.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Users list */}
                    <div className="mt-5 space-y-4">
                      {(team.users ?? []).map((u) => (
                        <div key={u.badge} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {u.name} <span className="text-gray-500">#{u.badge}</span>
                          </div>

                          <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 mt-2">
                            {u.summary_md}
                          </pre>

                          {u.highlights?.length ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Highlights
                              </div>
                              <ul className="list-disc pl-5 text-sm">
                                {u.highlights.map((h, i) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {u.blockers?.length ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Blockers
                              </div>
                              <ul className="list-disc pl-5 text-sm">
                                {u.blockers.map((b, i) => (
                                  <li key={i}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {u.next_focus?.length ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Next focus
                              </div>
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

      {/* Email dialog (only if onSendEmail provided) */}
      {onSendEmail && (
        <EmailComposeDialog
          open={emailOpen}
          onOpenChange={setEmailOpen}
          initialDraft={emailDraft}
          onSend={onSendEmail}
          title="Send Summary Email"
          description="Edit recipients and content before sending."
        />
      )}
    </>
  );
}
