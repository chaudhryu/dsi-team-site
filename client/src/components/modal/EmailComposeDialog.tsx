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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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

  const canSend = isValidEmail(to) && subject.trim() && body.trim();

  const handleSend = async () => {
    setError(null);

    if (!isValidEmail(to)) return setError("Please enter a valid email address in To.");
    if (!subject.trim()) return setError("Subject is required.");
    if (!body.trim()) return setError("Body is required.");

    try {
      setSending(true);
      await onSend({ to: to.trim(), subject: subject.trim(), body });
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
              placeholder="name@metro.net"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
            />
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
