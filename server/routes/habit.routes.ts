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

  const authUser = req.user as { userId?: number | string } | undefined;
  const userId = Number(authUser?.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
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

export default router;
