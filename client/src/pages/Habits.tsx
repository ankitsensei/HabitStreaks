import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  PencilIcon,
  SparkIcon,
} from "../components/Icons";
import EditHabitModal from "../components/EditHabitModal";
import Navbar from "../components/Navbar";
import {
  ApiError,
  getHabits,
  toggleHabitCompletion,
  updateHabit,
} from "../lib/api";
import type { HabitWithCompletions, NewHabitInput } from "../lib/api";
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

const getGraphRange = () => {
  const today = startOfDay(new Date());
  const startOfCurrentWeek = addDays(today, -today.getDay());
  const start = addDays(
    startOfCurrentWeek,
    -(WEEKS_IN_GRAPH - 1) * 7,
  );

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
    <div className="mt-4">
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
                  <span
                    key={weekIndex}
                    className="relative h-3 w-3 shrink-0"
                  >
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
                        onClick={() =>
                          onToggle(habit, dateKey, isCompleted)
                        }
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

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-medium text-[rgba(235,235,245,0.4)]">
        Less
        <span className="h-[9px] w-[9px] rounded-[2px] bg-white/[0.08]" />
        <span
          className="h-[9px] w-[9px] rounded-[2px]"
          style={{ backgroundColor: habit.color }}
        />
        More
      </div>
    </div>
  );
};

interface HabitCardProps {
  habit: HabitWithCompletions;
  weeks: Date[][];
  todayKey: string;
  pending: Set<string>;
  onToggle: HabitGraphProps["onToggle"];
  onEdit: (habit: HabitWithCompletions) => void;
}

const HabitCard = ({
  habit,
  weeks,
  todayKey,
  pending,
  onToggle,
  onEdit,
}: HabitCardProps) => (
  <article className="rounded-[22px] border border-white/[0.08] bg-[#1c1c1e] p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.8)] sm:p-6">
    <div className="flex items-center gap-3.5">
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px]"
        style={{ backgroundColor: `${habit.color}1f` }}
      >
        {habit.icon}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[15px] font-bold text-[#f5f5f7]">
          {habit.name}
        </h2>
        <p className="mt-0.5 text-[11.5px] text-[rgba(235,235,245,0.55)]">
          {habit.category} · {habit.target_per_week}× per week
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[rgba(235,235,245,0.65)]">
        {habit.completions.length}{" "}
        {habit.completions.length === 1 ? "day" : "days"}
      </span>

      <button
        type="button"
        onClick={() => onEdit(habit)}
        aria-label={`Edit ${habit.name}`}
        title="Edit habit"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.05] text-[rgba(235,235,245,0.6)] transition hover:border-[#0A84FF]/40 hover:bg-[#0A84FF]/15 hover:text-[#409AFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
      >
        <PencilIcon className="h-3.5 w-3.5" />
      </button>
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
  const [editingHabit, setEditingHabit] =
    useState<HabitWithCompletions | null>(null);
  const [notice, setNotice] = useState<{
    kind: "added" | "updated";
    name: string;
  } | null>(() => {
    const state = location.state as { addedHabit?: string } | null;
    return state?.addedHabit
      ? { kind: "added", name: state.addedHabit }
      : null;
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

  const handleSaveHabit = async (input: NewHabitInput) => {
    if (!editingHabit) {
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const result = await updateHabit(token, editingHabit.id, input);

      setHabits((current) =>
        current.map((item) =>
          item.id === result.habit.id
            ? { ...result.habit, completions: item.completions }
            : item,
        ),
      );
      setEditingHabit(null);
      setNotice({ kind: "updated", name: result.habit.name });
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        clearToken();
        navigate("/login", { replace: true });
      }

      throw err;
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

        <div className="relative mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11.5px] font-medium text-[#66AFFF] backdrop-blur">
                <SparkIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
                Your habits
              </span>

              <h1 className="mt-4 text-[30px] font-bold tracking-tight text-[#f5f5f7] sm:text-[36px]">
                Your year in habits
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[rgba(235,235,245,0.6)]">
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
              className="mt-6 flex items-start gap-2.5 rounded-xl bg-[#30D158]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#30D158] ring-1 ring-[#30D158]/25"
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
              className="mt-6 flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 flex items-center justify-center gap-3 rounded-[22px] border border-white/[0.08] bg-[#1c1c1e] px-6 py-16 text-[13px] font-medium text-[rgba(235,235,245,0.6)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#0A84FF]" />
              Loading your habits…
            </div>
          ) : habits.length === 0 ? (
            <div className="mt-8 rounded-[26px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
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
              <Link to="/newhabit" className={`${primaryButton} mt-6`}>
                Create your first habit
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  weeks={graph.weeks}
                  todayKey={graph.todayKey}
                  pending={pending}
                  onToggle={handleToggle}
                  onEdit={setEditingHabit}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={handleSaveHabit}
        />
      )}
    </div>
  );
};

export default Habits;
