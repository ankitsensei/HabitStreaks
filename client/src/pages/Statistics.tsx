import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
 AlertIcon,
 ArrowRightIcon,
 CalendarIcon,
 ChartIcon,
 CheckIcon,
 ChevronLeftIcon,
 ChevronRightIcon,
 FlameIcon,
 SparkIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
import { ApiError } from "../lib/api";
import type { HabitWithCompletions } from "../lib/api";
import {
 WEEKDAY_LABELS,
 buildOverallSummary,
 buildPeriodSummaries,
 formatDateKey,
 getHabitCreatedKey,
 getPeriodDisplayRange,
 getPeriodViewRange,
 getToday,
 isPeriodAtCurrent,
 shiftPeriodCursor,
 splitRange,
} from "../lib/habitStats";
import type {
 ComparisonBucket,
 OverallSummary,
 StatsPeriod,
} from "../lib/habitStats";
import { clearToken, getToken, useAuth } from "../lib/auth";
import {
 fetchHabits,
 habitsCacheKey,
 invalidateHabits,
 isHabitsCacheFresh,
 peekHabits,
} from "../lib/habitsCache";

const PERIODS: { id: StatsPeriod; label: string }[] = [
 { id: "day", label: "Day" },
 { id: "week", label: "Week" },
 { id: "month", label: "Month" },
 { id: "year", label: "Year" },
];

const PERIOD_SCOPE: Record<StatsPeriod, string> = {
 day: "today",
 week: "this week",
 month: "this month",
 year: "this year",
};

// All-time data is fetched in chunks to stay under the API's 371-day limit.
const OVERALL_CHUNK_DAYS = 365;

const pluralize = (count: number, singular: string, plural: string) =>
 count === 1 ? singular : plural;

const sumBucket = (bucket: ComparisonBucket) =>
 bucket.counts.reduce((sum, count) => sum + count, 0);

const buildBucketTooltip = (
 bucket: ComparisonBucket,
 habits: HabitWithCompletions[],
) => {
 if (bucket.isFuture) {
 return `${bucket.title} · upcoming`;
 }

 const total = sumBucket(bucket);

 if (total === 0) {
 return `${bucket.title} · no check-ins`;
 }

 const lines = habits.flatMap((habit, index) =>
 bucket.counts[index] > 0
 ? [
 `${habit.icon} ${habit.name}${
 bucket.counts[index] > 1 ? ` · ${bucket.counts[index]}` : ""
 }`,
 ]
 : [],
 );

 return [
 `${bucket.title} · ${total} ${pluralize(total, "check-in", "check-ins")}`,
 ...lines,
 ].join("\n");
};

const formatWeekEndpoint = (date: Date, includeYear: boolean) =>
 date.toLocaleDateString(
 undefined,
 includeYear
 ? { month: "short", day: "numeric", year: "numeric" }
 : { month: "short", day: "numeric" },
 );

// Human label for the period currently on screen.
const getRangeLabel = (
 period: StatsPeriod,
 cursor: Date,
 atCurrent: boolean,
) => {
 const { from, to } = getPeriodDisplayRange(period, cursor);

 switch (period) {
 case "day":
 return atCurrent
 ? "Today"
 : from.toLocaleDateString(undefined, {
 weekday: "short",
 month: "short",
 day: "numeric",
 year: "numeric",
 });
 case "week": {
 if (atCurrent) {
 return "This week";
 }

 const sameYear = from.getFullYear() === to.getFullYear();
 return `${formatWeekEndpoint(from, !sameYear)} – ${formatWeekEndpoint(
 to,
 true,
 )}`;
 }
 case "month":
 return atCurrent
 ? "This month"
 : from.toLocaleDateString(undefined, {
 month: "long",
 year: "numeric",
 });
 case "year":
 return atCurrent ? "This year" : String(from.getFullYear());
 }
};

interface SegmentedControlProps {
 value: StatsPeriod;
 onChange: (value: StatsPeriod) => void;
}

const SegmentedControl = ({ value, onChange }: SegmentedControlProps) => (
 <div className="flex w-full rounded-lg bg-[#0a0a0a] p-1 sm:w-auto">
 {PERIODS.map((item) => {
 const isActive = item.id === value;

 return (
 <button
 key={item.id}
 type="button"
 onClick={() => onChange(item.id)}
 aria-pressed={isActive}
 className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60 sm:flex-none sm:px-3.5 sm:py-1.5 sm:text-[12px] ${
 isActive
 ? "bg-[#1e1e1e] text-white"
 : "text-[#a7a7a7] hover:bg-[#1e1e1e]/60 hover:text-white"
 }`}
 >
 {item.label}
 </button>
 );
 })}
 </div>
);

interface RangeNavigatorProps {
 label: string;
 periodLabel: string;
 isAtCurrent: boolean;
 onPrevious: () => void;
 onNext: () => void;
}

const RangeNavigator = ({
 label,
 periodLabel,
 isAtCurrent,
 onPrevious,
 onNext,
}: RangeNavigatorProps) => (
 <div className="flex sm:justify-center">
 <div className="flex w-full items-center justify-between rounded-lg bg-[#0a0a0a] px-1 py-1 sm:inline-flex sm:w-auto">
 <button
 type="button"
 onClick={onPrevious}
 aria-label={`Previous ${periodLabel}`}
 className="grid h-6 w-6 shrink-0 place-items-center rounded text-[#6798ff] transition hover:bg-[#1e1e1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50 sm:h-7 sm:w-7"
 >
 <ChevronLeftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
 </button>

 <p
 aria-live="polite"
 className="min-w-0 flex-1 truncate px-1.5 text-center text-[11.5px] font-medium text-white/70 sm:flex-none sm:text-[12px]"
 >
 {label}
 </p>

 <button
 type="button"
 onClick={onNext}
 disabled={isAtCurrent}
 aria-label={`Next ${periodLabel}`}
 className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#6798ff] transition hover:bg-[#1e1e1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50 disabled:cursor-not-allowed disabled:text-[#7c7c7c] disabled:hover:bg-transparent sm:h-7 sm:w-7"
 >
 <ChevronRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
 </button>
 </div>
 </div>
);

interface PeriodChartProps {
 buckets: ComparisonBucket[];
 habits: HabitWithCompletions[];
 yMax: number;
 average: number;
 dense: boolean;
 ariaLabel: string;
}

const PeriodChart = ({
 buckets,
 habits,
 yMax,
 average,
 dense,
 ariaLabel,
}: PeriodChartProps) => {
 const ticks = [1, 0.75, 0.5, 0.25, 0].map((fraction) =>
 Math.round(yMax * fraction),
 );
 const gapClassName = dense ? "gap-[3px]" : "gap-1.5 sm:gap-2";
 const averagePercent = Math.min(100, (average / yMax) * 100);

 return (
 <div className="flex gap-2.5">
 <div className="flex h-44 w-6 shrink-0 flex-col justify-between text-right text-[9px] font-medium leading-none text-[#a7a7a7]">
 {ticks.map((tick) => (
 <span key={tick}>{tick}</span>
 ))}
 </div>

 <div className="min-w-0 flex-1">
 <div className="relative h-44" role="img" aria-label={ariaLabel}>
 {[0, 25, 50, 75, 100].map((percent) => (
 <div
 key={percent}
 className="absolute inset-x-0 border-t border-[#1e1e1e]"
 style={{ top: `${percent}%` }}
 />
 ))}

 {average > 0 && (
 <div
 className="absolute inset-x-0 z-10 border-t border-dashed border-[#454545]"
 style={{ bottom: `${averagePercent}%` }}
 />
 )}

 <div className={`absolute inset-0 flex items-end ${gapClassName}`}>
 {buckets.map((bucket) => {
 const total = sumBucket(bucket);

 return (
 <div
 key={bucket.key}
 title={buildBucketTooltip(bucket, habits)}
 className="flex h-full flex-1 flex-col justify-end"
 >
 {total === 0 ? (
 <div
 className={`w-full rounded-t-[3px] ${
 bucket.isFuture
 ? "bg-transparent"
 : "bg-[#1e1e1e]"
 }`}
 style={{ height: "2%" }}
 />
 ) : (
 <div
 className="flex w-full flex-col overflow-hidden rounded-t-[3px]"
 style={{ height: `${(total / yMax) * 100}%` }}
 >
 {bucket.counts.map((count, index) =>
 count > 0 ? (
 <div
 key={habits[index].id}
 className="w-full"
 style={{
 flexGrow: count,
 flexBasis: 0,
 backgroundColor: habits[index].color,
 }}
 />
 ) : null,
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>

 <div className={`mt-2 flex ${gapClassName}`}>
 {buckets.map((bucket, index) => (
 <span
 key={bucket.key}
 className={`flex-1 text-center text-[9px] ${
 bucket.isToday
 ? "font-medium text-white"
 : "font-medium text-[#a7a7a7]"
 }`}
 >
 {dense && index > 0 && (index + 1) % 5 !== 0 ? "" : bucket.label}
 </span>
 ))}
 </div>
 </div>
 </div>
 );
};

interface DayChartProps {
 habits: HabitWithCompletions[];
 dateKey: string;
 dateLabel: string;
 trackedHabitIds: Set<number>;
}

const DayChart = ({
 habits,
 dateKey,
 dateLabel,
 trackedHabitIds,
}: DayChartProps) => (
 <div className="flex gap-2.5">
 <div className="h-44 w-6 shrink-0" aria-hidden="true" />

 <div className="min-w-0 flex-1">
 <div
 className="flex h-44 items-end gap-1.5 sm:gap-2"
 role="img"
 aria-label={`Habit completion for ${dateLabel}, one bar per habit`}
 >
 {habits.map((habit) => {
 const wasTracked = trackedHabitIds.has(habit.id);
 const isDone = wasTracked && habit.completions.includes(dateKey);

 return (
 <div
 key={habit.id}
 title={
 wasTracked
 ? `${habit.name} · ${isDone ? "done" : "not done"} · ${dateLabel}`
 : `${habit.name} · not tracked on this day`
 }
 className="flex h-full flex-1 flex-col justify-end"
 >
 <div
 className={`w-full rounded-t-[3px] ${
 isDone
 ? ""
 : wasTracked
 ? "bg-[#1e1e1e]"
 : "bg-[#0a0a0a]"
 }`}
 style={{
 height: isDone ? "100%" : wasTracked ? "4%" : "2%",
 backgroundColor: isDone ? habit.color : undefined,
 }}
 />
 </div>
 );
 })}
 </div>

 <div className="mt-2 flex gap-1.5 sm:gap-2">
 {habits.map((habit) => (
 <span key={habit.id} className="flex-1 text-center text-[14px]">
 {habit.icon}
 </span>
 ))}
 </div>
 </div>
 </div>
);

interface StatTileProps {
 icon: ReactNode;
 label: string;
 value: string;
 sub: string;
}

const StatTile = ({ icon, label, value, sub }: StatTileProps) => (
 <article className="rounded-lg border border-[#313131] bg-[#141414] p-4">
 <div className="flex items-center gap-1.5 text-[#a7a7a7]">
 {icon}
 <span className="text-[11px] font-medium">{label}</span>
 </div>
 <p className="mt-2 text-[22px] font-medium leading-none tracking-tight text-white">
 {value}
 </p>
 <p className="mt-1.5 text-[10.5px] text-[#a7a7a7]">
 {sub}
 </p>
 </article>
);

const ChartSkeleton = () => (
 <div className="mt-4 flex h-52 items-center justify-center">
 <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#313131] border-t-[#6798ff]" />
 </div>
);

const ContentSkeleton = () => (
 <>
 <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
 {[0, 1, 2, 3].map((index) => (
 <div
 key={index}
 className="h-[106px] animate-pulse rounded-lg border border-[#313131] bg-[#141414]"
 />
 ))}
 </div>

 <section className="mt-4 rounded-lg border border-[#313131] bg-[#141414] p-5 sm:p-6">
 <div className="h-4 w-36 animate-pulse rounded bg-[#1e1e1e]" />
 <div className="mt-5 space-y-4">
 {[0, 1, 2].map((index) => (
 <div key={index} className="flex items-center gap-3">
 <div className="h-9 w-9 animate-pulse rounded-[9px] bg-[#1e1e1e]" />
 <div className="flex-1 space-y-2">
 <div className="h-3 w-1/3 animate-pulse rounded bg-[#1e1e1e]" />
 <div className="h-2 w-1/4 animate-pulse rounded bg-[#0a0a0a]" />
 </div>
 </div>
 ))}
 </div>
 </section>
 </>
);

interface InitialErrorProps {
 message: string | null;
 onRetry: () => void;
}

const InitialError = ({ message, onRetry }: InitialErrorProps) => (
 <div className="mt-6 rounded-lg border border-[#313131] bg-[#141414] px-6 py-12 text-center">
 <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#1e1e1e] text-[#a7a7a7]">
 <AlertIcon className="h-6 w-6" />
 </span>
 <h2 className="mt-4 text-[17px] font-medium text-white">
 Couldn't load your statistics
 </h2>
 <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-[#a7a7a7]">
 {message ?? "Something went wrong. Please try again."}
 </p>
 <button
 type="button"
 onClick={onRetry}
 className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60"
 >
 Try again
 </button>
 </div>
);

// Combine per-range responses into one habit list with every completion.
const mergeHabitChunks = (chunks: HabitWithCompletions[][]) => {
 const byId = new Map<number, HabitWithCompletions>();

 for (const chunk of chunks) {
 for (const habit of chunk) {
 const existing = byId.get(habit.id);

 if (existing) {
 existing.completions.push(...habit.completions);
 } else {
 byId.set(habit.id, {
 ...habit,
 completions: [...habit.completions],
 });
 }
 }
 }

 return Array.from(byId.values()).map((habit) => ({
 ...habit,
 completions: Array.from(new Set(habit.completions)).sort(),
 }));
};

const getOverallChunks = (from: Date, to: Date) =>
 splitRange({ from, to }, OVERALL_CHUNK_DAYS);

interface OverallSectionProps {
 overall: OverallSummary;
 habitCount: number;
}

const OverallSection = ({ overall, habitCount }: OverallSectionProps) => {
 const since = overall.trackingSince.toLocaleDateString(undefined, {
 month: "long",
 year: "numeric",
 });
 const stats = [
 {
 label: "Total check-ins",
 value: overall.totalCheckIns.toLocaleString(),
 sub: "all time",
 },
 {
 label: "Active days",
 value: overall.activeDays.toLocaleString(),
 sub: "with a check-in",
 },
 {
 label: "Perfect days",
 value: overall.perfectDays.toLocaleString(),
 sub: "every habit done",
 },
 {
 label: "Current streak",
 value: `${overall.currentStreak}`,
 sub: "consecutive active days",
 },
 {
 label: "Best streak",
 value: `${overall.longestStreak}`,
 sub: "longest active run",
 },
 {
 label: "Completion",
 value: `${overall.completionRate}%`,
 sub: "of weekly targets",
 },
 ];

 return (
 <section className="mt-4 rounded-lg border border-[#313131] bg-[#141414] p-5 sm:p-6">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <h2 className="text-[16px] font-medium text-white">
 Overall
 </h2>
 <p className="mt-0.5 text-[11.5px] text-[#a7a7a7]">
 Lifetime stats across {habitCount}{" "}
 {pluralize(habitCount, "habit", "habits")}
 </p>
 </div>

 <span className="rounded-full bg-[#1e1e1e] px-2.5 py-1 text-[10.5px] font-medium text-[#a7a7a7]">
 Since {since}
 </span>
 </div>

 <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
 {stats.map((stat) => (
 <div
 key={stat.label}
 className="rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3"
 >
 <p className="text-[10.5px] font-medium text-[#a7a7a7]">
 {stat.label}
 </p>
 <p className="mt-1.5 text-[20px] font-medium leading-none tracking-tight text-white">
 {stat.value}
 </p>
 <p className="mt-1 text-[10px] text-[#a7a7a7]">
 {stat.sub}
 </p>
 </div>
 ))}
 </div>
 </section>
 );
};

const OverallSkeleton = () => (
 <section className="mt-4 rounded-lg border border-[#313131] bg-[#141414] p-5 sm:p-6">
 <div className="h-4 w-24 animate-pulse rounded bg-[#1e1e1e]" />
 <div className="mt-2 h-2.5 w-48 animate-pulse rounded bg-[#0a0a0a]" />
 <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
 {[0, 1, 2, 3, 4, 5].map((index) => (
 <div
 key={index}
 className="h-[76px] animate-pulse rounded-lg bg-[#0a0a0a]"
 />
 ))}
 </div>
 </section>
);

interface OverallErrorProps {
 message: string | null;
 onRetry: () => void;
}

const OverallError = ({ message, onRetry }: OverallErrorProps) => (
 <section className="mt-4 rounded-lg border border-[#313131] bg-[#141414] p-5 sm:p-6">
 <div className="flex items-center gap-1.5">
 <AlertIcon className="h-4 w-4 text-[#6798ff]" />
 <h2 className="text-[16px] font-medium text-white">
 Overall
 </h2>
 </div>
 <p className="mt-1.5 text-[12px] text-[#a7a7a7]">
 {message ?? "Couldn't load your all-time stats. Please try again."}
 </p>
 <button
 type="button"
 onClick={onRetry}
 className="mt-3 text-[12.5px] font-medium text-[#6798ff] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50"
 >
 Try again
 </button>
 </section>
);

const Statistics = () => {
 const navigate = useNavigate();
 const { isAuthenticated } = useAuth();

 const today = useMemo(() => getToday(), []);
 const [cursor, setCursor] = useState(today);
 const [period, setPeriod] = useState<StatsPeriod>("week");

 // Read the shared cache up front so a returning visit paints the charts
 // immediately instead of the loading skeleton.
 const initialView = getPeriodViewRange(period, cursor, today);
 const initialKey = habitsCacheKey(
 formatDateKey(initialView.from),
 formatDateKey(initialView.to),
 );
 const initialHabits = peekHabits(initialKey);

 const [habits, setHabits] = useState<HabitWithCompletions[]>(
 () => initialHabits ?? [],
 );
 const [dataKey, setDataKey] = useState<string | null>(() =>
 initialHabits === null ? null : initialKey,
 );
 const [error, setError] = useState<string | null>(null);
 const [showAll, setShowAll] = useState(false);
 const [retryNonce, setRetryNonce] = useState(0);
 const [overallHabits, setOverallHabits] = useState<
 HabitWithCompletions[] | null
 >(null);
 const [overallError, setOverallError] = useState<string | null>(null);
 const [overallRetryNonce, setOverallRetryNonce] = useState(0);

 const earliestCreatedKey = useMemo(() => {
 if (habits.length === 0) {
 return null;
 }

 return habits.reduce((earliest, habit) => {
 const key = getHabitCreatedKey(habit);
 return key < earliest ? key : earliest;
 }, getHabitCreatedKey(habits[0]));
 }, [habits]);

 const viewRange = useMemo(
 () => getPeriodViewRange(period, cursor, today),
 [period, cursor, today],
 );
 const viewKey = habitsCacheKey(
 formatDateKey(viewRange.from),
 formatDateKey(viewRange.to),
 );
 const atCurrent = isPeriodAtCurrent(period, cursor, today);
 const rangeLabel = getRangeLabel(period, cursor, atCurrent);
 const scopeLabel = atCurrent ? PERIOD_SCOPE[period] : rangeLabel;
 const periodLabel =
 PERIODS.find((item) => item.id === period)?.label ?? "period";

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
 const from = formatDateKey(viewRange.from);
 const to = formatDateKey(viewRange.to);
 const cached = peekHabits(viewKey);

 if (cached) {
 // Cache hit: render immediately, skip the loading skeleton, and only go
 // back to the network once the entry has aged past the TTL.
 setHabits(cached);
 setDataKey(viewKey);
 setError(null);

 if (!isHabitsCacheFresh(viewKey)) {
 void fetchHabits(token, from, to)
 .then((fresh) => {
 if (!cancelled) {
 setHabits(fresh);
 setDataKey(viewKey);
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
 setError(null);

 try {
 const result = await fetchHabits(token, from, to);

 if (!cancelled) {
 setHabits(result);
 setDataKey(viewKey);
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
 : "Couldn't load your statistics. Please try again.",
 );
 }
 };

 void loadHabits();

 return () => {
 cancelled = true;
 };
 }, [
 isAuthenticated,
 navigate,
 viewKey,
 viewRange.from,
 viewRange.to,
 retryNonce,
 ]);

 useEffect(() => {
 if (
 !isAuthenticated ||
 earliestCreatedKey === null ||
 overallHabits !== null
 ) {
 return;
 }

 const token = getToken();

 if (!token) {
 return;
 }

 const earliestCreated = new Date(`${earliestCreatedKey}T00:00:00`);
 const start = new Date(earliestCreated.getFullYear(), 0, 1);
 const chunks = getOverallChunks(start, today);
 const requestState = { cancelled: false };

 const loadOverall = async () => {
 setOverallError(null);

 try {
 const results = await Promise.all(
 chunks.map((chunk) =>
 fetchHabits(
 token,
 formatDateKey(chunk.from),
 formatDateKey(chunk.to),
 ),
 ),
 );

 if (!requestState.cancelled) {
 setOverallHabits(mergeHabitChunks(results));
 }
 } catch (err) {
 if (requestState.cancelled) {
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

 setOverallError(
 err instanceof ApiError
 ? err.message
 : "Couldn't load your overall stats. Please try again.",
 );
 }
 };

 void loadOverall();

 return () => {
 requestState.cancelled = true;
 };
 }, [
 earliestCreatedKey,
 isAuthenticated,
 navigate,
 overallHabits,
 overallRetryNonce,
 today,
 ]);

 const summaries = useMemo(
 () => buildPeriodSummaries(habits, viewRange, today),
 [habits, viewRange, today],
 );
 const overall = useMemo(
 () => (overallHabits ? buildOverallSummary(overallHabits, today) : null),
 [overallHabits, today],
 );

 if (!isAuthenticated) {
 return null;
 }

 const hasLoaded = dataKey !== null;
 const isReady = dataKey === viewKey;
 const summary = summaries[period];

 const selectedDayKey = formatDateKey(viewRange.to);
 const trackedHabitIds =
 period === "day"
 ? new Set(
 habits
 .filter((habit) => getHabitCreatedKey(habit) <= selectedDayKey)
 .map((habit) => habit.id),
 )
 : new Set<number>();
 const trackedHabitCount =
 period === "day" ? trackedHabitIds.size : habits.length;

 const isMonthlyScale = period === "year";
 const maxBucket = Math.max(...summary.buckets.map(sumBucket), 1);
 const yMax = Math.max(4, Math.ceil(maxBucket / 4) * 4);
 const completionPercent =
 trackedHabitCount === 0
 ? null
 : Math.round((summary.total / trackedHabitCount) * 100);

 const ranking = habits
 .map((habit, index) => ({ habit, count: summary.habitCounts[index] }))
 .sort(
 (left, right) =>
 right.count - left.count ||
 left.habit.name.localeCompare(right.habit.name),
 );
 const visibleRanking = showAll ? ranking : ranking.slice(0, 5);
 const maxRanking = Math.max(...ranking.map((item) => item.count), 1);

 const handlePeriodChange = (next: StatsPeriod) => {
 setPeriod(next);
 setError(null);
 setShowAll(false);
 };

 const handleNavigate = (direction: 1 | -1) => {
 if (direction === 1 && atCurrent) {
 return;
 }

 setError(null);
 setCursor((current) => {
 const next = shiftPeriodCursor(period, current, direction);

 if (direction === 1 && next.getTime() > today.getTime()) {
 return today;
 }

 return next;
 });
 setShowAll(false);
 };

 const handleRetry = () => {
 invalidateHabits(viewKey);
 setRetryNonce((nonce) => nonce + 1);
 };

 const handleOverallRetry = () => {
 setOverallError(null);
 setOverallRetryNonce((nonce) => nonce + 1);
 };

 const chartSubtitle =
 period === "day"
 ? `Habit completion · ${rangeLabel}`
 : `Check-ins per ${isMonthlyScale ? "month" : "day"} · ${rangeLabel}`;

 const footerLabel =
 period === "day"
 ? atCurrent
 ? "Today"
 : "Selected day"
 : isMonthlyScale
 ? "Monthly Average"
 : "Daily Average";
 const footerValue =
 period === "day" ? `${summary.total}` : summary.bucketAverage.toFixed(1);
 const footerUnit =
 period === "day"
 ? `of ${trackedHabitCount} ${pluralize(
 trackedHabitCount,
 "habit",
 "habits",
 )} done`
 : isMonthlyScale
 ? "check-ins per month"
 : "check-ins per day";

 const bestDayValue =
 summary.bestWeekday === null ? "—" : WEEKDAY_LABELS[summary.bestWeekday];

 const tiles: StatTileProps[] = [
 {
 icon: <CheckIcon className="h-3.5 w-3.5" />,
 label: "Check-ins",
 value: `${summary.total}`,
 sub: scopeLabel,
 },
 {
 icon: <ChartIcon className="h-3.5 w-3.5" />,
 label:
 period === "day"
 ? "Habits done"
 : isMonthlyScale
 ? "Monthly average"
 : "Daily average",
 value:
 period === "day"
 ? trackedHabitCount === 0
 ? "—"
 : `${summary.total} / ${trackedHabitCount}`
 : summary.bucketAverage.toFixed(1),
 sub:
 period === "day"
 ? atCurrent
 ? "completed today"
 : "completed that day"
 : isMonthlyScale
 ? "check-ins per month"
 : "check-ins per day",
 },
 {
 icon: <SparkIcon className="h-3.5 w-3.5" />,
 label: "Perfect days",
 value:
 period === "day"
 ? summary.perfectDays > 0
 ? "Yes"
 : "No"
 : `${summary.perfectDays}`,
 sub: "every habit done",
 },
 {
 icon: <FlameIcon className="h-3.5 w-3.5" />,
 label: "Best day",
 value:
 period === "day"
 ? summary.bestWeekday === null
 ? "—"
 : atCurrent
 ? "Today"
 : bestDayValue
 : bestDayValue,
 sub: `${summary.bestWeekdayCount} ${pluralize(
 summary.bestWeekdayCount,
 "check-in",
 "check-ins",
 )}`,
 },
 ];

 return (
 <div className="min-h-svh bg-[#0a0a0a] text-white">
 <Navbar />

 <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-12">
 <header>
 <h1 className="text-[28px] font-medium tracking-[-0.02em] text-white sm:text-[32px]">
 Statistics
 </h1>
 <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#a7a7a7]">
 Compare days, weeks, months, and years at a glance — plus all-time
 stats across every habit.
 </p>
 </header>

 {!hasLoaded && !error ? (
 <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-[#313131] bg-[#141414] px-6 py-16 text-[13px] font-medium text-[#a7a7a7]">
 <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#313131] border-t-[#6798ff]" />
 Loading your activity…
 </div>
 ) : !hasLoaded ? (
 <InitialError message={error} onRetry={handleRetry} />
 ) : habits.length === 0 ? (
 <div className="mt-6 rounded-lg border border-[#313131] bg-[#141414] px-6 py-16 text-center">
 <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#6798ff]/10 text-[#6798ff] ring-1 ring-[#6798ff]/20">
 <ChartIcon className="h-6 w-6" />
 </span>
 <h2 className="mt-4 text-[17px] font-medium text-white">
 Nothing to chart yet
 </h2>
 <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-[#a7a7a7]">
 Create your first habit and your daily, weekly, monthly, and
 yearly activity will show up here.
 </p>
 <Link
 to="/newhabit"
 className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60"
 >
 <SparkIcon className="h-4 w-4" />
 Create your first habit
 </Link>
 </div>
 ) : (
 <>
 {error && (
 <div
 role="alert"
 className="mt-6 flex items-start gap-2.5 rounded-lg bg-[#141414] px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-white ring-1 ring-[#454545]"
 >
 <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
 <span className="flex-1">{error}</span>
 <button
 type="button"
 onClick={handleRetry}
 className="shrink-0 font-medium text-white underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
 >
 Retry
 </button>
 </div>
 )}

 <section className="mt-6 rounded-lg border border-[#313131] bg-[#141414] p-5 sm:p-6">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h2 className="text-[16px] font-medium text-white">
 Habit Activity
 </h2>
 <p className="mt-0.5 text-[11.5px] text-[#a7a7a7]">
 {chartSubtitle}
 </p>
 </div>
 <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
 <RangeNavigator
 label={rangeLabel}
 periodLabel={periodLabel}
 isAtCurrent={atCurrent}
 onPrevious={() => handleNavigate(-1)}
 onNext={() => handleNavigate(1)}
 />

 <SegmentedControl
 value={period}
 onChange={handlePeriodChange}
 />
 </div>
 </div>

 {isReady ? (
 <>
 <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
 {habits.map((habit) => (
 <span
 key={habit.id}
 className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#a7a7a7]"
 >
 <span
 className="h-2 w-2 rounded-full"
 style={{ backgroundColor: habit.color }}
 />
 {habit.name}
 </span>
 ))}
 </div>

 <div className="mt-4">
 {period === "day" ? (
 <>
 <DayChart
 habits={habits}
 dateKey={formatDateKey(viewRange.to)}
 dateLabel={atCurrent ? "Today" : rangeLabel}
 trackedHabitIds={trackedHabitIds}
 />
 {trackedHabitCount < habits.length && (
 <p className="mt-2 text-[10.5px] font-medium text-[#a7a7a7]">
 {habits.length - trackedHabitCount}{" "}
 {pluralize(
 habits.length - trackedHabitCount,
 "habit",
 "habits",
 )}{" "}
 didn't exist yet on this day.
 </p>
 )}
 </>
 ) : (
 <PeriodChart
 buckets={summary.buckets}
 habits={habits}
 yMax={yMax}
 average={summary.bucketAverage}
 dense={period === "month"}
 ariaLabel={`Check-ins ${scopeLabel}, stacked by habit color`}
 />
 )}
 </div>

 <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#1e1e1e] pt-4">
 <div>
 <p className="text-[11px] font-medium text-[#a7a7a7]">
 {footerLabel}
 </p>
 <p className="mt-1 text-[28px] font-medium leading-none tracking-tight text-white">
 {footerValue}
 <span className="ml-1.5 text-[12px] font-medium text-[#a7a7a7]">
 {footerUnit}
 </span>
 </p>
 </div>

 <div className="text-right">
 <p className="text-[11px] font-medium text-[#a7a7a7]">
 {period === "day" ? "Completion" : "Total"}
 </p>
 <p className="mt-1 text-[15px] font-medium text-white">
 {period === "day"
 ? completionPercent === null
 ? "—"
 : `${completionPercent}%`
 : `${summary.total} ${pluralize(
 summary.total,
 "check-in",
 "check-ins",
 )}`}
 </p>
 </div>
 </div>
 </>
 ) : error ? (
 <div className="mt-4 flex h-52 flex-col items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] text-center">
 <AlertIcon className="h-5 w-5 text-[#6798ff]" />
 <p className="text-[12.5px] text-[#a7a7a7]">
 Couldn't load this period.
 </p>
 <button
 type="button"
 onClick={handleRetry}
 className="text-[12.5px] font-medium text-[#6798ff] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50"
 >
 Try again
 </button>
 </div>
 ) : (
 <ChartSkeleton />
 )}
 </section>

 {isReady ? (
 <>
 <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
 {tiles.map((tile) => (
 <StatTile key={tile.label} {...tile} />
 ))}
 </div>

 <section className="mt-4 rounded-lg border border-[#313131] bg-[#141414] p-5 sm:p-6">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h2 className="text-[16px] font-medium text-white">
 Most Checked-In
 </h2>
 <p className="mt-0.5 text-[11.5px] text-[#a7a7a7]">
 Ranked by check-ins · {scopeLabel}
 </p>
 </div>

 {habits.length > 5 && (
 <button
 type="button"
 onClick={() => setShowAll((current) => !current)}
 className="shrink-0 text-[12.5px] font-medium text-[#6798ff] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50"
 >
 {showAll ? "Show less" : "Show all"}
 </button>
 )}
 </div>

 {summary.total === 0 && period !== "day" ? (
 <p className="mt-6 text-center text-[12.5px] text-[#a7a7a7]">
 No check-ins for {scopeLabel}.
 </p>
 ) : (
 <div className="mt-2">
 {visibleRanking.map(({ habit, count }) => {
 const countLabel =
 period === "day"
 ? !trackedHabitIds.has(habit.id)
 ? "Not tracked"
 : count > 0
 ? "Done"
 : "Not done"
 : `${count} ${pluralize(
 count,
 "check-in",
 "check-ins",
 )}`;

 return (
 <div key={habit.id} className="py-2.5">
 <div className="flex items-center gap-3">
 <span
 aria-hidden="true"
 className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] text-[18px]"
 style={{ backgroundColor: `${habit.color}1f` }}
 >
 {habit.icon}
 </span>

 <div className="min-w-0 flex-1">
 <p className="truncate text-[13.5px] font-medium text-white">
 {habit.name}
 </p>
 <p className="text-[11px] text-[#a7a7a7]">
 {habit.category}
 </p>
 </div>

 <span className="shrink-0 text-[12px] font-medium text-[#a7a7a7]">
 {countLabel}
 </span>
 </div>

 <div className="ml-12 mt-2 h-1.5 overflow-hidden rounded-full bg-[#1e1e1e]">
 <div
 className="h-full rounded-full"
 style={{
 width: `${(count / maxRanking) * 100}%`,
 backgroundColor: habit.color,
 }}
 />
 </div>
 </div>
 );
 })}
 </div>
 )}
 </section>
 </>
 ) : error ? null : (
 <ContentSkeleton />
 )}

 {overall ? (
 <OverallSection overall={overall} habitCount={habits.length} />
 ) : overallError ? (
 <OverallError
 message={overallError}
 onRetry={handleOverallRetry}
 />
 ) : (
 <OverallSkeleton />
 )}

 <div className="mt-8 text-center">
 <Link
 to="/habits"
 className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6798ff] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50"
 >
 <CalendarIcon className="h-4 w-4" />
 Open the Calendar to mark today
 <ArrowRightIcon className="h-3.5 w-3.5" />
 </Link>
 </div>
 </>
 )}
 </main>
 </div>
 );
};

export default Statistics;
