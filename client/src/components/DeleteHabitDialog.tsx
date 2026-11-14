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
 className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
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
 className="w-full rounded-t-lg border border-[#313131] bg-[#141414] p-6 sm:max-w-md sm:rounded-lg"
 >
 <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#6798ff]/10 text-[#6798ff] ring-1 ring-[#313131]">
 <TrashIcon className="h-6 w-6" />
 </span>

 <h2
 id={titleId}
 className="mt-4 text-[20px] font-medium tracking-tight text-white"
 >
 Delete habit?
 </h2>
 <p
 id={descriptionId}
 className="mt-2 text-[13px] leading-relaxed text-[#a7a7a7]"
 >
 “{habit.name}” and all of its check-ins will be permanently deleted.
 This can&apos;t be undone.
 </p>

 {error && (
 <div
 role="alert"
 className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#141414] px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-white ring-1 ring-[#454545]"
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
 className="inline-flex items-center justify-center rounded-lg border border-[#454545] bg-transparent px-5 py-2.5 text-[13.5px] font-medium text-white transition hover:bg-[#1e1e1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleConfirm}
 disabled={isDeleting}
 className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13.5px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {isDeleting ? (
 <>
 <span
 aria-hidden="true"
 className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]"
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
