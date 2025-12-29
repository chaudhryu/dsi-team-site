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

type SummaryData = {
  users: SummaryUser[];
  team_themes?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;

  from: string;
  to: string;

  summaryData: SummaryData | null;
  sumError?: string | null;

  downloadMarkdown: () => void;

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
    // "- something"
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    // close list if we were in bullets and hit a normal line
    closeList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  closeList();

  // If empty content, return a simple paragraph
  if (html.length === 0) return "<p>No accomplishments reported for this period.</p>";

  return html.join("");
}

export function buildEmailHtmlForQuill(summaryData: any, from: string, to: string) {
  const parts: string[] = [];

  // Title
  parts.push(`<h2>AI Summary</h2>`);
  parts.push(`<p><strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong></p>`);
  parts.push(`<p><br></p>`);

  // Team themes (top)
  if (summaryData?.team_themes?.length) {
    parts.push(`<h3>Team themes</h3>`);
    parts.push("<ul>");
    for (const t of summaryData.team_themes) {
      parts.push(`<li>${escapeHtml(String(t))}</li>`);
    }
    parts.push("</ul>");
    parts.push(`<p><br></p>`);
  }

  // Users
  const users = summaryData?.users ?? [];
  for (const u of users) {
    parts.push(`<h3>${escapeHtml(u.name)} <span>(#${escapeHtml(String(u.badge))})</span></h3>`);

    // summary_md to HTML
    parts.push(mdBulletsToHtml(u.summary_md ?? ""));

    // Optional: blockers / next_focus as bullet lists
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

  return parts.join("");
}

export function AccomplishmentSummaryDialog({
  open,
  onClose,
  from,
  to,
  summaryData,
  sumError,
  downloadMarkdown,
  Button,
  onSendEmail,
}: Props) {
  const [emailOpen, setEmailOpen] = React.useState(false);

  if (!open || !summaryData) return null;

  const emailBody = buildEmailHtmlForQuill(summaryData, from, to);

  const emailDraft: Partial<EmailDraft> = {
    to: "",
    subject: `AI Summary (${from} → ${to})`,
    // if your EmailComposeDialog uses html, you can still paste markdown/plain text here.
    // If you want nicer HTML later, we can convert markdown -> HTML.
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
            {/* Team themes at top */}
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

            {/* Users list */}
            <div className="space-y-6">
              {(summaryData.users ?? []).map((u) => (
                <div key={u.badge} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {u.name} <span className="text-gray-500">#{u.badge}</span>
                  </div>

                  {/* Render Markdown as plain text for safety */}
                  <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 mt-2">
                    {u.summary_md}
                  </pre>

                  {u.highlights?.length ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Highlights</div>
                      <ul className="list-disc pl-5 text-sm">
                        {u.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {u.blockers?.length ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Blockers</div>
                      <ul className="list-disc pl-5 text-sm">
                        {u.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {u.next_focus?.length ? (
                    <div className="mt-3">
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
