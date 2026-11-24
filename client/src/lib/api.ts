const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * True for the rejection a cancelled fetch produces. Aborting is a deliberate
 * act by the caller, not a failure, so it is checked before any ApiError
 * handling — both here and in the pages that consume these requests.
 */
export const isAbortError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "name" in err &&
  (err as { name: unknown }).name === "AbortError";

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch (err) {
    // An aborted request is a cancellation, not a connectivity problem.
    if (isAbortError(err)) {
      throw err;
    }

    throw new ApiError(
      "We couldn't reach the server. Check your connection and try again.",
      0,
    );
  }

  const data = (await response.json().catch((err: unknown) => {
    // Aborted while the body was streaming in: surface it as an AbortError
    // instead of downgrading it to a silent null payload.
    if (isAbortError(err)) {
      throw err;
    }

    return null;
  })) as (T & { error?: string }) | null;

  if (!response.ok) {
    throw new ApiError(
      data?.error ?? "Something went wrong. Please try again.",
      response.status,
    );
  }

  return data as T;
}

async function post<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function get<T>(
  path: string,
  token?: string,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(path, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });
}

async function patch<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function del<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function put<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export interface RegisterResult {
  message: string;
}

export interface VerifyOtpResult {
  message: string;
  token: string;
}

export interface ResendOtpResult {
  message: string;
}

export interface LoginResult {
  message: string;
  token: string;
}

export const registerUser = (email: string, password: string) =>
  post<RegisterResult>("/api/auth/register", { email, password });

export const verifyOtp = (email: string, otp: string) =>
  post<VerifyOtpResult>("/api/auth/verify-otp", { email, otp });

export const resendOtp = (email: string) =>
  post<ResendOtpResult>("/api/auth/resend-otp", { email });

export const loginUser = (email: string, password: string) =>
  post<LoginResult>("/api/auth/login", { email, password });

export interface GoogleAuthResult {
  message: string;
  token: string;
}

// Exchanges the Auth0 authorization code for an app session token.
export const googleAuth = (code: string, redirectUri: string) =>
  post<GoogleAuthResult>("/api/auth/google", { code, redirectUri });

export const HABIT_CATEGORIES = [
  "Health & Fitness",
  "Learning & Education",
  "Productivity",
  "Creativity",
  "Mindfulness",
  "Social",
  "Finance",
  "Other",
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export interface NewHabitInput {
  name: string;
  icon: string;
  color: string;
  category: HabitCategory;
  targetPerWeek: number;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  icon: string;
  color: string;
  category: HabitCategory;
  target_per_week: number;
  created_at: string;
  updated_at: string;
}

export interface AddHabitResult {
  message: string;
  habit: Habit;
}

export const addHabit = (token: string, habit: NewHabitInput) =>
  post<AddHabitResult>("/api/habits/newhabit", habit, token);

export interface UpdateHabitResult {
  message: string;
  habit: Habit;
}

export const updateHabit = (
  token: string,
  habitId: number,
  habit: NewHabitInput,
) => patch<UpdateHabitResult>(`/api/habits/${habitId}`, habit, token);

export interface DeleteHabitResult {
  message: string;
  habitId: number;
}

export const deleteHabit = (token: string, habitId: number) =>
  del<DeleteHabitResult>(`/api/habits/${habitId}`, token);

export interface ReorderHabitsResult {
  message: string;
}

export const reorderHabits = (token: string, habitIds: number[]) =>
  put<ReorderHabitsResult>("/api/habits/order", { habitIds }, token);

export interface HabitWithCompletions extends Habit {
  completions: string[];
}

/**
 * Habit row from `?fields=meta`: no completion dates, just how many check-ins
 * fall inside the requested range.
 */
export interface HabitMeta extends Habit {
  completed_days: number;
}

export interface HabitsResult {
  habits: HabitWithCompletions[];
  from: string;
  to: string;
}

export interface HabitsMetaResult {
  habits: HabitMeta[];
  from: string;
  to: string;
}

export interface ToggleCompletionResult {
  completed: boolean;
  date: string;
}

const habitsPath = (from: string, to: string, fields?: "meta") =>
  `/api/habits?${fields === undefined ? "" : `fields=${fields}&`}from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

export const getHabits = (
  token: string,
  from: string,
  to: string,
  signal?: AbortSignal,
) => get<HabitsResult>(habitsPath(from, to), token, signal);

export const getHabitsMeta = (
  token: string,
  from: string,
  to: string,
  signal?: AbortSignal,
) => get<HabitsMetaResult>(habitsPath(from, to, "meta"), token, signal);

/** Bucket granularity for `/api/habits/stats` — also the page's periods. */
export type StatsPeriodKey = "day" | "week" | "month" | "year";

/** Check-ins falling inside one bucket (`period` decides what a bucket is). */
export interface HabitStatsBucket {
  key: string;
  completions: number;
}

/**
 * All-time numbers for the Statistics "Overall" section, aggregated by the
 * server so the client never downloads every completion date. Field names are
 * snake_case because they are computed in SQL and passed through untouched.
 */
export interface HabitStatsSummary {
  total_check_ins: number;
  active_days: number;
  perfect_days: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  /** Local calendar day (YYYY-MM-DD) tracking started — parse with parseDateKey. */
  tracking_since: string;
}

export interface HabitStatsResult {
  from: string;
  to: string;
  period: StatsPeriodKey;
  buckets: HabitStatsBucket[];
  summary: HabitStatsSummary;
}

/** One aggregated query for a range instead of N full-history requests. */
export const getHabitStats = (
  token: string,
  from: string,
  to: string,
  period: StatsPeriodKey,
  signal?: AbortSignal,
) =>
  get<HabitStatsResult>(
    `/api/habits/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&period=${encodeURIComponent(period)}`,
    token,
    signal,
  );

export const toggleHabitCompletion = (
  token: string,
  habitId: number,
  date: string,
) =>
  post<ToggleCompletionResult>(
    `/api/habits/${habitId}/toggle`,
    { date },
    token,
  );
