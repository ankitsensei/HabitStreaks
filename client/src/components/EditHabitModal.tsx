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
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-[14.5px] text-[#f5f5f7] outline-none transition placeholder:text-[rgba(235,235,245,0.35)] focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/25";

const labelClass =
  "block text-[12.5px] font-semibold text-[rgba(235,235,245,0.7)]";

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
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
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[26px] border border-white/[0.08] bg-[#1c1c1e] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:max-w-2xl sm:rounded-[26px]"
      >
        <div className="flex items-start gap-4 border-b border-white/[0.08] px-6 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#0A84FF] text-white shadow-[0_0_20px_rgba(10,132,255,0.4)]">
            <PencilIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[18px] font-bold tracking-tight text-[#f5f5f7]"
            >
              Edit habit
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[rgba(235,235,245,0.55)]">
              Update the name, look, category, or weekly target. Your
              completion history stays untouched.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[rgba(235,235,245,0.6)] transition hover:bg-white/[0.12] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[24px]"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                {icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-bold text-[#f5f5f7]">
                  {name.trim() || "Your habit"}
                </p>
                <p className="mt-0.5 text-[12px] text-[rgba(235,235,245,0.55)]">
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
                <span className="text-[11px] font-medium tabular-nums text-[rgba(235,235,245,0.4)]">
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
                      className={`grid h-10 w-10 place-items-center rounded-[12px] border text-[18px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 ${
                        selected
                          ? "border-[#0A84FF] bg-[#0A84FF]/15 ring-2 ring-[#0A84FF]/30"
                          : "border-white/[0.08] bg-white/[0.05] hover:-translate-y-0.5 hover:border-[#0A84FF]/40"
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
                      className={`grid h-8 w-8 place-items-center rounded-full shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 ${
                        isLightColor(option.value)
                          ? "text-black"
                          : "text-white"
                      } ${
                        selected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]"
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
                      className={`flex cursor-pointer items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5 text-[13px] font-semibold transition focus-within:ring-2 focus-within:ring-[#0A84FF]/60 ${
                        selected
                          ? "border-[#0A84FF] bg-[#0A84FF]/15 text-white ring-2 ring-[#0A84FF]/30"
                          : "border-white/[0.08] bg-white/[0.05] text-[rgba(235,235,245,0.8)] hover:border-white/[0.16] hover:bg-white/[0.08]"
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
                        <CheckIcon className="ml-auto h-4 w-4 shrink-0 text-[#409AFF]" />
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
                      className={`grid h-10 place-items-center rounded-[12px] border text-[14px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 ${
                        selected
                          ? "border-transparent bg-[#0A84FF] text-white shadow-[0_0_16px_rgba(10,132,255,0.4)]"
                          : "border-white/[0.08] bg-white/[0.05] text-[rgba(235,235,245,0.8)] hover:border-[#0A84FF]/40 hover:text-[#409AFF]"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] px-5 py-2.5 text-[13.5px] font-semibold text-[rgba(235,235,245,0.8)] transition hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_0_24px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 disabled:cursor-not-allowed disabled:opacity-60"
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
