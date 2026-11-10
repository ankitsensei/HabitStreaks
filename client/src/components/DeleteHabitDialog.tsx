import { useEffect, useId, useState } from "react";
import { AlertIcon, TrashIcon } from "./Icons";
import type { Habit } from "../lib/api";

interface DeleteHabitDialogProps {
  habit: Habit;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteHabitDialog = ({
  habit,
  onClose,
  onConfirm,
}: DeleteHabitDialogProps) => {
  const titleId = useId();
  const descriptionId = useId();

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleting, onClose]);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't delete the habit. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full rounded-t-[26px] border border-white/80 bg-white/95 p-6 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111018]/95 sm:max-w-md sm:rounded-[26px]"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          <TrashIcon className="h-6 w-6" />
        </span>

        <h2
          id={titleId}
          className="mt-4 text-[20px] font-bold text-slate-900 dark:text-white"
        >
          Delete habit?
        </h2>
        <p
          id={descriptionId}
          className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400"
        >
          “{habit.name}” and all of its check-ins will be permanently deleted.
          This can&apos;t be undone.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:focus-visible:ring-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-[13.5px] font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-rose-500/40"
          >
            {isDeleting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Deleting…
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                Delete habit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteHabitDialog;
