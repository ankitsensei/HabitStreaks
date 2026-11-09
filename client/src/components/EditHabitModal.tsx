import {
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { AlertIcon, CheckIcon, PencilIcon } from "./Icons";
import { HABIT_CATEGORIES } from "../lib/api";
import type { Habit, HabitCategory, NewHabitInput } from "../lib/api";
import {
  CATEGORY_ICONS,
  COLOR_OPTIONS,
  ICON_OPTIONS,
  TARGET_OPTIONS,
  isLightColor,
} from "../lib/habitOptions";

interface EditHabitModalProps {
  habit: Habit;
  onClose: () => void;
  onSave: (input: NewHabitInput) => Promise<void>;
}

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14.5px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400/70 dark:focus:ring-brand-500/15";

const labelClass =
  "block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300";

const EditHabitModal = ({ habit, onClose, onSave }: EditHabitModalProps) => {
  const titleId = useId();
  const categoryGroup = useId();

  const [name, setName] = useState(habit.name);
  const [icon, setIcon] = useState(habit.icon);
  const [color, setColor] = useState(habit.color);
  const [category, setCategory] = useState<HabitCategory>(habit.category);
  const [targetPerWeek, setTargetPerWeek] = useState(habit.target_per_week);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a habit name.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Habit name must be 100 characters or fewer.");
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: trimmedName,
        icon,
        color,
        category,
        targetPerWeek,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't update the habit. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[26px] border border-white/80 bg-white/95 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111018]/95 sm:max-w-2xl sm:rounded-[26px]"
      >
        <div className="flex items-start gap-4 border-b border-slate-200/70 px-6 py-5 dark:border-white/10">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-lg shadow-brand-500/25">
            <PencilIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[18px] font-bold text-slate-900 dark:text-white"
            >
              Edit habit
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Update the name, look, category, or weekly target. Your
              completion history stays untouched.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[24px]"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                {icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-bold text-slate-900 dark:text-white">
                  {name.trim() || "Your habit"}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                  {category} · {targetPerWeek}{" "}
                  {targetPerWeek === 1 ? "day" : "days"} per week
                </p>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <label htmlFor="edit-habit-name" className={labelClass}>
                  Habit name
                </label>
                <span className="text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
                  {name.length}/100
                </span>
              </div>
              <input
                id="edit-habit-name"
                name="habit-name"
                type="text"
                autoComplete="off"
                maxLength={100}
                required
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <span className={labelClass}>Habit icon</span>
              <div
                role="group"
                aria-label="Habit icon"
                className="mt-2 flex flex-wrap gap-1.5"
              >
                {ICON_OPTIONS.map((option) => {
                  const selected = icon === option.emoji;

                  return (
                    <button
                      key={option.emoji}
                      type="button"
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={selected}
                      onClick={() => setIcon(option.emoji)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border text-[18px] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 dark:focus-visible:ring-brand-500/25 ${
                        selected
                          ? "border-brand-400 bg-brand-50 shadow-sm ring-2 ring-brand-200 dark:border-brand-400/60 dark:bg-brand-500/15 dark:ring-brand-500/25"
                          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-brand-400/30"
                      }`}
                    >
                      <span aria-hidden="true">{option.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className={labelClass}>Habit color</span>
              <div
                role="group"
                aria-label="Habit color"
                className="mt-2 flex flex-wrap gap-2.5"
              >
                {COLOR_OPTIONS.map((option) => {
                  const selected = color === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={option.name}
                      aria-label={option.name}
                      aria-pressed={selected}
                      onClick={() => setColor(option.value)}
                      className={`grid h-8 w-8 place-items-center rounded-full shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 dark:focus-visible:ring-brand-500/25 ${
                        isLightColor(option.value)
                          ? "text-slate-900"
                          : "text-white"
                      } ${
                        selected
                          ? "ring-2 ring-slate-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-[#111018]"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: option.value }}
                    >
                      {selected && (
                        <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <fieldset>
              <legend className={labelClass}>Category</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {HABIT_CATEGORIES.map((option) => {
                  const selected = category === option;

                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold transition focus-within:ring-4 focus-within:ring-brand-200 dark:focus-within:ring-brand-500/25 ${
                        selected
                          ? "border-brand-400 bg-brand-50 text-brand-800 shadow-sm ring-2 ring-brand-200 dark:border-brand-400/60 dark:bg-brand-500/15 dark:text-brand-100 dark:ring-brand-500/25"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={categoryGroup}
                        value={option}
                        checked={selected}
                        onChange={() => setCategory(option)}
                        className="sr-only"
                      />
                      <span aria-hidden="true" className="text-[15px]">
                        {CATEGORY_ICONS[option]}
                      </span>
                      <span>{option}</span>
                      {selected && (
                        <CheckIcon className="ml-auto h-4 w-4 shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className={labelClass}>Targets per week</legend>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {TARGET_OPTIONS.map((value) => {
                  const selected = targetPerWeek === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} ${
                        value === 1 ? "day" : "days"
                      } per week`}
                      aria-pressed={selected}
                      onClick={() => setTargetPerWeek(value)}
                      className={`grid h-10 place-items-center rounded-xl border text-[14px] font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 dark:focus-visible:ring-brand-500/25 ${
                        selected
                          ? "border-transparent bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white shadow-md shadow-brand-600/25"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/30 dark:hover:text-brand-200"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:focus-visible:ring-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-5 py-3 text-[13.5px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-105 hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-brand-500/40"
            >
              {isSaving ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHabitModal;
