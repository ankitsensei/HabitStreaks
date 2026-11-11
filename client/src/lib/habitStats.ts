import type { HabitWithCompletions } from "./api";

export const MONTHS = [
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
] as const;

export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const MONTHS_SHOWN = 12;
export const WEEKS_SHOWN = 26;

const DAY_MS = 86400000;

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getStartOfWeek = (date: Date) => addDays(date, -date.getDay());

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (key: string) => new Date(`${key}T00:00:00`);

// The statistics window covers the last 12 calendar months, starting from the
// first day of the oldest month, so monthly charts always have full data.
export interface StatsRange {
  from: Date;
  to: Date;
}

export const getStatsRange = (): StatsRange => {
  const to = startOfDay(new Date());
  const from = new Date(
    to.getFullYear(),
    to.getMonth() - (MONTHS_SHOWN - 1),
    1,
  );

  return { from, to };
};

export interface Streaks {
  current: number;
  longest: number;
}

// Current streak counts consecutive days ending today (or yesterday, so an
// unfinished today doesn't break a streak). Longest streak scans the window.
export const computeStreaks = (
  completions: string[],
  todayKey: string,
): Streaks => {
  const completed = new Set(completions);

  let current = 0;
  let cursor = completed.has(todayKey)
    ? parseDateKey(todayKey)
    : addDays(parseDateKey(todayKey), -1);

  while (completed.has(formatDateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const sorted = Array.from(completed).sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const key of sorted) {
    run =
      previous !== null &&
      formatDateKey(addDays(parseDateKey(previous), 1)) === key
        ? run + 1
        : 1;
    longest = Math.max(longest, run);
    previous = key;
  }

  return { current, longest };
};

export interface MonthlyCounts {
  counts: number[];
  labels: string[];
  titles: string[];
}

export const computeMonthlyCounts = (
  completions: string[],
  range: StatsRange,
): MonthlyCounts => {
  const counts = new Array<number>(MONTHS_SHOWN).fill(0);

  for (const key of completions) {
    const date = parseDateKey(key);
    const monthsSinceStart =
      (date.getFullYear() - range.from.getFullYear()) * 12 +
      (date.getMonth() - range.from.getMonth());

    if (monthsSinceStart >= 0 && monthsSinceStart < MONTHS_SHOWN) {
      counts[monthsSinceStart] += 1;
    }
  }

  const labels: string[] = [];
  const titles: string[] = [];

  for (let index = 0; index < MONTHS_SHOWN; index += 1) {
    const month = new Date(
      range.from.getFullYear(),
      range.from.getMonth() + index,
      1,
    );

    labels.push(MONTHS[month.getMonth()]);
    titles.push(`${MONTHS[month.getMonth()]} ${month.getFullYear()}`);
  }

  return { counts, labels, titles };
};

export const computeWeekdayCounts = (completions: string[]) => {
  const counts = new Array<number>(7).fill(0);

  for (const key of completions) {
    counts[parseDateKey(key).getDay()] += 1;
  }

  return counts;
};

// Index of the highest non-zero count, or -1 when everything is zero.
export const bestIndex = (counts: number[]) => {
  let best = -1;

  counts.forEach((count, index) => {
    if (count > 0 && (best === -1 || count > counts[best])) {
      best = index;
    }
  });

  return best;
};

// One bucket in a comparison chart (a day or a month). `counts` is aligned
// with the habits array so each habit can be drawn in its own color.
export interface ComparisonBucket {
  key: string;
  label: string;
  title: string;
  counts: number[];
  isFuture: boolean;
  isToday: boolean;
}

export interface ComparisonCharts {
  weekly: ComparisonBucket[];
  monthly: ComparisonBucket[];
  yearly: ComparisonBucket[];
}

// Builds the three all-habits comparison charts: this week (Sun-Sat), this
// month (day 1 to the end of the month), and this year (Jan-Dec).
export const buildComparisonCharts = (
  habits: HabitWithCompletions[],
  today: Date,
): ComparisonCharts => {
  const todayKey = formatDateKey(today);
  const todayMonth = todayKey.slice(0, 7);
  const completionSets = habits.map((habit) => new Set(habit.completions));

  const buildDayBucket = (date: Date, label: string): ComparisonBucket => {
    const key = formatDateKey(date);

    return {
      key,
      label,
      title: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      counts: completionSets.map((completed) => (completed.has(key) ? 1 : 0)),
      isFuture: key > todayKey,
      isToday: key === todayKey,
    };
  };

  const weekStart = getStartOfWeek(today);
  const weekly = WEEKDAY_LABELS.map((label, index) =>
    buildDayBucket(addDays(weekStart, index), label),
  );

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const monthly = Array.from({ length: daysInMonth }, (_, index) =>
    buildDayBucket(addDays(monthStart, index), String(index + 1)),
  );

  const yearly = MONTHS.map((label, index) => {
    const monthKey = `${today.getFullYear()}-${String(index + 1).padStart(2, "0")}`;

    return {
      key: monthKey,
      label,
      title: `${label} ${today.getFullYear()}`,
      counts: habits.map(
        (habit) =>
          habit.completions.filter((completion) =>
            completion.startsWith(monthKey),
          ).length,
      ),
      isFuture: monthKey > todayMonth,
      isToday: monthKey === todayMonth,
    };
  });

  return { weekly, monthly, yearly };
};

// --- Screen Time-style period summaries ------------------------------------

export type StatsPeriod = "day" | "week" | "month" | "year" | "allYear";

export interface PeriodSummary {
  period: StatsPeriod;
  buckets: ComparisonBucket[];
  total: number;
  habitCounts: number[];
  elapsedDays: number;
  perfectDays: number;
  bestWeekday: number | null;
  bestWeekdayCount: number;
  dailyAverage: number;
  bucketAverage: number;
  averageUnit: "day" | "month";
}

const getPeriodStart = (period: StatsPeriod, range: StatsRange): Date => {
  const today = range.to;

  switch (period) {
    case "day":
      return today;
    case "week":
      return getStartOfWeek(today);
    case "month":
      return new Date(today.getFullYear(), today.getMonth(), 1);
    case "year":
      return new Date(today.getFullYear(), 0, 1);
    case "allYear":
      return range.from;
  }
};

// Monthly buckets across the whole fetched window (trailing 12 months).
const buildRollingMonthBuckets = (
  habits: HabitWithCompletions[],
  range: StatsRange,
): ComparisonBucket[] => {
  const todayMonth = formatDateKey(range.to).slice(0, 7);

  return Array.from({ length: MONTHS_SHOWN }, (_, index) => {
    const month = new Date(
      range.from.getFullYear(),
      range.from.getMonth() + index,
      1,
    );
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

    return {
      key: monthKey,
      label: MONTHS[month.getMonth()],
      title: `${MONTHS[month.getMonth()]} ${month.getFullYear()}`,
      counts: habits.map(
        (habit) =>
          habit.completions.filter((completion) =>
            completion.startsWith(monthKey),
          ).length,
      ),
      isFuture: monthKey > todayMonth,
      isToday: monthKey === todayMonth,
    };
  });
};

export const buildPeriodSummaries = (
  habits: HabitWithCompletions[],
  range: StatsRange,
): Record<StatsPeriod, PeriodSummary> => {
  const todayKey = formatDateKey(range.to);
  const completionSets = habits.map((habit) => new Set(habit.completions));
  const createdDates = habits.map((habit) =>
    startOfDay(new Date(habit.created_at)),
  );
  const comparison = buildComparisonCharts(habits, range.to);
  const rollingMonths = buildRollingMonthBuckets(habits, range);

  const build = (period: StatsPeriod): PeriodSummary => {
    const start = getPeriodStart(period, range);
    const startKey = formatDateKey(start);
    const elapsedDays =
      Math.round((range.to.getTime() - start.getTime()) / DAY_MS) + 1;

    const habitCounts = habits.map(
      (habit) =>
        habit.completions.filter(
          (completion) =>
            completion >= startKey && completion <= todayKey,
        ).length,
    );
    const total = habitCounts.reduce((sum, count) => sum + count, 0);

    let perfectDays = 0;

    for (let offset = 0; offset < elapsedDays; offset += 1) {
      const date = addDays(start, offset);
      const key = formatDateKey(date);
      const hasEligibleHabit = createdDates.some(
        (created) => created <= date,
      );

      if (
        hasEligibleHabit &&
        habits.every(
          (_, index) =>
            createdDates[index] > date || completionSets[index].has(key),
        )
      ) {
        perfectDays += 1;
      }
    }

    const weekdayCounts = new Array<number>(7).fill(0);

    habits.forEach((habit) => {
      for (const completion of habit.completions) {
        if (completion >= startKey && completion <= todayKey) {
          weekdayCounts[parseDateKey(completion).getDay()] += 1;
        }
      }
    });

    const bestWeekday = bestIndex(weekdayCounts);
    const dailyAverage = total / elapsedDays;
    const isMonthlyScale = period === "year" || period === "allYear";
    const monthsElapsed =
      period === "year" ? range.to.getMonth() + 1 : MONTHS_SHOWN;

    return {
      period,
      buckets:
        period === "week"
          ? comparison.weekly
          : period === "month"
            ? comparison.monthly
            : period === "year"
              ? comparison.yearly
              : period === "allYear"
                ? rollingMonths
                : [],
      total,
      habitCounts,
      elapsedDays,
      perfectDays,
      bestWeekday,
      bestWeekdayCount:
        bestWeekday === -1 ? 0 : weekdayCounts[bestWeekday],
      dailyAverage,
      bucketAverage: isMonthlyScale ? total / monthsElapsed : dailyAverage,
      averageUnit: isMonthlyScale ? "month" : "day",
    };
  };

  return {
    day: build("day"),
    week: build("week"),
    month: build("month"),
    year: build("year"),
    allYear: build("allYear"),
  };
};

// Check-ins per week for the last WEEKS_SHOWN weeks, oldest week first.
// Dates are compared with day-level rounding so daylight saving shifts
// can't nudge a day into the wrong week.
const computeWeeklyCounts = (
  completions: string[],
  currentWeekStart: Date,
): number[] => {
  const counts = new Array<number>(WEEKS_SHOWN).fill(0);
  const weekStartMs = currentWeekStart.getTime();

  for (const key of completions) {
    const date = parseDateKey(key);
    const weeksAgo = Math.floor(
      Math.round((weekStartMs - getStartOfWeek(date).getTime()) / DAY_MS) / 7,
    );
    const index = WEEKS_SHOWN - 1 - weeksAgo;

    if (index >= 0 && index < WEEKS_SHOWN) {
      counts[index] += 1;
    }
  }

  return counts;
};

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  completionRate: number;
  thisWeek: number;
  weeklyCounts: number[];
  weeksOnTarget: number;
  bestWeekday: number | null;
  bestWeekdayCount: number;
}

export const computeHabitStats = (
  habit: HabitWithCompletions,
  range: StatsRange,
  todayKey: string,
): HabitStats => {
  const { current, longest } = computeStreaks(habit.completions, todayKey);
  const currentWeekStart = getStartOfWeek(range.to);
  const weekStartKey = formatDateKey(currentWeekStart);
  const weeklyCounts = computeWeeklyCounts(habit.completions, currentWeekStart);

  let thisWeek = 0;
  const weekdayCounts = new Array<number>(7).fill(0);

  for (const key of habit.completions) {
    if (key >= weekStartKey) {
      thisWeek += 1;
    }

    weekdayCounts[parseDateKey(key).getDay()] += 1;
  }

  let bestWeekday: number | null = null;
  let bestWeekdayCount = 0;

  weekdayCounts.forEach((count, index) => {
    if (count > bestWeekdayCount) {
      bestWeekday = index;
      bestWeekdayCount = count;
    }
  });

  const windowDays =
    Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS) + 1;
  const created = startOfDay(new Date(habit.created_at));
  const daysActive = Math.min(
    windowDays,
    Math.max(
      1,
      Math.round((range.to.getTime() - created.getTime()) / DAY_MS) + 1,
    ),
  );
  const expectedCheckIns = (habit.target_per_week / 7) * daysActive;
  const completionRate =
    expectedCheckIns <= 0
      ? 0
      : Math.min(
          100,
          Math.round((habit.completions.length / expectedCheckIns) * 100),
        );

  return {
    currentStreak: current,
    longestStreak: longest,
    totalDays: habit.completions.length,
    completionRate,
    thisWeek,
    weeklyCounts,
    weeksOnTarget: weeklyCounts.filter(
      (count) => count >= habit.target_per_week,
    ).length,
    bestWeekday,
    bestWeekdayCount,
  };
};

export interface HabitEntry {
  habit: HabitWithCompletions;
  stats: HabitStats;
}

export interface StatisticsData {
  today: Date;
  todayKey: string;
  entries: HabitEntry[];
  totalCheckIns: number;
  thisWeekTotal: number;
  currentStreak: number;
  longestStreak: number;
  last30: number;
  previous30: number;
  monthly: MonthlyCounts;
  weekdayCounts: number[];
  charts: ComparisonCharts;
}

export const buildStatistics = (
  habits: HabitWithCompletions[],
  range: StatsRange,
): StatisticsData => {
  const todayKey = formatDateKey(range.to);
  const weekStartKey = formatDateKey(getStartOfWeek(range.to));

  const entries = habits.map((habit) => ({
    habit,
    stats: computeHabitStats(habit, range, todayKey),
  }));

  const allCompletions = habits.flatMap((habit) => habit.completions);
  const overallStreaks = computeStreaks(allCompletions, todayKey);

  let thisWeekTotal = 0;
  const last30Start = formatDateKey(addDays(range.to, -29));
  const previous30Start = formatDateKey(addDays(range.to, -59));
  let last30 = 0;
  let previous30 = 0;

  for (const key of allCompletions) {
    if (key >= weekStartKey) {
      thisWeekTotal += 1;
    }

    if (key >= last30Start) {
      last30 += 1;
    } else if (key >= previous30Start) {
      previous30 += 1;
    }
  }

  return {
    today: range.to,
    todayKey,
    entries,
    totalCheckIns: allCompletions.length,
    thisWeekTotal,
    currentStreak: overallStreaks.current,
    longestStreak: overallStreaks.longest,
    last30,
    previous30,
    monthly: computeMonthlyCounts(allCompletions, range),
    weekdayCounts: computeWeekdayCounts(allCompletions),
    charts: buildComparisonCharts(habits, range.to),
  };
};
