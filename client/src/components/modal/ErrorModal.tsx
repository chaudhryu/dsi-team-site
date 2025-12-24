// components/ErrorModal.tsx
import * as Dialog from "@radix-ui/react-dialog";

type Props = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onCloseButtonLabel: string;
};

export function ErrorModal({ open, title, message, onClose, onCloseButtonLabel }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />

        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2
            rounded-xl bg-white p-6 shadow-xl
            dark:bg-gray-900
            focus:outline-none
          "
        >
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</Dialog.Title>

          <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</Dialog.Description>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {onCloseButtonLabel || "Close"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
