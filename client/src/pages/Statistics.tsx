import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  FlameIcon,
  SparkIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
import { ApiError, getHabits } from "../lib/api";
import type { HabitWithCompletions } from "../lib/api";
import {
  WEEKDAY_LABELS,
  buildPeriodSummaries,
  formatDateKey,
  getStatsRange,
} from "../lib/habitStats";
import type { ComparisonBucket, StatsPeriod } from "../lib/habitStats";
import { clearToken, getToken, useAuth } from "../lib/auth";

const PERIODS: { id: StatsPeriod; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "allYear", label: "All Year" },
];

const PERIOD_SCOPE: Record<StatsPeriod, string> = {
  day: "today",
  week: "this week",
  month: "this month",
  year: "this year",
  allYear: "the last 12 months",
};

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

interface SegmentedControlProps {
  value: StatsPeriod;
  onChange: (value: StatsPeriod) => void;
}

const SegmentedControl = ({ value, onChange }: SegmentedControlProps) => (
  <div className="flex w-full rounded-[9px] bg-[#e9e9eb] p-[2px] dark:bg-[#3a3a3c] sm:w-auto">
    {PERIODS.map((item) => {
      const isActive = item.id === value;

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          aria-pressed={isActive}
          className={`flex-1 rounded-[7px] px-2 py-1.5 text-[11.5px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/50 sm:flex-none sm:px-3 ${
            isActive
              ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-[#636366] dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {item.label}
        </button>
      );
    })}
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
      <div className="flex h-44 w-6 shrink-0 flex-col justify-between text-right text-[9px] font-medium leading-none text-slate-400 dark:text-slate-500">
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-44" role="img" aria-label={ariaLabel}>
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute inset-x-0 border-t border-slate-200/80 dark:border-white/[0.07]"
              style={{ top: `${percent}%` }}
            />
          ))}

          {average > 0 && (
            <div
              className="absolute inset-x-0 z-10 border-t border-dashed border-slate-400/80 dark:border-slate-500/80"
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
                          : "bg-slate-200/70 dark:bg-white/[0.08]"
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
                  ? "font-semibold text-slate-900 dark:text-white"
                  : "font-medium text-slate-400 dark:text-slate-500"
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
  todayKey: string;
}

const DayChart = ({ habits, todayKey }: DayChartProps) => (
  <div className="flex gap-2.5">
    <div className="h-44 w-6 shrink-0" aria-hidden="true" />

    <div className="min-w-0 flex-1">
      <div
        className="flex h-44 items-end gap-1.5 sm:gap-2"
        role="img"
        aria-label="Today's habit completion, one bar per habit"
      >
        {habits.map((habit) => {
          const isDone = habit.completions.includes(todayKey);

          return (
            <div
              key={habit.id}
              title={`${habit.name} · ${isDone ? "done" : "not done"} today`}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div
                className={`w-full rounded-t-[3px] ${
                  isDone ? "" : "bg-slate-200/70 dark:bg-white/[0.08]"
                }`}
                style={{
                  height: isDone ? "100%" : "4%",
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
  <article className="rounded-[14px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-[#2c2c2e]">
    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <p className="mt-2 text-[22px] font-semibold leading-none tracking-tight text-slate-900 dark:text-white">
      {value}
    </p>
    <p className="mt-1.5 text-[10.5px] text-slate-400 dark:text-slate-500">
      {sub}
    </p>
  </article>
);

const Statistics = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const range = useMemo(() => getStatsRange(), []);

  const [habits, setHabits] = useState<HabitWithCompletions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [showAll, setShowAll] = useState(false);

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
          formatDateKey(range.from),
          formatDateKey(range.to),
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
            : "Couldn't load your statistics. Please try again.",
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
  }, [isAuthenticated, navigate, range]);

  const summaries = useMemo(
    () => buildPeriodSummaries(habits, range),
    [habits, range],
  );

  if (!isAuthenticated) {
    return null;
  }

  const summary = summaries[period];
  const todayKey = formatDateKey(range.to);
  const isMonthlyScale = period === "year" || period === "allYear";
  const maxBucket = Math.max(...summary.buckets.map(sumBucket), 1);
  const yMax = Math.max(4, Math.ceil(maxBucket / 4) * 4);
  const completionPercent =
    habits.length === 0
      ? 0
      : Math.round((summary.total / habits.length) * 100);

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
    setShowAll(false);
  };

  const footerLabel =
    period === "day"
      ? "Today"
      : isMonthlyScale
        ? "Monthly Average"
        : "Daily Average";
  const footerValue =
    period === "day" ? `${summary.total}` : summary.bucketAverage.toFixed(1);
  const footerUnit =
    period === "day"
      ? `of ${habits.length} ${pluralize(habits.length, "habit", "habits")} done`
      : isMonthlyScale
        ? "check-ins per month"
        : "check-ins per day";

  const tiles: StatTileProps[] = [
    {
      icon: <CheckIcon className="h-3.5 w-3.5" />,
      label: "Check-ins",
      value: `${summary.total}`,
      sub: PERIOD_SCOPE[period],
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
          ? `${summary.total} / ${habits.length}`
          : summary.bucketAverage.toFixed(1),
      sub:
        period === "day"
          ? "completed today"
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
          ? "Today"
          : summary.bestWeekday !== null
            ? WEEKDAY_LABELS[summary.bestWeekday]
            : "—",
      sub: `${summary.bestWeekdayCount} ${pluralize(summary.bestWeekdayCount, "check-in", "check-ins")}`,
    },
  ];

  return (
    <div className="min-h-svh bg-[#f2f2f7] text-slate-900 dark:bg-[#1c1c1e] dark:text-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-12">
        <header>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[32px]">
            Statistics
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            Your habit activity over time — compare days, weeks, months, and
            the whole year at a glance.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded-[14px] bg-rose-50 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-[16px] bg-white px-6 py-16 text-[13px] font-medium text-slate-500 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-[#2c2c2e] dark:text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]" />
            Loading your activity…
          </div>
        ) : habits.length === 0 ? (
          <div className="mt-6 rounded-[16px] bg-white px-6 py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-[#2c2c2e]">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-[12px] bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]">
              <ChartIcon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-[17px] font-semibold text-slate-900 dark:text-white">
              Nothing to chart yet
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Create your first habit and your daily, weekly, monthly, and
              yearly activity will show up here.
            </p>
            <Link
              to="/newhabit"
              className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-[#007AFF] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#0069d9] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007AFF]/30 dark:bg-[#0A84FF] dark:hover:bg-[#3395ff]"
            >
              <SparkIcon className="h-4 w-4" />
              Create your first habit
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-6 rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-[#2c2c2e] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">
                    Habit Activity
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
                    Check-ins per {isMonthlyScale ? "month" : "day"} ·{" "}
                    {PERIOD_SCOPE[period]}
                  </p>
                </div>

                <SegmentedControl
                  value={period}
                  onChange={handlePeriodChange}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                {habits.map((habit) => (
                  <span
                    key={habit.id}
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500 dark:text-slate-400"
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
                  <DayChart habits={habits} todayKey={todayKey} />
                ) : (
                  <PeriodChart
                    buckets={summary.buckets}
                    habits={habits}
                    yMax={yMax}
                    average={summary.bucketAverage}
                    dense={period === "month"}
                    ariaLabel={`Check-ins ${PERIOD_SCOPE[period]}, stacked by habit color`}
                  />
                )}
              </div>

              <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {footerLabel}
                  </p>
                  <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900 dark:text-white">
                    {footerValue}
                    <span className="ml-1.5 text-[12px] font-medium text-slate-400 dark:text-slate-500">
                      {footerUnit}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {period === "day" ? "Completion" : "Total"}
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-slate-900 dark:text-white">
                    {period === "day"
                      ? `${completionPercent}%`
                      : `${summary.total} ${pluralize(summary.total, "check-in", "check-ins")}`}
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {tiles.map((tile) => (
                <StatTile key={tile.label} {...tile} />
              ))}
            </div>

            <section className="mt-4 rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-[#2c2c2e] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">
                    Most Checked-In
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
                    Ranked by check-ins · {PERIOD_SCOPE[period]}
                  </p>
                </div>

                {habits.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAll((current) => !current)}
                    className="shrink-0 text-[12.5px] font-medium text-[#007AFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 dark:text-[#0A84FF]"
                  >
                    {showAll ? "Show less" : "Show all"}
                  </button>
                )}
              </div>

              {summary.total === 0 && period !== "day" ? (
                <p className="mt-6 text-center text-[12.5px] text-slate-400 dark:text-slate-500">
                  No check-ins {PERIOD_SCOPE[period]} yet.
                </p>
              ) : (
                <div className="mt-2">
                  {visibleRanking.map(({ habit, count }) => {
                    const countLabel =
                      period === "day"
                        ? count > 0
                          ? "Done"
                          : "Not done"
                        : `${count} ${pluralize(count, "check-in", "check-ins")}`;

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
                            <p className="truncate text-[13.5px] font-medium text-slate-900 dark:text-white">
                              {habit.name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              {habit.category}
                            </p>
                          </div>

                          <span className="shrink-0 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                            {countLabel}
                          </span>
                        </div>

                        <div className="ml-12 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
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

            <div className="mt-8 text-center">
              <Link
                to="/habits"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#007AFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 dark:text-[#0A84FF]"
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
