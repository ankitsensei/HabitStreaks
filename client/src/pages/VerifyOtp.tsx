import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  MailIcon,
} from "../components/Icons";
import { resendOtp, verifyOtp } from "../lib/api";
import { getToken, setToken } from "../lib/auth";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

interface VerifyOtpState {
  email?: string;
}

const primaryButton =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-4 py-3.5 text-[14.5px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-105 hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-brand-500/40";

const Spinner = () => (
  <span
    aria-hidden="true"
    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
  />
);

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">
    <AlertIcon className="h-3.5 w-3.5 shrink-0" />
    {message}
  </p>
);

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as VerifyOtpState;
  const email = state.email ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (getToken()) {
      navigate("/", { replace: true });
      return;
    }

    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (!email) return;
    requestAnimationFrame(() => otpRefs.current[0]?.focus());
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError(null);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!digits) return;

    event.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    digits.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setOtp(next);
    setOtpError(null);
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpError(null);
    setNotice(null);

    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyOtp(email, code);
      setToken(result.token);
      navigate("/", { replace: true });
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : "We couldn't verify that code. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setOtpError(null);
    setNotice(null);

    try {
      const result = await resendOtp(email);
      setNotice(result.message);
      setOtp(Array(OTP_LENGTH).fill(""));
      setCooldown(RESEND_COOLDOWN_SECONDS);
      requestAnimationFrame(() => otpRefs.current[0]?.focus());
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : "We couldn't resend the code. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <AuthShell>
      <div className="animate-fade-up">
        <Link
          to="/register"
          className="mb-8 inline-flex items-center gap-1.5 rounded-lg text-[12.5px] font-semibold text-slate-500 transition hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to sign up
        </Link>

        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
          <MailIcon className="h-6 w-6" />
        </span>

        <h1 className="mt-6 text-[28px] font-bold tracking-tight text-slate-900 sm:text-[32px] dark:text-white">
          Check your inbox
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
          We sent a 6-digit verification code to{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {email}
          </span>
          . Enter it below to finish creating your account.
        </p>

        {notice && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <form className="mt-7 space-y-5" onSubmit={handleVerify} noValidate>
          <div>
            <label className="mb-2 block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
              Verification code
            </label>
            <div className="flex gap-2 sm:gap-2.5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    otpRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleOtpChange(index, event.target.value)
                  }
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={handleOtpPaste}
                  aria-label={`Digit ${index + 1}`}
                  aria-invalid={Boolean(otpError)}
                  className={`h-14 w-full min-w-0 rounded-xl border bg-white text-center text-xl font-semibold text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:bg-white/[0.04] dark:text-white dark:focus:border-brand-400/70 dark:focus:ring-brand-500/15 ${
                    otpError
                      ? "border-rose-300 dark:border-rose-400/40"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                />
              ))}
            </div>
            {otpError && <FieldError message={otpError} />}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className={primaryButton}
          >
            {isVerifying ? (
              <>
                <Spinner />
                Verifying…
              </>
            ) : (
              <>
                Verify email
                <CheckIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-slate-400 dark:text-slate-500">
          Didn&apos;t get the email? Check your spam folder or{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline dark:text-brand-300 dark:disabled:text-slate-500"
          >
            {isResending
              ? "sending a new code…"
              : cooldown > 0
                ? `resend in ${cooldown}s`
                : "resend the code"}
          </button>
          .
        </p>
      </div>
    </AuthShell>
  );
};

export default VerifyOtp;
