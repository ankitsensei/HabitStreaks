import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
} from "../components/Icons";
import { loginUser } from "../lib/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_STORAGE_KEY = "habitstreaks_token";

const inputBase =
  "w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-[14.5px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400/70 dark:focus:ring-brand-500/15";
const inputNormal = "border-slate-200 dark:border-white/10";
const inputInvalid =
  "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-400/40 dark:focus:border-rose-400/60 dark:focus:ring-rose-500/15";

const primaryButton =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-4 py-3.5 text-[14.5px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-105 hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-brand-500/40";

const secondaryButton =
  "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] dark:focus-visible:ring-white/10";

const Spinner = ({ light = true }: { light?: boolean }) => (
  <span
    aria-hidden="true"
    className={`h-4 w-4 animate-spin rounded-full border-2 ${
      light ? "border-white/40 border-t-white" : "border-slate-300 border-t-brand-600"
    }`}
  />
);

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">
    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
    {message}
  </p>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = "Enter your email address.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "That email address doesn't look right.";
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser(email.trim(), password);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      setIsSignedIn(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setFormError(null);
    setGoogleNotice(null);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setGoogleNotice(
        "Google sign-in isn't configured yet. Add VITE_GOOGLE_CLIENT_ID to your .env file to enable it.",
      );
      return;
    }

    const state = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    sessionStorage.setItem("google_oauth_state", state);
    setIsGoogleLoading(true);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    window.location.assign(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setPassword("");
    setFormError(null);
    setInfoNotice(null);
    setIsSignedIn(false);
  };

  return (
    <AuthShell>
      {isSignedIn ? (
        <div className="animate-fade-up text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            <CheckIcon className="h-7 w-7" />
          </span>

          <h1 className="mt-6 text-[28px] font-bold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">
            Welcome back!
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
            You&apos;re signed in as{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {email}
            </span>
            . Your habit dashboard will appear here once it&apos;s built.
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSignOut}
              className={secondaryButton}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-up">
          <header>
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
              Sign in to protect your streak and keep the momentum going.
            </p>
          </header>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14.5px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/[0.09] dark:focus-visible:ring-white/10"
            >
              {isGoogleLoading ? (
                <Spinner light={false} />
              ) : (
                <GoogleIcon className="h-[18px] w-[18px]" />
              )}
              Continue with Google
            </button>

            {googleNotice && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
                <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{googleNotice}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                or sign in with email
              </span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email address
                </label>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setEmail(event.target.value);
                      setErrors((current) => ({ ...current, email: "" }));
                    }}
                    aria-invalid={Boolean(errors.email)}
                    className={`${inputBase} ${
                      errors.email ? inputInvalid : inputNormal
                    }`}
                  />
                </div>
                {errors.email && <FieldError message={errors.email} />}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setInfoNotice(
                        "Password reset isn't available yet. Please contact support if you're locked out.",
                      );
                    }}
                    className="rounded text-[11.5px] font-semibold text-brand-700 transition hover:text-brand-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setPassword(event.target.value);
                      setErrors((current) => ({ ...current, password: "" }));
                    }}
                    aria-invalid={Boolean(errors.password)}
                    className={`${inputBase} pr-11 ${
                      errors.password ? inputInvalid : inputNormal
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-[18px] w-[18px]" />
                    ) : (
                      <EyeIcon className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {errors.password && <FieldError message={errors.password} />}
              </div>

              {infoNotice && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
                  <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{infoNotice}</span>
                </div>
              )}

              {formError && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading} className={primaryButton}>
                {isLoading ? (
                  <>
                    <Spinner />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
            New to HabitStreaks?{" "}
            <Link
              to="/register"
              className="font-semibold text-brand-700 hover:text-brand-800 hover:underline dark:text-brand-300 dark:hover:text-brand-200"
            >
              Create an account
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
};

export default Login;
