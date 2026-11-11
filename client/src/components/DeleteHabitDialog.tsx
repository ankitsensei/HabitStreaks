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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
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
        className="w-full rounded-t-[26px] border border-white/[0.08] bg-[#2c2c2e] p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:max-w-md sm:rounded-[26px]"
      >
        <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#FF453A]/15 text-[#FF453A] ring-1 ring-[#FF453A]/25">
          <TrashIcon className="h-6 w-6" />
        </span>

        <h2
          id={titleId}
          className="mt-4 text-[20px] font-bold tracking-tight text-[#f5f5f7]"
        >
          Delete habit?
        </h2>
        <p
          id={descriptionId}
          className="mt-2 text-[13px] leading-relaxed text-[rgba(235,235,245,0.6)]"
        >
          “{habit.name}” and all of its check-ins will be permanently deleted.
          This can&apos;t be undone.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25"
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
            className="inline-flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] px-5 py-2.5 text-[13.5px] font-semibold text-[rgba(235,235,245,0.8)] transition hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF453A] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_0_20px_rgba(255,69,58,0.35)] transition hover:bg-[#FF6961] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF453A]/50 disabled:cursor-not-allowed disabled:opacity-60"
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
