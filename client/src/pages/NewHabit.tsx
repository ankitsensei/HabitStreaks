import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  FlameIcon,
  SparkIcon,
} from "../components/Icons";
import { ApiError, addHabit, HABIT_CATEGORIES } from "../lib/api";
import type { HabitCategory } from "../lib/api";
import { clearToken, getToken, useAuth } from "../lib/auth";
import {
  CATEGORY_ICONS,
  COLOR_OPTIONS,
  ICON_OPTIONS,
  TARGET_OPTIONS,
  isLightColor,
} from "../lib/habitOptions";

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14.5px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400/70 dark:focus:ring-brand-500/15";

const labelClass =
  "block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300";

const primaryButton =
  "group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-5 py-3.5 text-[14.5px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-105 hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-brand-500/40 sm:w-auto";

const secondaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:focus-visible:ring-white/10 sm:w-auto";

const Spinner = () => (
  <span
    aria-hidden="true"
    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
  />
);

const NewHabit = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0].emoji);
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0].value);
  const [category, setCategory] =
    useState<HabitCategory>("Health & Fitness");
  const [targetPerWeek, setTargetPerWeek] = useState(3);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addHabit(token, {
        name: trimmedName,
        icon,
        color,
        category,
        targetPerWeek,
      });

      navigate("/habits", {
        replace: true,
        state: { addedHabit: result.habit.name },
      });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-svh bg-[#f6f4fb] text-slate-900 dark:bg-[#0a0910] dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f6f4fb]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0910]/85">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30">
              <FlameIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[16px] font-bold tracking-tight">
              HabitStreaks
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-brand-300/30 blur-[120px] dark:bg-brand-600/20" />
          <div className="absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-fuchsia-300/25 blur-[120px] dark:bg-fuchsia-600/15" />
        </div>

        <div className="relative mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
          <div className="animate-fade-up">
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-[11.5px] font-semibold text-brand-700 shadow-sm backdrop-blur dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200">
                <SparkIcon className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-300" />
                New habit
              </span>

              <h1 className="mt-4 text-[30px] font-extrabold tracking-tight text-slate-900 sm:text-[36px] dark:text-white">
                What do you want to build?
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
                Pick something specific, give it a weekly target, and make it
                yours. You can always add more habits later.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-[26px] border border-white/80 bg-white/85 p-6 shadow-[0_30px_70px_-40px_rgba(76,29,149,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111018]/85 sm:p-8"
            >
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-7">
                {/* Preview */}
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
                      {name.trim() || "Your new habit"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                      {category} · {targetPerWeek}{" "}
                      {targetPerWeek === 1 ? "day" : "days"} per week
                    </p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <label htmlFor="habit-name" className={labelClass}>
                      Habit name
                    </label>
                    <span className="text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
                      {name.length}/100
                    </span>
                  </div>
                  <input
                    id="habit-name"
                    name="habit-name"
                    type="text"
                    autoComplete="off"
                    maxLength={100}
                    required
                    placeholder="e.g. Read 20 pages"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputBase}
                  />
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Keep it specific — “Read 20 pages” is easier to keep than
                    “Read more”.
                  </p>
                </div>

                {/* Icon */}
                <div>
                  <span className={labelClass}>Habit icon</span>
                  <div
                    role="group"
                    aria-label="Habit icon"
                    className="mt-2 flex flex-wrap gap-2"
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
                          className={`grid h-11 w-11 place-items-center rounded-xl border text-[20px] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 dark:focus-visible:ring-brand-500/25 ${
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

                {/* Color */}
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
                          className={`grid h-9 w-9 place-items-center rounded-full shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 dark:focus-visible:ring-brand-500/25 ${
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
                            <CheckIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category */}
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
                            name="category"
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

                {/* Targets per week */}
                <fieldset>
                  <legend className={labelClass}>Targets per week</legend>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                    How many days a week do you want to do this?
                  </p>
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
                          className={`grid h-11 place-items-center rounded-xl border text-[14px] font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 dark:focus-visible:ring-brand-500/25 ${
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

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/70 pt-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/" className={secondaryButton}>
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={primaryButton}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner />
                      Adding habit…
                    </>
                  ) : (
                    <>
                      Create habit
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewHabit;
