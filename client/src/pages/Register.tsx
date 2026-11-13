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
import { redirectToGoogleSignIn } from "../lib/google";

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

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
  <span
    className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${
      met ? "text-[#30D158]" : "text-[rgba(235,235,245,0.4)]"
    }`}
  >
    <span
      className={`grid h-3.5 w-3.5 place-items-center rounded-full ${
        met ? "bg-[#30D158]/15 text-[#30D158]" : "bg-white/[0.08] text-[rgba(235,235,245,0.4)]"
      }`}
    >
      <CheckIcon className="h-2.5 w-2.5" />
    </span>
    {label}
  </span>
);

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[#FF6961]">
    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
    {message}
  </p>
);

const Logo = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span
      className={`grid place-items-center rounded-[12px] bg-[#0A84FF] text-white shadow-[0_0_24px_rgba(10,132,255,0.45)] ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
    >
      <FlameIcon className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} />
    </span>
    <span
      className={`font-semibold tracking-tight ${
        compact ? "text-[16px] text-[#f5f5f7]" : "text-[17px] text-white"
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

    if (!redirectToGoogleSignIn()) {
      setGoogleNotice(
        "Google sign-up isn't configured yet. Add VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID to your .env file to enable it.",
      );
      return;
    }

    setIsGoogleLoading(true);
  };

  return (
    <div className="relative min-h-svh overflow-hidden bg-black px-3 py-3 sm:px-5 sm:py-5">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#0A84FF]/20 blur-[130px]" />
        <div className="absolute -bottom-40 right-0 h-[480px] w-[480px] rounded-full bg-[#BF5AF2]/10 blur-[130px]" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#1c1c1e]/80 shadow-[0_40px_90px_-45px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:min-h-[calc(100svh-2.5rem)]">
        {/* Brand panel */}
        <aside className="relative hidden w-[46%] max-w-[540px] shrink-0 flex-col overflow-hidden bg-[#141416] p-10 lg:flex xl:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0A84FF]/25 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#BF5AF2]/15 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col">
            <Logo />

            <div className="mt-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-medium tracking-wide text-[rgba(235,235,245,0.7)] backdrop-blur">
                <SparkIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
                Free forever · No credit card
              </span>

              <h2 className="mt-5 text-[34px] font-bold leading-[1.08] tracking-tight text-white xl:text-[40px]">
                Build habits that{" "}
                <span className="bg-gradient-to-r from-[#0A84FF] via-[#64D2FF] to-[#BF5AF2] bg-clip-text text-transparent">
                  actually stick.
                </span>
              </h2>

              <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                Track your daily wins, protect your momentum, and turn small
                actions into a year of change.
              </p>
            </div>

            <ul className="mt-10 space-y-5">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-white/[0.08] bg-white/[0.06] text-[#409AFF]">
                    <feature.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-[rgba(235,235,245,0.5)]">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[rgba(235,235,245,0.7)]">
                    <FlameIcon className="h-4 w-4 text-[#FF9F0A]" />
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
                          ? "bg-[#0A84FF] shadow-[0_0_6px_rgba(10,132,255,0.5)]"
                          : "bg-white/[0.08]"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-[rgba(235,235,245,0.4)]">
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
                  <h1 className="text-[28px] font-bold tracking-tight text-[#f5f5f7] sm:text-[32px]">
                    Create your account
                  </h1>
                  <p className="mt-2 text-[14px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                    Start building better habits today. It&apos;s free and takes
                    less than a minute.
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
                      or sign up with email
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
                        className="mb-1.5 block text-[12.5px] font-semibold text-[rgba(235,235,245,0.7)]"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[rgba(235,235,245,0.4)]" />
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
                          className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[rgba(235,235,245,0.4)] transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
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
                        className="mb-1.5 block text-[12.5px] font-semibold text-[rgba(235,235,245,0.7)]"
                      >
                        Confirm password
                      </label>
                      <div className="relative">
                        <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[rgba(235,235,245,0.4)]" />
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
                          className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[rgba(235,235,245,0.4)] transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
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
                      <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-[rgba(235,235,245,0.6)]">
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
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 accent-[#0A84FF]"
                        />
                        <span>
                          I agree to the{" "}
                          <a
                            href="/terms"
                            className="font-semibold text-[#409AFF] hover:underline"
                          >
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            className="font-semibold text-[#409AFF] hover:underline"
                          >
                            Privacy Policy
                          </a>
                          .
                        </span>
                      </label>
                      {errors.terms && <FieldError message={errors.terms} />}
                    </div>

                    {formError && (
                      <div className="flex items-start gap-2 rounded-xl bg-[#FF453A]/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25">
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

                <p className="mt-8 text-center text-[13px] text-[rgba(235,235,245,0.6)]">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-[#409AFF] hover:text-[#66AFFF] hover:underline"
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
