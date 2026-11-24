/// <reference path="../src/types/express.d.ts" />
import express, { type Request, type Response } from "express";
import db from "../config/db.ts";

const router = express.Router();

const HABIT_CATEGORIES = [
  "Health & Fitness",
  "Learning & Education",
  "Productivity",
  "Creativity",
  "Mindfulness",
  "Social",
  "Finance",
  "Other",
] as const;

type HabitCategory = (typeof HABIT_CATEGORIES)[number];

const isHabitCategory = (value: unknown): value is HabitCategory =>
  typeof value === "string" &&
  (HABIT_CATEGORIES as readonly string[]).includes(value);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getUserId = (req: Request) => {
  const authUser = req.user as { userId?: number | string } | undefined;
  const userId = Number(authUser?.userId);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

const isValidDateString = (value: string) => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));

  if (year < 2000 || year > 2100) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const daysBetween = (from: string, to: string) =>
  Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() -
      new Date(`${from}T00:00:00Z`).getTime()) /
      86_400_000,
  ) + 1;

interface HabitInput {
  name: string;
  icon: string;
  color: string;
  category: HabitCategory;
  targetPerWeek: number;
}

type HabitInputResult =
  | { ok: true; value: HabitInput }
  | { ok: false; error: string };

const parseHabitInput = (body: Record<string, unknown>): HabitInputResult => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const icon = typeof body.icon === "string" ? body.icon.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "";
  const category = body.category;
  const targetPerWeek =
    typeof body.targetPerWeek === "number" ? body.targetPerWeek : Number.NaN;

  if (!name) {
    return { ok: false, error: "Habit name is required." };
  }

  if (name.length > 100) {
    return {
      ok: false,
      error: "Habit name must be 100 characters or fewer.",
    };
  }

  if (!icon) {
    return { ok: false, error: "Choose a habit icon." };
  }

  if (icon.length > 50) {
    return { ok: false, error: "That habit icon is too long." };
  }

  if (!HEX_COLOR.test(color)) {
    return { ok: false, error: "Choose a valid habit color." };
  }

  if (!isHabitCategory(category)) {
    return { ok: false, error: "Choose a valid category." };
  }

  if (
    !Number.isInteger(targetPerWeek) ||
    targetPerWeek < 1 ||
    targetPerWeek > 7
  ) {
    return {
      ok: false,
      error: "Targets per week must be between 1 and 7.",
    };
  }

  return {
    ok: true,
    value: { name, icon, color, category, targetPerWeek },
  };
};

// List the signed-in user's habits with completions for a date range.
// Pass ?fields=meta to get habit metadata and a check-in count instead of
// the completion history itself.
router.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const today = new Date();
  const defaultTo = formatDate(today);
  const defaultFromDate = new Date(today);
  defaultFromDate.setDate(defaultFromDate.getDate() - 364);
  const defaultFrom = formatDate(defaultFromDate);

  const fromQuery = req.query.from;
  const toQuery = req.query.to;

  if (
    fromQuery !== undefined &&
    (typeof fromQuery !== "string" || !isValidDateString(fromQuery))
  ) {
    return res.status(400).json({ error: "Invalid start date." });
  }

  if (
    toQuery !== undefined &&
    (typeof toQuery !== "string" || !isValidDateString(toQuery))
  ) {
    return res.status(400).json({ error: "Invalid end date." });
  }

  const from = typeof fromQuery === "string" ? fromQuery : defaultFrom;
  const to = typeof toQuery === "string" ? toQuery : defaultTo;

  if (from > to) {
    return res
      .status(400)
      .json({ error: "The start date must be before the end date." });
  }

  if (daysBetween(from, to) > 371) {
    return res
      .status(400)
      .json({ error: "The date range must be 371 days or fewer." });
  }

  const fieldsQuery = req.query.fields;

  if (
    fieldsQuery !== undefined &&
    (typeof fieldsQuery !== "string" ||
      (fieldsQuery !== "meta" && fieldsQuery !== "full"))
  ) {
    return res
      .status(400)
      .json({ error: 'fields must be either "meta" or "full".' });
  }

  const metaOnly = fieldsQuery === "meta";

  try {
    if (metaOnly) {
      // ?fields=meta: habit metadata plus one aggregated check-in count.
      // One query instead of two, and a single integer per habit instead of
      // up to 371 date strings — enough for a list that never draws the
      // heatmap.
      const habitsResult = await db.query(
        `SELECT h.id, h.user_id, h.name, h.icon, h.color, h.category,
                h.target_per_week, h.created_at, h.updated_at,
                (
                  SELECT count(*)
                  FROM habit_completions c
                  WHERE c.habit_id = h.id
                    AND c.completed_on BETWEEN $2::date AND $3::date
                )::int AS completed_days
         FROM habits h
         WHERE h.user_id = $1
         ORDER BY h.sort_order ASC, h.id ASC`,
        [userId, from, to],
      );

      return res.json({ habits: habitsResult.rows, from, to });
    }

    const habitsResult = await db.query(
      `SELECT id, user_id, name, icon, color, category, target_per_week, created_at, updated_at
       FROM habits
       WHERE user_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [userId],
    );

    if (habitsResult.rows.length === 0) {
      return res.json({ habits: [], from, to });
    }

    const habitIds = habitsResult.rows.map((habit) => habit.id);

    const completionsResult = await db.query(
      `SELECT habit_id, to_char(completed_on, 'YYYY-MM-DD') AS completed_on
       FROM habit_completions
       WHERE habit_id = ANY($1::int[])
         AND completed_on BETWEEN $2::date AND $3::date
       ORDER BY completed_on ASC`,
      [habitIds, from, to],
    );

    const completionsByHabit = new Map<number, string[]>();

    for (const row of completionsResult.rows) {
      const list = completionsByHabit.get(row.habit_id) ?? [];
      list.push(row.completed_on);
      completionsByHabit.set(row.habit_id, list);
    }

    const habits = habitsResult.rows.map((habit) => ({
      ...habit,
      completions: completionsByHabit.get(habit.id) ?? [],
    }));

    return res.json({ habits, from, to });
  } catch (error) {
    console.error("Failed to load habits:", error);
    return res
      .status(500)
      .json({ error: "Couldn't load your habits. Please try again." });
  }
});

const STATS_PERIODS = ["day", "week", "month", "year"] as const;

type StatsPeriodKey = (typeof STATS_PERIODS)[number];

const isStatsPeriod = (value: unknown): value is StatsPeriodKey =>
  typeof value === "string" &&
  (STATS_PERIODS as readonly string[]).includes(value);

// Aggregated stats span a lifetime range (unlike raw history, capped at 371
// days), so the cap is generous: 20 years of days.
const STATS_MAX_DAYS = 7305;

// The bucket key a day falls into, for the requested period. Weeks start on
// Sunday to match the client's calendar view.
const bucketKeySql = (column: string) =>
  `CASE $4::text
     WHEN 'day' THEN to_char(${column}, 'YYYY-MM-DD')
     WHEN 'week' THEN to_char(${column} - (extract(dow FROM ${column}))::int, 'YYYY-MM-DD')
     WHEN 'month' THEN to_char(${column}, 'YYYY-MM')
     ELSE to_char(${column}, 'YYYY')
   END`;

// One statement answers the whole Statistics "Overall" section.
//
// The client used to build this view from N parallel full-range
// /api/habits requests merged in the browser — a growing amount of raw
// completion history for a user active since 2020. Here the database does a
// single GROUP BY pass: per-day counts, gaps-and-islands streak runs, the
// summary, and the period buckets are all computed in SQL and returned as one
// JSON row, so the browser downloads aggregates instead of every date string.
const STATS_SQL = `
  WITH habit_rows AS (
    SELECT id,
           target_per_week::float8 AS target_per_week,
           created_at::date AS created_date
    FROM habits
    WHERE user_id = $1
  ),
  daily AS (
    SELECT c.completed_on AS day,
           count(*)::int AS completions,
           (count(DISTINCT c.habit_id)
             FILTER (WHERE h.created_date <= c.completed_on))::int AS eligible_done
    FROM habit_completions c
    JOIN habit_rows h ON h.id = c.habit_id
    WHERE c.completed_on BETWEEN $2::date AND $3::date
    GROUP BY c.completed_on
  ),
  days AS (
    SELECT d.day,
           d.completions,
           d.eligible_done,
           -- How many habits were already created on that day: a day counts as
           -- perfect only when every one of them has a check-in.
           (SELECT count(*)
            FROM habit_rows h
            WHERE h.created_date <= d.day)::int AS habit_total
    FROM daily d
  ),
  -- Gaps-and-islands: consecutive days share (day - row_number) as their run.
  run_keys AS (
    SELECT day, day - (row_number() OVER (ORDER BY day))::int AS run_key
    FROM days
  ),
  run_lengths AS (
    SELECT run_key, count(*)::int AS run_length, max(day) AS end_day
    FROM run_keys
    GROUP BY run_key
  ),
  totals AS (
    SELECT COALESCE(sum(completions), 0)::int AS total_check_ins,
           count(*)::int AS active_days
    FROM days
  ),
  expected AS (
    -- Mirrors the client: target_per_week / 7 for every day since the habit
    -- was created (at least one day), summed across all of the user's habits.
    SELECT COALESCE(
             sum(target_per_week / 7.0
                 * GREATEST(1, $3::date - created_date + 1)),
             0
           )::float8 AS expected_check_ins
    FROM habit_rows
  ),
  summary AS (
    SELECT t.total_check_ins,
           t.active_days,
           (SELECT count(*)
            FROM days
            WHERE habit_total >= 1 AND eligible_done = habit_total)::int AS perfect_days,
           -- Current streak: only the last run counts, and only when it reaches
           -- today (or yesterday, so an unfinished today doesn't break it).
           COALESCE(
             (SELECT CASE WHEN rl.end_day >= $3::date - 1
                          THEN rl.run_length
                          ELSE 0 END
              FROM run_lengths rl
              ORDER BY rl.end_day DESC
              LIMIT 1),
             0
           )::int AS current_streak,
           COALESCE((SELECT max(run_length) FROM run_lengths), 0)::int AS longest_streak,
           CASE
             WHEN e.expected_check_ins <= 0 THEN 0
             ELSE LEAST(
               100,
               round((t.total_check_ins / e.expected_check_ins) * 100)
             )::int
           END AS completion_rate,
           to_char(
             -- Earliest check-in or habit creation inside the range; LEAST
             -- skips NULLs, and the range end covers an account with no habits.
             COALESCE(
               LEAST((SELECT min(day) FROM days),
                     (SELECT min(created_date) FROM habit_rows)),
               $3::date
             ),
             'YYYY-MM-DD'
           ) AS tracking_since
    FROM totals t CROSS JOIN expected e
  ),
  daily_buckets AS (
    SELECT ${bucketKeySql("day")} AS key,
           sum(completions)::int AS completions
    FROM days
    GROUP BY 1
  ),
  -- Every bucket in the range, including empty ones, so a chart can plot gaps.
  series AS (
    SELECT generate_series(
      CASE $4::text
        WHEN 'day' THEN $2::date
        WHEN 'week' THEN $2::date - (extract(dow FROM $2::date))::int
        WHEN 'month' THEN date_trunc('month', $2::date)::date
        ELSE date_trunc('year', $2::date)::date
      END,
      CASE $4::text
        WHEN 'day' THEN $3::date
        WHEN 'week' THEN $3::date - (extract(dow FROM $3::date))::int
        WHEN 'month' THEN date_trunc('month', $3::date)::date
        ELSE date_trunc('year', $3::date)::date
      END,
      CASE $4::text
        WHEN 'day' THEN INTERVAL '1 day'
        WHEN 'week' THEN INTERVAL '7 days'
        WHEN 'month' THEN INTERVAL '1 month'
        ELSE INTERVAL '1 year'
      END
    )::date AS day
  ),
  buckets AS (
    SELECT s.key, COALESCE(d.completions, 0)::int AS completions
    FROM (SELECT ${bucketKeySql("day")} AS key FROM series) s
    LEFT JOIN daily_buckets d ON d.key = s.key
  )
  SELECT json_build_object(
           'summary', (SELECT to_jsonb(sm) FROM summary sm),
           'buckets',
           COALESCE((SELECT json_agg(to_jsonb(b) ORDER BY b.key)
                     FROM buckets b), '[]'::json)
         ) AS result
`;

// Aggregated statistics for a date range: one round trip instead of N
// full-history downloads. period controls the bucket granularity of the
// returned `buckets` array; `summary` always describes the whole range.
router.get("/stats", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const fromQuery = req.query.from;
  const toQuery = req.query.to;
  const periodQuery = req.query.period;

  if (typeof fromQuery !== "string" || !isValidDateString(fromQuery)) {
    return res.status(400).json({ error: "Invalid start date." });
  }

  if (typeof toQuery !== "string" || !isValidDateString(toQuery)) {
    return res.status(400).json({ error: "Invalid end date." });
  }

  if (!isStatsPeriod(periodQuery)) {
    return res
      .status(400)
      .json({ error: 'period must be "day", "week", "month", or "year".' });
  }

  const from = fromQuery;
  const to = toQuery;

  if (from > to) {
    return res
      .status(400)
      .json({ error: "The start date must be before the end date." });
  }

  if (daysBetween(from, to) > STATS_MAX_DAYS) {
    return res
      .status(400)
      .json({ error: `The date range must be ${STATS_MAX_DAYS} days or fewer.` });
  }

  try {
    const result = await db.query(STATS_SQL, [userId, from, to, periodQuery]);
    const payload = result.rows[0] as {
      result: {
        summary: Record<string, unknown>;
        buckets: { key: string; completions: number }[];
      };
    };

    return res.json({
      from,
      to,
      period: periodQuery,
      summary: payload.result.summary,
      buckets: payload.result.buckets,
    });
  } catch (error) {
    console.error("Failed to load habit stats:", error);
    return res
      .status(500)
      .json({ error: "Couldn't load your statistics. Please try again." });
  }
});

// Add Habit
router.post("/newhabit", async (req: Request, res: Response) => {
  const parsed = parseHabitInput((req.body ?? {}) as Record<string, unknown>);

  if (parsed.ok === false) {
    return res.status(400).json({ error: parsed.error });
  }

  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const { name, icon, color, category, targetPerWeek } = parsed.value;

  try {
    const result = await db.query(
      `INSERT INTO habits (user_id, name, icon, color, category, target_per_week, sort_order)
       VALUES (
         $1, $2, $3, $4, $5, $6,
         COALESCE((SELECT MIN(sort_order) - 1 FROM habits WHERE user_id = $1), 0)
       )
       RETURNING id, user_id, name, icon, color, category, target_per_week, created_at, updated_at`,
      [userId, name, icon, color, category, targetPerWeek],
    );

    return res.status(201).json({
      message: "Habit added successfully.",
      habit: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to add habit:", error);
    return res
      .status(500)
      .json({ error: "Couldn't add the habit. Please try again." });
  }
});

// Persist the display order of the signed-in user's habits.
router.put("/order", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const habitIds = req.body?.habitIds;

  if (
    !Array.isArray(habitIds) ||
    habitIds.length === 0 ||
    habitIds.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    return res
      .status(400)
      .json({ error: "Provide a valid list of habit ids." });
  }

  if (new Set(habitIds).size !== habitIds.length) {
    return res
      .status(400)
      .json({ error: "Habit ids must not contain duplicates." });
  }

  try {
    const existing = await db.query(
      "SELECT id FROM habits WHERE user_id = $1",
      [userId],
    );

    const existingIds = new Set(existing.rows.map((row) => row.id));

    if (
      existingIds.size !== habitIds.length ||
      habitIds.some((id) => !existingIds.has(id))
    ) {
      return res.status(400).json({
        error: "Habit order must include exactly all of your habits.",
      });
    }

    await db.query(
      `UPDATE habits AS h
       SET sort_order = ordered.position,
           updated_at = CURRENT_TIMESTAMP
       FROM (
         SELECT id, ordinality - 1 AS position
         FROM unnest($1::int[]) WITH ORDINALITY AS t(id, ordinality)
       ) AS ordered
       WHERE h.id = ordered.id AND h.user_id = $2`,
      [habitIds, userId],
    );

    return res.json({ message: "Habit order updated." });
  } catch (error) {
    console.error("Failed to update habit order:", error);
    return res
      .status(500)
      .json({ error: "Couldn't save the new order. Please try again." });
  }
});

// Delete a habit and its completions.
router.delete("/:habitId", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const habitId = Number(req.params.habitId);

  if (!Number.isInteger(habitId) || habitId <= 0) {
    return res.status(400).json({ error: "Invalid habit id." });
  }

  try {
    const result = await db.query(
      "DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id",
      [habitId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Habit not found." });
    }

    return res.json({
      message: "Habit deleted successfully.",
      habitId,
    });
  } catch (error) {
    console.error("Failed to delete habit:", error);
    return res
      .status(500)
      .json({ error: "Couldn't delete the habit. Please try again." });
  }
});

// Update a habit's details.
router.patch("/:habitId", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const habitId = Number(req.params.habitId);

  if (!Number.isInteger(habitId) || habitId <= 0) {
    return res.status(400).json({ error: "Invalid habit id." });
  }

  const parsed = parseHabitInput((req.body ?? {}) as Record<string, unknown>);

  if (parsed.ok === false) {
    return res.status(400).json({ error: parsed.error });
  }

  const { name, icon, color, category, targetPerWeek } = parsed.value;

  try {
    const result = await db.query(
      `UPDATE habits
       SET name = $1,
           icon = $2,
           color = $3,
           category = $4,
           target_per_week = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING id, user_id, name, icon, color, category, target_per_week, created_at, updated_at`,
      [name, icon, color, category, targetPerWeek, habitId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Habit not found." });
    }

    return res.json({
      message: "Habit updated successfully.",
      habit: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update habit:", error);
    return res
      .status(500)
      .json({ error: "Couldn't update the habit. Please try again." });
  }
});

// Toggle a habit completion for one day.
router.post("/:habitId/toggle", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const habitId = Number(req.params.habitId);

  if (!Number.isInteger(habitId) || habitId <= 0) {
    return res.status(400).json({ error: "Invalid habit id." });
  }

  const date = typeof req.body?.date === "string" ? req.body.date.trim() : "";

  if (!isValidDateString(date)) {
    return res
      .status(400)
      .json({ error: "Use a valid date in YYYY-MM-DD format." });
  }

  try {
    const outcome = await db.transaction(async (client) => {
      // Ownership check and lock in one round trip. Taking the habit row's
      // lock first means a second, concurrent tap waits here instead of
      // reading a stale "is this day completed?" answer and then writing on
      // top of the first tap's result.
      const habitResult = await client.query(
        "SELECT id FROM habits WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [habitId, userId],
      );

      if (habitResult.rowCount === 0) {
        return "missing" as const;
      }

      // The existence check and the write collapse into a single statement:
      // remove the day when it is stored, insert it otherwise. `added` reads
      // `removed`, so only one of the two branches can run.
      const toggleResult = await client.query(
        `WITH removed AS (
           DELETE FROM habit_completions
           WHERE habit_id = $1 AND completed_on = $2::date
           RETURNING id
         ),
         added AS (
           INSERT INTO habit_completions (habit_id, completed_on)
           SELECT $1, $2::date
           WHERE NOT EXISTS (SELECT 1 FROM removed)
           ON CONFLICT (habit_id, completed_on) DO NOTHING
           RETURNING id
         )
         SELECT EXISTS (SELECT 1 FROM removed) AS removed`,
        [habitId, date],
      );

      // With the lock held nothing else can touch these rows, so a miss on
      // the delete means the insert (or a row that was already there) put the
      // day back — either way it is completed now.
      return toggleResult.rows[0].removed
        ? ("removed" as const)
        : ("added" as const);
    });

    if (outcome === "missing") {
      return res.status(404).json({ error: "Habit not found." });
    }

    return res.json({ completed: outcome === "added", date });
  } catch (error) {
    console.error("Failed to toggle habit completion:", error);
    return res
      .status(500)
      .json({ error: "Couldn't update that day. Please try again." });
  }
});

export default router;
