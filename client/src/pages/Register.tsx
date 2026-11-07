import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  ChartIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  FlameIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  SparkIcon,
} from "../components/Icons";
import { registerUser } from "../lib/api";
import { getToken } from "../lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputBase =
  "w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-[14.5px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400/70 dark:focus:ring-brand-500/15";
const inputNormal = "border-slate-200 dark:border-white/10";
const inputInvalid =
  "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-400/40 dark:focus:border-rose-400/60 dark:focus:ring-rose-500/15";

const primaryButton =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-4 py-3.5 text-[14.5px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-105 hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-brand-500/40";

const Spinner = ({ light = true }: { light?: boolean }) => (
  <span
    aria-hidden="true"
    className={`h-4 w-4 animate-spin rounded-full border-2 ${
      light ? "border-white/40 border-t-white" : "border-slate-300 border-t-brand-600"
    }`}
  />
);

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
  <span
    className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${
      met
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-slate-400 dark:text-slate-500"
    }`}
  >
    <span
      className={`grid h-3.5 w-3.5 place-items-center rounded-full ${
        met
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500"
      }`}
    >
      <CheckIcon className="h-2.5 w-2.5" />
    </span>
    {label}
  </span>
);

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">
    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
    {message}
  </p>
);

const Logo = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span
      className={`grid place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
    >
      <FlameIcon className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} />
    </span>
    <span
      className={`font-semibold tracking-tight ${
        compact
          ? "text-[16px] text-slate-900 dark:text-white"
          : "text-[17px] text-white"
      }`}
    >
      HabitStreaks
    </span>
  </div>
);

const features = [
  {
    icon: FlameIcon,
    title: "Keep your streak alive",
    description: "Daily check-ins that make consistency feel effortless.",
  },
  {
    icon: ChartIcon,
    title: "See real progress",
    description: "Monthly and yearly reports that actually motivate you.",
  },
  {
    icon: ShieldIcon,
    title: "Private by default",
    description: "Your habit data belongs to you and nobody else.",
  },
];

const streakDays = [
  1, 1, 1, 0, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 0, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
];

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const passwordChecks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /\d/.test(password),
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = "Enter your email address.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "That email address doesn't look right.";
    }

    if (!password) {
      nextErrors.password = "Create a password.";
    } else if (
      !passwordChecks.length ||
      !passwordChecks.letter ||
      !passwordChecks.number
    ) {
      nextErrors.password =
        "Use at least 8 characters with a letter and a number.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords don't match.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Please accept the terms to continue.";
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

    const trimmedEmail = email.trim();

    try {
      await registerUser(trimmedEmail, password);

      navigate("/verify-otp", {
        state: { email: trimmedEmail },
      });
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
        "Google sign-up isn't configured yet. Add VITE_GOOGLE_CLIENT_ID to your .env file to enable it.",
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
    <div className="relative min-h-svh overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand-300/30 blur-[120px] dark:bg-brand-600/20" />
        <div className="absolute -bottom-40 right-0 h-[480px] w-[480px] rounded-full bg-fuchsia-300/25 blur-[130px] dark:bg-fuchsia-600/10" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_30px_90px_-45px_rgba(76,29,149,0.55)] backdrop-blur-xl sm:min-h-[calc(100svh-2.5rem)] dark:border-white/10 dark:bg-[#111018]/85">
        {/* Brand panel */}
        <aside className="relative hidden w-[46%] max-w-[540px] shrink-0 flex-col overflow-hidden bg-[#160f2b] p-10 lg:flex xl:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/45 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/35 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-1 flex-col">
            <Logo />

            <div className="mt-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[11px] font-medium tracking-wide text-brand-100 backdrop-blur">
                <SparkIcon className="h-3.5 w-3.5 text-amber-300" />
                Free forever · No credit card
              </span>

              <h2 className="mt-5 text-[34px] font-bold leading-[1.1] tracking-tight text-white xl:text-[40px]">
                Build habits that{" "}
                <span className="bg-gradient-to-r from-brand-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
                  actually stick.
                </span>
              </h2>

              <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-white/60">
                Track your daily wins, protect your momentum, and turn small
                actions into a year of change.
              </p>
            </div>

            <ul className="mt-10 space-y-5">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-brand-200">
                    <feature.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/70">
                    <FlameIcon className="h-4 w-4 text-amber-300" />
                    Current streak
                  </span>
                  <span className="text-[13px] font-semibold text-white">
                    21 days
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1.5">
                  {streakDays.map((active, index) => (
                    <span
                      key={index}
                      className={`aspect-square rounded-[5px] ${
                        active
                          ? "bg-gradient-to-br from-brand-400 to-fuchsia-400 shadow-sm shadow-fuchsia-500/30"
                          : "bg-white/[0.08]"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-white/40">
                  Every small win adds up.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-10 lg:hidden">
              <Logo compact />
            </div>

            <div className="animate-fade-up">
              <header>
                  <h1 className="text-[28px] font-bold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">
                    Create your account
                  </h1>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Start building better habits today. It&apos;s free and takes
                    less than a minute.
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
                      or sign up with email
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
                            setErrors((current) => ({
                              ...current,
                              email: "",
                            }));
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
                      <label
                        htmlFor="password"
                        className="mb-1.5 block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="new-password"
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            setPassword(event.target.value);
                            setErrors((current) => ({
                              ...current,
                              password: "",
                            }));
                          }}
                          aria-invalid={Boolean(errors.password)}
                          className={`${inputBase} pr-11 ${
                            errors.password ? inputInvalid : inputNormal
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:hover:bg-white/10 dark:hover:text-slate-200"
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-[18px] w-[18px]" />
                          ) : (
                            <EyeIcon className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>
                      {errors.password ? (
                        <FieldError message={errors.password} />
                      ) : (
                        password.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            <Requirement
                              met={passwordChecks.length}
                              label="8+ characters"
                            />
                            <Requirement
                              met={passwordChecks.letter}
                              label="A letter"
                            />
                            <Requirement
                              met={passwordChecks.number}
                              label="A number"
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-1.5 block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Confirm password
                      </label>
                      <div className="relative">
                        <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm-password"
                          autoComplete="new-password"
                          placeholder="Repeat your password"
                          value={confirmPassword}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            setConfirmPassword(event.target.value);
                            setErrors((current) => ({
                              ...current,
                              confirmPassword: "",
                            }));
                          }}
                          aria-invalid={Boolean(errors.confirmPassword)}
                          className={`${inputBase} pr-11 ${
                            errors.confirmPassword
                              ? inputInvalid
                              : inputNormal
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:hover:bg-white/10 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className="h-[18px] w-[18px]" />
                          ) : (
                            <EyeIcon className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <FieldError message={errors.confirmPassword} />
                      )}
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(event) => {
                            setAcceptedTerms(event.target.checked);
                            setErrors((current) => ({
                              ...current,
                              terms: "",
                            }));
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-600"
                        />
                        <span>
                          I agree to the{" "}
                          <a
                            href="/terms"
                            className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
                          >
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
                          >
                            Privacy Policy
                          </a>
                          .
                        </span>
                      </label>
                      {errors.terms && <FieldError message={errors.terms} />}
                    </div>

                    {formError && (
                      <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={primaryButton}
                    >
                      {isLoading ? (
                        <>
                          <Spinner />
                          Creating account…
                        </>
                      ) : (
                        <>
                          Create account
                          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <p className="mt-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-brand-700 hover:text-brand-800 hover:underline dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    Sign in
                  </a>
                </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Register;
