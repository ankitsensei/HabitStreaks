import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  SparkIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
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
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-[14.5px] text-[#f5f5f7] outline-none transition placeholder:text-[rgba(235,235,245,0.35)] focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/25";

const labelClass =
  "block text-[12.5px] font-semibold text-[rgba(235,235,245,0.7)]";

const primaryButton =
  "group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0A84FF] px-5 py-3 text-[14.5px] font-semibold text-white shadow-[0_0_24px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

const secondaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-5 py-3 text-[14px] font-semibold text-[rgba(235,235,245,0.8)] transition hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:w-auto";

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
    <div className="min-h-svh bg-black text-[#f5f5f7]">
      <Navbar />

      <main className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#0A84FF]/15 blur-[120px]" />
          <div className="absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-[#BF5AF2]/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
          <div className="animate-fade-up">
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11.5px] font-medium text-[#66AFFF] backdrop-blur">
                <SparkIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
                New habit
              </span>

              <h1 className="mt-4 text-[30px] font-bold tracking-tight text-[#f5f5f7] sm:text-[36px]">
                What do you want to build?
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                Pick something specific, give it a weekly target, and make it
                yours. You can always add more habits later.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-[26px] border border-white/[0.08] bg-[#1c1c1e] p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] sm:p-8"
            >
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-7">
                {/* Preview */}
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
                      {name.trim() || "Your new habit"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[rgba(235,235,245,0.55)]">
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
                    <span className="text-[11px] font-medium tabular-nums text-[rgba(235,235,245,0.4)]">
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
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[rgba(235,235,245,0.55)]">
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
                          className={`grid h-11 w-11 place-items-center rounded-[14px] border text-[20px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 ${
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
                          className={`grid h-9 w-9 place-items-center rounded-full shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 ${
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
                          className={`flex cursor-pointer items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5 text-[13px] font-semibold transition focus-within:ring-2 focus-within:ring-[#0A84FF]/60 ${
                            selected
                              ? "border-[#0A84FF] bg-[#0A84FF]/15 text-white ring-2 ring-[#0A84FF]/30"
                              : "border-white/[0.08] bg-white/[0.05] text-[rgba(235,235,245,0.8)] hover:border-white/[0.16] hover:bg-white/[0.08]"
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
                            <CheckIcon className="ml-auto h-4 w-4 shrink-0 text-[#409AFF]" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Targets per week */}
                <fieldset>
                  <legend className={labelClass}>Targets per week</legend>
                  <p className="mt-1 text-[12px] leading-relaxed text-[rgba(235,235,245,0.55)]">
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
                          className={`grid h-11 place-items-center rounded-[14px] border text-[14px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 ${
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

              <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
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
