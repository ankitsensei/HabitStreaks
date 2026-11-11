import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import {
  AlertIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
} from "../components/Icons";
import { ApiError, loginUser } from "../lib/api";
import { getToken, setToken } from "../lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputBase =
  "w-full rounded-xl border bg-white/[0.06] py-3 pl-11 pr-4 text-[14.5px] text-[#f5f5f7] outline-none transition placeholder:text-[rgba(235,235,245,0.35)] focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/25";
const inputNormal = "border-white/[0.08]";
const inputInvalid =
  "border-[#FF453A]/60 focus:border-[#FF453A] focus:ring-[#FF453A]/20";

const primaryButton =
  "group flex w-full items-center justify-center gap-2 rounded-full bg-[#0A84FF] px-4 py-3 text-[14.5px] font-semibold text-white shadow-[0_0_24px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 disabled:cursor-not-allowed disabled:opacity-60";

const Spinner = ({ light = true }: { light?: boolean }) => (
  <span
    aria-hidden="true"
    className={`h-4 w-4 animate-spin rounded-full border-2 ${
      light ? "border-white/40 border-t-white" : "border-white/25 border-t-[#0A84FF]"
    }`}
  />
);

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[#FF6961]">
    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
    {message}
  </p>
);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

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
      setToken(result.token);
      navigate("/", { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        navigate("/verify-otp", { state: { email: email.trim() } });
        return;
      }

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

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <header>
            <h1 className="text-[28px] font-bold tracking-tight text-[#f5f5f7] sm:text-[32px]">
              Welcome back
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[rgba(235,235,245,0.6)]">
              Sign in to protect your streak and keep the momentum going.
            </p>
          </header>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Spinner light={false} />
              ) : (
                <GoogleIcon className="h-[18px] w-[18px]" />
              )}
              Continue with Google
            </button>

            {googleNotice && (
              <div className="flex items-start gap-2 rounded-xl bg-[#FF9F0A]/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#FFB340] ring-1 ring-[#FF9F0A]/25">
                <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{googleNotice}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[rgba(235,235,245,0.4)]">
                or sign in with email
              </span>
              <span className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[12.5px] font-semibold text-[rgba(235,235,245,0.7)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[rgba(235,235,245,0.4)]" />
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
                    className="block text-[12.5px] font-semibold text-[rgba(235,235,245,0.7)]"
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
                    className="rounded text-[11.5px] font-semibold text-[#409AFF] transition hover:text-[#66AFFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[rgba(235,235,245,0.4)]" />
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
                    className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[rgba(235,235,245,0.4)] transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
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
                <div className="flex items-start gap-2 rounded-xl bg-[#FF9F0A]/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#FFB340] ring-1 ring-[#FF9F0A]/25">
                  <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{infoNotice}</span>
                </div>
              )}

              {formError && (
                <div className="flex items-start gap-2 rounded-xl bg-[#FF453A]/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25">
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

          <p className="mt-8 text-center text-[13px] text-[rgba(235,235,245,0.6)]">
            New to HabitStreaks?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#409AFF] hover:text-[#66AFFF] hover:underline"
            >
              Create an account
            </Link>
          </p>
      </div>
    </AuthShell>
  );
};

export default Login;
