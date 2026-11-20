import {
 useEffect,
 useLayoutEffect,
 useMemo,
 useRef,
 useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
 AlertIcon,
 ArrowRightIcon,
 CheckIcon,
 SparkIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
import { ApiError, toggleHabitCompletion } from "../lib/api";
import type { HabitWithCompletions } from "../lib/api";
import { clearToken, getToken, useAuth } from "../lib/auth";
import {
 fetchHabits,
 habitsCacheKey,
 invalidateHabits,
 isHabitsCacheFresh,
 peekHabits,
} from "../lib/habitsCache";

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
 "inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

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
 date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

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
 <div className="mt-2">
 <div className="flex gap-2">
 <div className="flex shrink-0 flex-col gap-[3px] pt-4 text-[9px] font-medium text-[#a7a7a7]">
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
 <span className="absolute left-0 top-0 whitespace-nowrap text-[9px] font-medium text-[#a7a7a7]">
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
 className={`h-3 w-3 rounded-[2px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:ring-offset-1 focus-visible:ring-offset-[#141414] ${
 isFuture
 ? "cursor-not-allowed bg-[#0a0a0a] opacity-40"
 : isCompleted
 ? "hover:brightness-110"
 : "bg-[#1e1e1e] hover:bg-[#1e1e1e]"
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

// The week-streak strip fills the width next to the habit names with as
// many day boxes as fit — it never scrolls. Today is always the last box.
const MAX_RECENT_DAYS = 30;
const MIN_RECENT_DAYS = 5;
// Column width (w-7) plus the 2px gap between columns. One spacing for
// every screen size, so the gaps look identical on phones, tablets and
// desktops.
const DAY_STEP = 30;

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

// Rolling window of the last MAX_RECENT_DAYS days, oldest first, so the
// final box is always today.
const buildWeekRows = (
 habits: HabitWithCompletions[],
 today: Date,
 todayKey: string,
): HabitWeekRow[] => {
 const firstDay = addDays(today, -(MAX_RECENT_DAYS - 1));

 return habits.map((habit) => {
 const completedDays = new Set(habit.completions);
 const days = Array.from({ length: MAX_RECENT_DAYS }, (_, index) => {
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

// Measures the strip area next to the habit names and reports how many day
// boxes fit in it (min one handful, max a month). Recomputes on resize, so
// the shared date header and every habit row always fill the space exactly.
const useRecentDayCount = () => {
 const containerRef = useRef<HTMLDivElement | null>(null);
 const [dayCount, setDayCount] = useState(MIN_RECENT_DAYS);

 useLayoutEffect(() => {
 const container = containerRef.current;

 if (!container) {
 return;
 }

 const compute = () => {
 const fitting = Math.floor((container.clientWidth - 12) / DAY_STEP);

 setDayCount(
 Math.min(MAX_RECENT_DAYS, Math.max(MIN_RECENT_DAYS, fitting)),
 );
 };

 compute();

 const observer = new ResizeObserver(compute);
 observer.observe(container);

 return () => {
 observer.disconnect();
 };
 }, []);

 return { containerRef, dayCount };
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
}: WeekStreaksSectionProps) => {
 const { containerRef, dayCount } = useRecentDayCount();

 return (
 <section className="mt-4 mb-3 w-full max-w-full rounded-lg border border-[#313131] bg-[#141414] p-1.5">
 <div className="flex items-center justify-between gap-6 px-1.5 pb-1 pt-0.5">
 <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#a7a7a7]">
 Week streaks
 </span>
 <span className="text-[10.5px] text-[#7c7c7c]">
 Last {dayCount} days
 </span>
 </div>

 <div className="flex">
 <div className="w-28 shrink-0 sm:w-40">
 {/* Spacer keeps the habit rows aligned with the shared date header */}
 <div aria-hidden="true" className="h-8 shrink-0" />

 {rows.map((row, index) => (
 <div
 key={row.habit.id}
 className={`flex h-8 items-center gap-1.5 px-1.5 ${
 index > 0 ? "border-t border-[#1e1e1e]" : ""
 }`}
 >
 <span
 aria-hidden="true"
 className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[13px]"
 style={{ backgroundColor: `${row.habit.color}1f` }}
 >
 {row.habit.icon}
 </span>

 <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-white">
 {row.habit.name}
 </p>

 {row.weekStreak > 0 && (
 <span
 title={`${row.weekStreak} week streak`}
 className="shrink-0 rounded-full bg-[#6798ff]/10 px-2 py-0.5 text-[10.5px] font-medium text-[#6798ff]"
 >
 {row.weekStreak}w
 </span>
 )}
 </div>
 ))}
 </div>

 <div ref={containerRef} className="min-w-0 flex-1 pb-1">
 <div className="w-max px-1.5">
 {/* One shared heading of dates for every habit row */}
 <div className="flex h-8 items-end gap-[2px]">
 {(rows[0]?.days ?? []).slice(-dayCount).map((day) => (
 <span
 key={day.key}
 className="flex h-8 w-7 shrink-0 items-end justify-center"
 >
 <span
 className={`whitespace-nowrap text-[9px] font-medium leading-none [writing-mode:vertical-rl] rotate-180 ${
 day.isToday
 ? "text-[#6798ff]"
 : "text-[#a7a7a7]"
 }`}
 >
 {formatShortDate(day.date)}
 </span>
 </span>
 ))}
 </div>

 {rows.map((row, index) => (
 <div
 key={row.habit.id}
 className={`flex h-8 items-center gap-[2px] ${
 index > 0 ? "border-t border-[#1e1e1e]" : ""
 }`}
 >
 {row.days.slice(-dayCount).map((day) => {
 const isPending = pending.has(`${row.habit.id}:${day.key}`);

 return (
 <span
 key={day.key}
 className="flex w-7 shrink-0 justify-center"
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
 className={`h-6 w-6 rounded-[2px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:ring-offset-1 focus-visible:ring-offset-[#141414] ${
 day.isCompleted
 ? "hover:brightness-110"
 : "bg-[#1e1e1e] hover:bg-[#1e1e1e]"
 } ${day.isToday ? "ring-1 ring-[#6798ff]/60" : ""} ${
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
};

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
 <article className="rounded-lg border border-[#313131] bg-[#141414] p-2.5 sm:p-3">
 <div className="flex items-center gap-2">
 <span
 aria-hidden="true"
 className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[15px]"
 style={{ backgroundColor: `${habit.color}1f` }}
 >
 {habit.icon}
 </span>

 <div className="min-w-0 flex-1">
 <h2 className="truncate text-[14px] font-medium text-white">
 {habit.name}
 </h2>
 <p className="mt-0.5 text-[11px] text-[#a7a7a7]">
 {habit.category} · {habit.target_per_week}× per week
 </p>
 </div>

 <span className="shrink-0 rounded-full bg-[#1e1e1e] px-2 py-0.5 text-[10.5px] font-medium text-[#a7a7a7]">
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

 const cacheKey = habitsCacheKey(
 formatDateKey(graph.start),
 formatDateKey(graph.today),
 );

 // Seed state from the shared cache so a returning visit paints the year
 // graph on the first frame instead of flashing the loading state.
 const [habits, setHabits] = useState<HabitWithCompletions[]>(
 () => peekHabits(cacheKey) ?? [],
 );
 const [isLoading, setIsLoading] = useState(
 () => peekHabits(cacheKey) === null,
 );
 const [error, setError] = useState<string | null>(null);
 const [pending, setPending] = useState<Set<string>>(new Set());
 const pendingRef = useRef<Set<string>>(new Set());
 // Bumped on every mutation so a background revalidation started before it
 // can't overwrite a change the user just made.
 const mutationsRef = useRef(0);

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
 const from = formatDateKey(graph.start);
 const to = formatDateKey(graph.today);
 const cached = peekHabits(habitsCacheKey(from, to));

 if (cached) {
 // Cache hit: render immediately, skip setIsLoading(true) entirely, and
 // only go back to the network once the entry has aged past the TTL.
 setHabits(cached);
 setError(null);
 setIsLoading(false);

 if (!isHabitsCacheFresh(habitsCacheKey(from, to))) {
 const mutationsAtStart = mutationsRef.current;

 void fetchHabits(token, from, to)
 .then((fresh) => {
 if (
 !cancelled &&
 mutationsRef.current === mutationsAtStart
 ) {
 setHabits(fresh);
 }
 })
 .catch(() => {
 // Keep the cached copy on screen; the next visit retries.
 });
 }

 return () => {
 cancelled = true;
 };
 }

 const loadHabits = async () => {
 setIsLoading(true);
 setError(null);

 try {
 const result = await fetchHabits(token, from, to);

 if (!cancelled) {
 setHabits(result);
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
 // The cached ranges are now stale; the next visit refetches.
 mutationsRef.current += 1;
 invalidateHabits();

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
 <div className="min-h-svh bg-[#0a0a0a] text-white">
 <Navbar />

 <main>
 <div className="relative mx-auto lg:w-fit max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#a7a7a7]">
 <SparkIcon className="h-3.5 w-3.5 text-[#6798ff]" />
 Your habits
 </span>

 <h1 className="mt-3 text-[26px] font-medium tracking-[-0.02em] text-white sm:text-[32px]">
 Your year in habits
 </h1>
 <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[#a7a7a7]">
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
 className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#1e1e1e] px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-white ring-1 ring-[#313131]"
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
 className="grid h-6 w-6 shrink-0 place-items-center rounded text-white/70 transition hover:bg-[#6798ff]/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
 >
 ×
 </button>
 </div>
 )}

 {error && (
 <div
 role="alert"
 className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#141414] px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-white ring-1 ring-[#454545]"
 >
 <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {isLoading ? (
 <div className="mt-4 flex items-center justify-center gap-3 rounded-lg border border-[#313131] bg-[#141414] px-6 py-10 text-[13px] font-medium text-[#a7a7a7]">
 <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#313131] border-t-[#6798ff]" />
 Loading your habits…
 </div>
 ) : habits.length === 0 ? (
 <div className="mt-4 rounded-lg border border-dashed border-[#313131] bg-[#141414] px-6 py-10 text-center">
 <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#6798ff]/10 text-[#6798ff] ring-1 ring-[#6798ff]/20">
 <SparkIcon className="h-6 w-6" />
 </span>
 <h2 className="mt-4 text-[18px] font-medium text-white">
 No habits yet
 </h2>
 <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[#a7a7a7]">
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

 <div className="mt-3 space-y-2.5">
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
