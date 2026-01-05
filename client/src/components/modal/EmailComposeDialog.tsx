import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import ReactQuillEditor from "../TextEditor/ReactQuillEditor";

export type EmailDraft = {
  to: string;
  subject: string;
  body: string; // plain text
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft: Partial<EmailDraft>;
  onSend: (draft: EmailDraft) => Promise<void>;

  title?: string;
  description?: string;
};

export function EmailComposeDialog({
  open,
  onOpenChange,
  initialDraft,
  onSend,
  title = "Compose Email",
  description = "Review and edit the email before sending.",
}: Props) {
  const [to, setTo] = React.useState(initialDraft.to ?? "");
  const [subject, setSubject] = React.useState(initialDraft.subject ?? "");
  const [body, setBody] = React.useState(initialDraft.body ?? "");

  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTo(initialDraft.to ?? "");
    setSubject(initialDraft.subject ?? "");
    setBody(initialDraft.body ?? "");
    setError(null);
    setSending(false);
  }, [open, initialDraft.to, initialDraft.subject, initialDraft.body]);

  function splitRecipients(input: string) {
    // allow comma or semicolon, ignore empty
    return input
      .split(/[;,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateRecipients(input: string) {
    const list = splitRecipients(input);
    if (list.length === 0) return { ok: false, list, invalid: [] as string[] };

    const invalid = list.filter((e) => !isValidEmail(e));
    return { ok: invalid.length === 0, list, invalid };
  }
  const isHtmlEmpty = (value: string) =>
    !value || value === "<p><br></p>" || value.replace(/<(.|\n)*?>/g, "").trim().length === 0;
  const recipientsCheck = React.useMemo(() => validateRecipients(to), [to]);
  const canSend = recipientsCheck.ok && subject.trim().length > 0 && !isHtmlEmpty(body);

  const handleSend = async () => {
    setError(null);

    const check = validateRecipients(to);
    if (!check.list.length) {
      setError("Please enter at least one recipient email in To (comma-separated).");
      return;
    }
    if (!check.ok) {
      setError(`Invalid email(s): ${check.invalid.join(", ")}`);
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (isHtmlEmpty(body)) {
      setError("Message is required.");
      return;
    }

    try {
      setSending(true);

      // Keep as comma-separated string OR send list.join(", ")
      await onSend({
        // to: check.list.join(", "),
        to: check.list.join(", "),
        subject: subject.trim(),
        body,
      });

      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">To</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="name1@metro.net, name2@metro.net"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
            />
            <p className="text-xs text-muted-foreground">Separate multiple recipients with commas (or semicolons).</p>

            {to.trim().length > 0 && !recipientsCheck.ok && (
              <p className="text-xs text-red-600">Invalid: {recipientsCheck.invalid.join(", ")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Message</label>
            {/* <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
            /> */}
            <ReactQuillEditor
              value={body}
              onChange={(value) => setBody(value)}
              className="text-sm text-gray-900 dark:text-gray-100 pb-6"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              disabled={sending}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </DialogClose>

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || sending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
