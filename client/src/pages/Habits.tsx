import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  SparkIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
import {
  ApiError,
  getHabits,
  toggleHabitCompletion,
} from "../lib/api";
import type { HabitWithCompletions } from "../lib/api";
import { clearToken, getToken, useAuth } from "../lib/auth";

const WEEKS_IN_GRAPH = 53;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_0_20px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatShortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

const getGraphRange = () => {
  const today = startOfDay(new Date());
  const startOfCurrentWeek = addDays(today, -today.getDay());
  const start = addDays(startOfCurrentWeek, -(WEEKS_IN_GRAPH - 1) * 7);

  return { start, today };
};

const buildWeeks = (start: Date) => {
  const weeks: Date[][] = [];

  for (let weekIndex = 0; weekIndex < WEEKS_IN_GRAPH; weekIndex += 1) {
    const week: Date[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      week.push(addDays(start, weekIndex * 7 + dayIndex));
    }

    weeks.push(week);
  }

  return weeks;
};

interface HabitGraphProps {
  habit: HabitWithCompletions;
  weeks: Date[][];
  todayKey: string;
  pending: Set<string>;
  onToggle: (
    habit: HabitWithCompletions,
    dateKey: string,
    wasCompleted: boolean,
  ) => void;
}

const HabitGraph = ({
  habit,
  weeks,
  todayKey,
  pending,
  onToggle,
}: HabitGraphProps) => {
  const completedDays = useMemo(
    () => new Set(habit.completions),
    [habit.completions],
  );

  return (
    <div className="mt-2.5">
      <div className="flex gap-2">
        <div className="flex shrink-0 flex-col gap-[3px] pt-4 text-[9px] font-medium text-[rgba(235,235,245,0.4)]">
          {DAY_LABELS.map((label, index) => (
            <span key={index} className="flex h-3 items-center">
              {label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
          <div className="w-max">
            <div className="mb-1 flex gap-[3px]">
              {weeks.map((week, weekIndex) => {
                const firstOfMonth = week.find((day) => day.getDate() === 1);

                return (
                  <span key={weekIndex} className="relative h-3 w-3 shrink-0">
                    {firstOfMonth && (
                      <span className="absolute left-0 top-0 whitespace-nowrap text-[9px] font-medium text-[rgba(235,235,245,0.4)]">
                        {MONTHS[firstOfMonth.getMonth()]}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const dateKey = formatDateKey(day);
                    const isFuture = dateKey > todayKey;
                    const isCompleted = completedDays.has(dateKey);
                    const isPending = pending.has(`${habit.id}:${dateKey}`);

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        disabled={isFuture || isPending}
                        onClick={() => onToggle(habit, dateKey, isCompleted)}
                        title={`${formatDisplayDate(day)} · ${
                          isCompleted ? "Done" : "Not done"
                        }`}
                        aria-label={`${formatDisplayDate(day)}: ${
                          isCompleted ? "done" : "not done"
                        }`}
                        aria-pressed={isCompleted}
                        className={`h-3 w-3 rounded-[2px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1c1c1e] ${
                          isFuture
                            ? "cursor-not-allowed bg-white/[0.03] opacity-40"
                            : isCompleted
                              ? "hover:brightness-110"
                              : "bg-white/[0.08] hover:bg-white/[0.18]"
                        } ${isPending ? "animate-pulse" : ""}`}
                        style={
                          isCompleted
                            ? { backgroundColor: habit.color }
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Large screens show a 2-week window of boxes, small screens only the
// latest week. The extra week collapses with responsive classes, so the
// shared date header and the box rows stay perfectly aligned.
const RECENT_DAY_COUNT = 14;
const SMALL_SCREEN_DAY_COUNT = 7;

interface RecentDay {
  key: string;
  date: Date;
  isCompleted: boolean;
  isToday: boolean;
}

interface HabitWeekRow {
  habit: HabitWithCompletions;
  weekStreak: number;
  days: RecentDay[];
}

// Consecutive weeks (ending with the current week) where the habit met its
// weekly target. The in-progress current week only counts once the target is
// already reached, so an unfinished week never breaks the streak.
const computeWeekStreak = (
  habit: HabitWithCompletions,
  today: Date,
): number => {
  const completed = new Set(habit.completions);

  const countWeek = (weekStart: Date) => {
    let count = 0;

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      if (completed.has(formatDateKey(addDays(weekStart, dayIndex)))) {
        count += 1;
      }
    }

    return count;
  };

  const currentWeekStart = addDays(today, -today.getDay());
  let streak = countWeek(currentWeekStart) >= habit.target_per_week ? 1 : 0;
  let weekStart = addDays(currentWeekStart, -7);

  while (countWeek(weekStart) >= habit.target_per_week) {
    streak += 1;
    weekStart = addDays(weekStart, -7);
  }

  return streak;
};

// Rolling window of the last RECENT_DAY_COUNT days, oldest first, so the
// final box is always today.
const buildWeekRows = (
  habits: HabitWithCompletions[],
  today: Date,
  todayKey: string,
): HabitWeekRow[] => {
  const firstDay = addDays(today, -(RECENT_DAY_COUNT - 1));

  return habits.map((habit) => {
    const completedDays = new Set(habit.completions);
    const days = Array.from({ length: RECENT_DAY_COUNT }, (_, index) => {
      const date = addDays(firstDay, index);
      const key = formatDateKey(date);

      return {
        key,
        date,
        isCompleted: completedDays.has(key),
        isToday: key === todayKey,
      };
    });

    return {
      habit,
      weekStreak: computeWeekStreak(habit, today),
      days,
    };
  });
};

interface WeekStreaksSectionProps {
  rows: HabitWeekRow[];
  pending: Set<string>;
  onToggle: HabitGraphProps["onToggle"];
}

const WeekStreaksSection = ({
  rows,
  pending,
  onToggle,
}: WeekStreaksSectionProps) => (
  <section className="mt-4 mb-3 rounded-[18px] border border-white/[0.08] bg-[#1c1c1e] p-2 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.8)]">
    <div className="flex items-center justify-between px-2 pb-1 pt-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(235,235,245,0.45)]">
        Week streaks
      </span>
      <span className="text-[10.5px] text-[rgba(235,235,245,0.35)]">
        Last 2 weeks
      </span>
    </div>

    <div className="flex">
      <div className="w-28 shrink-0 sm:w-44">
        {/* Spacer keeps the habit rows aligned with the shared date header */}
        <div aria-hidden="true" className="h-4 shrink-0" />

        {rows.map((row, index) => (
          <div
            key={row.habit.id}
            className={`flex h-8 items-center gap-1.5 px-2 ${
              index > 0 ? "border-t border-white/[0.06]" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[13px]"
              style={{ backgroundColor: `${row.habit.color}1f` }}
            >
              {row.habit.icon}
            </span>

            <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#f5f5f7]">
              {row.habit.name}
            </p>

            {row.weekStreak > 0 && (
              <span
                title={`${row.weekStreak} week streak`}
                className="shrink-0 rounded-full bg-[#FF9F0A]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[#FF9F0A]"
              >
                {row.weekStreak}w
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto pb-1">
        <div className="w-max px-2">
          {/* One shared heading of dates for every habit row */}
          <div className="flex h-4 items-end gap-[2px]">
            {(rows[0]?.days ?? []).map((day, dayIndex) => (
              <span
                key={day.key}
                className={`w-7 shrink-0 text-center text-[9px] font-medium leading-none sm:w-8 ${
                  dayIndex < RECENT_DAY_COUNT - SMALL_SCREEN_DAY_COUNT
                    ? "hidden sm:block"
                    : ""
                } ${
                  day.isToday
                    ? "text-[#0A84FF]"
                    : "text-[rgba(235,235,245,0.4)]"
                }`}
              >
                {formatShortDate(day.date)}
              </span>
            ))}
          </div>

          {rows.map((row, index) => (
            <div
              key={row.habit.id}
              className={`flex h-8 items-center gap-[2px] ${
                index > 0 ? "border-t border-white/[0.06]" : ""
              }`}
            >
              {row.days.map((day, dayIndex) => {
                const isPending = pending.has(`${row.habit.id}:${day.key}`);
                const hideOnSmall =
                  dayIndex < RECENT_DAY_COUNT - SMALL_SCREEN_DAY_COUNT;

                return (
                  <span
                    key={day.key}
                    className={`w-7 shrink-0 justify-center sm:w-8 ${
                      hideOnSmall ? "hidden sm:flex" : "flex"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        onToggle(row.habit, day.key, day.isCompleted)
                      }
                      title={`${formatDisplayDate(day.date)} · ${
                        day.isCompleted ? "Done" : "Not done"
                      }`}
                      aria-label={`${formatDisplayDate(day.date)}: ${
                        day.isCompleted ? "done" : "not done"
                      }${day.isToday ? " (today)" : ""}`}
                      aria-pressed={day.isCompleted}
                      className={`h-6 w-6 rounded-[2px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1c1c1e] ${
                        day.isCompleted
                          ? "hover:brightness-110"
                          : "bg-white/[0.08] hover:bg-white/[0.18]"
                      } ${day.isToday ? "ring-1 ring-white/40" : ""} ${
                        isPending ? "animate-pulse" : ""
                      }`}
                      style={
                        day.isCompleted
                          ? { backgroundColor: row.habit.color }
                          : undefined
                      }
                    />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

interface HabitCardProps {
  habit: HabitWithCompletions;
  weeks: Date[][];
  todayKey: string;
  pending: Set<string>;
  onToggle: HabitGraphProps["onToggle"];
}

const HabitCard = ({
  habit,
  weeks,
  todayKey,
  pending,
  onToggle,
}: HabitCardProps) => (
  <article className="rounded-[18px] border border-white/[0.08] bg-[#1c1c1e] p-3 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.8)] sm:p-3.5">
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[17px]"
        style={{ backgroundColor: `${habit.color}1f` }}
      >
        {habit.icon}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[14px] font-bold text-[#f5f5f7]">
          {habit.name}
        </h2>
        <p className="mt-0.5 text-[11px] text-[rgba(235,235,245,0.55)]">
          {habit.category} · {habit.target_per_week}× per week
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10.5px] font-semibold text-[rgba(235,235,245,0.65)]">
        {habit.completions.length}{" "}
        {habit.completions.length === 1 ? "day" : "days"}
      </span>
    </div>

    <HabitGraph
      habit={habit}
      weeks={weeks}
      todayKey={todayKey}
      pending={pending}
      onToggle={onToggle}
    />
  </article>
);

const Habits = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const graph = useMemo(() => {
    const { start, today } = getGraphRange();

    return {
      start,
      today,
      weeks: buildWeeks(start),
      todayKey: formatDateKey(today),
    };
  }, []);

  const [habits, setHabits] = useState<HabitWithCompletions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());

  const weekRows = useMemo(
    () => buildWeekRows(habits, graph.today, graph.todayKey),
    [habits, graph.today, graph.todayKey],
  );

  const [notice, setNotice] = useState<{
    kind: "added" | "updated";
    name: string;
  } | null>(() => {
    const state = location.state as { addedHabit?: string } | null;
    return state?.addedHabit ? { kind: "added", name: state.addedHabit } : null;
  });

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    const loadHabits = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getHabits(
          token,
          formatDateKey(graph.start),
          formatDateKey(graph.today),
        );

        if (!cancelled) {
          setHabits(result.habits);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403)
        ) {
          clearToken();
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load your habits. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadHabits();

    return () => {
      cancelled = true;
    };
  }, [graph, isAuthenticated, navigate]);

  const handleToggle = async (
    habit: HabitWithCompletions,
    dateKey: string,
    wasCompleted: boolean,
  ) => {
    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const pendingKey = `${habit.id}:${dateKey}`;

    if (pendingRef.current.has(pendingKey)) {
      return;
    }

    pendingRef.current.add(pendingKey);
    setPending(new Set(pendingRef.current));
    setError(null);

    const applyCompletion = (completed: boolean) => {
      setHabits((current) =>
        current.map((item) => {
          if (item.id !== habit.id) {
            return item;
          }

          const completions = new Set(item.completions);

          if (completed) {
            completions.add(dateKey);
          } else {
            completions.delete(dateKey);
          }

          return { ...item, completions: Array.from(completions) };
        }),
      );
    };

    applyCompletion(!wasCompleted);

    try {
      const result = await toggleHabitCompletion(token, habit.id, dateKey);
      applyCompletion(result.completed);
    } catch (err) {
      applyCompletion(wasCompleted);

      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't update that day. Please try again.",
      );
    } finally {
      pendingRef.current.delete(pendingKey);
      setPending(new Set(pendingRef.current));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-svh bg-black text-[#f5f5f7]">
      <Navbar />

      <main className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#0A84FF]/15 blur-[120px]" />
          <div className="absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-[#BF5AF2]/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11.5px] font-medium text-[#66AFFF] backdrop-blur">
                <SparkIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
                Your habits
              </span>

              <h1 className="mt-3 text-[26px] font-bold tracking-tight text-[#f5f5f7] sm:text-[30px]">
                Your year in habits
              </h1>
              <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                Every square is a day from the last 12 months. Click an empty
                square to mark it done, or click a filled square to undo it.
              </p>
            </div>

            <Link to="/newhabit" className={primaryButton}>
              <SparkIcon className="h-4 w-4" />
              New habit
            </Link>
          </div>

          {notice && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#30D158]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#30D158] ring-1 ring-[#30D158]/25"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">
                {notice.kind === "added" ? (
                  <>
                    “{notice.name}” was added. Click any square below to start
                    marking days.
                  </>
                ) : (
                  <>“{notice.name}” was updated.</>
                )}
              </span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#30D158]/70 transition hover:bg-[#30D158]/15 hover:text-[#30D158] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30D158]/40"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-[18px] border border-white/[0.08] bg-[#1c1c1e] px-6 py-10 text-[13px] font-medium text-[rgba(235,235,245,0.6)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#0A84FF]" />
              Loading your habits…
            </div>
          ) : habits.length === 0 ? (
            <div className="mt-4 rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-[#0A84FF]/10 text-[#409AFF] ring-1 ring-[#0A84FF]/20">
                <SparkIcon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-[18px] font-bold text-[#f5f5f7]">
                No habits yet
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[rgba(235,235,245,0.55)]">
                Create your first habit and its yearly graph will appear here
                automatically.
              </p>
              <Link to="/newhabit" className={`${primaryButton} mt-5`}>
                Create your first habit
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <WeekStreaksSection
                rows={weekRows}
                pending={pending}
                onToggle={handleToggle}
              />

              <div className="mt-3 space-y-3">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    weeks={graph.weeks}
                    todayKey={graph.todayKey}
                    pending={pending}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Habits;
