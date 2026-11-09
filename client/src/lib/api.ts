const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(
      "We couldn't reach the server. Check your connection and try again.",
      0,
    );
  }

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

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

async function get<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

export interface HabitWithCompletions extends Habit {
  completions: string[];
}

export interface HabitsResult {
  habits: HabitWithCompletions[];
  from: string;
  to: string;
}

export interface ToggleCompletionResult {
  completed: boolean;
  date: string;
}

export const getHabits = (token: string, from: string, to: string) =>
  get<HabitsResult>(
    `/api/habits?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    token,
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
