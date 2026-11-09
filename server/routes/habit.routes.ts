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
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
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

// List the signed-in user's habits with completions for a date range.
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

  try {
    const habitsResult = await db.query(
      `SELECT id, user_id, name, icon, color, category, target_per_week, created_at, updated_at
       FROM habits
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
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

// Add Habit
router.post("/newhabit", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const icon = typeof body.icon === "string" ? body.icon.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "";
  const category = body.category;
  const targetPerWeek =
    typeof body.targetPerWeek === "number" ? body.targetPerWeek : Number.NaN;

  if (!name) {
    return res.status(400).json({ error: "Habit name is required." });
  }

  if (name.length > 100) {
    return res
      .status(400)
      .json({ error: "Habit name must be 100 characters or fewer." });
  }

  if (!icon) {
    return res.status(400).json({ error: "Choose a habit icon." });
  }

  if (icon.length > 50) {
    return res.status(400).json({ error: "That habit icon is too long." });
  }

  if (!HEX_COLOR.test(color)) {
    return res.status(400).json({ error: "Choose a valid habit color." });
  }

  if (!isHabitCategory(category)) {
    return res.status(400).json({ error: "Choose a valid category." });
  }

  if (
    !Number.isInteger(targetPerWeek) ||
    targetPerWeek < 1 ||
    targetPerWeek > 7
  ) {
    return res
      .status(400)
      .json({ error: "Targets per week must be between 1 and 7." });
  }

  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const result = await db.query(
      `INSERT INTO habits (user_id, name, icon, color, category, target_per_week)
       VALUES ($1, $2, $3, $4, $5, $6)
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
    const habitResult = await db.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId],
    );

    if (habitResult.rowCount === 0) {
      return res.status(404).json({ error: "Habit not found." });
    }

    const existing = await db.query(
      "SELECT id FROM habit_completions WHERE habit_id = $1 AND completed_on = $2::date",
      [habitId, date],
    );

    if ((existing.rowCount ?? 0) > 0) {
      await db.query(
        "DELETE FROM habit_completions WHERE habit_id = $1 AND completed_on = $2::date",
        [habitId, date],
      );

      return res.json({ completed: false, date });
    }

    await db.query(
      `INSERT INTO habit_completions (habit_id, completed_on)
       VALUES ($1, $2::date)
       ON CONFLICT (habit_id, completed_on) DO NOTHING`,
      [habitId, date],
    );

    return res.json({ completed: true, date });
  } catch (error) {
    console.error("Failed to toggle habit completion:", error);
    return res
      .status(500)
      .json({ error: "Couldn't update that day. Please try again." });
  }
});

export default router;
