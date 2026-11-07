const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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

export interface RegisterResult {
  message: string;
  user: {
    id: number;
    email: string;
    created_at: string;
  };
}

export interface VerifyOtpResult {
  message: string;
}

export const registerUser = (email: string, password: string) =>
  post<RegisterResult>("/api/auth/register", { email, password });

export const verifyOtp = (email: string, otp: string) =>
  post<VerifyOtpResult>("/api/auth/verify-otp", { email, otp });
