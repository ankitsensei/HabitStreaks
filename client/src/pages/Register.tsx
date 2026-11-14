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
 "w-full rounded-lg border bg-[#0a0a0a] py-3 pl-11 pr-4 text-[14.5px] text-white outline-none transition placeholder:text-[#7c7c7c] focus:border-[#6798ff] focus:ring-2 focus:ring-[#6798ff]/25";
const inputNormal = "border-[#313131]";
const inputInvalid =
 "border-[#6798ff]/60 focus:border-[#6798ff] focus:ring-[#6798ff]/20";

const primaryButton =
 "group flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-[14px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60 disabled:cursor-not-allowed disabled:opacity-60";

const Spinner = ({ light = true }: { light?: boolean }) => (
 <span
 aria-hidden="true"
 className={`h-4 w-4 animate-spin rounded-full border-2 ${
 light ? "border-[#0a0a0a]/30 border-t-[#0a0a0a]" : "border-[#313131] border-t-[#6798ff]"
 }`}
 />
);

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
 <span
 className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${
 met ? "text-white" : "text-[#a7a7a7]"
 }`}
 >
 <span
 className={`grid h-3.5 w-3.5 place-items-center rounded-full ${
 met ? "bg-[#6798ff]/15 text-white" : "bg-[#1e1e1e] text-[#a7a7a7]"
 }`}
 >
 <CheckIcon className="h-2.5 w-2.5" />
 </span>
 {label}
 </span>
);

const FieldError = ({ message }: { message: string }) => (
 <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-white">
 <AlertIcon className="h-3.5 w-3.5 shrink-0" />
 {message}
 </p>
);

const Logo = ({ compact = false }: { compact?: boolean }) => (
 <div className="flex items-center gap-2.5">
 <span
 className={`grid place-items-center rounded-lg bg-white text-[#0a0a0a] ${
 compact ? "h-9 w-9" : "h-10 w-10"
 }`}
 >
 <FlameIcon className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} />
 </span>
 <span
 className={`font-medium tracking-tight ${
 compact ? "text-[16px] text-white" : "text-[17px] text-white"
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
 <div className="relative min-h-svh overflow-hidden bg-[#0a0a0a] px-3 py-3 sm:px-5 sm:py-5">
 <main className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-[#313131] bg-[#141414]/80 sm:min-h-[calc(100svh-2.5rem)]">
 {/* Brand panel */}
 <aside className="relative hidden w-[46%] max-w-[540px] shrink-0 flex-col overflow-hidden bg-[#0a0a0a] p-10 lg:flex xl:p-12">
 <div className="relative z-10 flex flex-1 flex-col">
 <Logo />

 <div className="mt-14">
 <span className="inline-flex items-center gap-1.5 rounded-full border border-[#313131] bg-[#141414] px-3 py-1 text-[11px] font-medium tracking-wide text-[#a7a7a7]">
 <SparkIcon className="h-3.5 w-3.5 text-[#6798ff]" />
 Free forever · No credit card
 </span>

 <h2 className="mt-5 text-[34px] font-medium leading-[1.08] tracking-[-0.02em] text-white xl:text-[40px]">
 Build habits that{" "}
 <span className="inline-block rounded-full bg-white px-4 py-0.5 text-[#0a0a0a]">actually stick.</span>
 </h2>

 <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-[#a7a7a7]">
 Track your daily wins, protect your momentum, and turn small
 actions into a year of change.
 </p>
 </div>

 <ul className="mt-10 space-y-5">
 {features.map((feature) => (
 <li key={feature.title} className="flex items-start gap-3.5">
 <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#313131] bg-[#0a0a0a] text-[#6798ff]">
 <feature.icon className="h-[18px] w-[18px]" />
 </span>
 <div>
 <p className="text-[13.5px] font-medium text-white">
 {feature.title}
 </p>
 <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#a7a7a7]">
 {feature.description}
 </p>
 </div>
 </li>
 ))}
 </ul>

 <div className="mt-auto pt-10">
 <div className="rounded-lg border border-[#313131] bg-[#0a0a0a] p-5">
 <div className="flex items-center justify-between">
 <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#a7a7a7]">
 <FlameIcon className="h-4 w-4 text-[#6798ff]" />
 Current streak
 </span>
 <span className="text-[13px] font-medium text-white">
 21 days
 </span>
 </div>
 <div className="mt-4 grid grid-cols-7 gap-1.5">
 {streakDays.map((active, index) => (
 <span
 key={index}
 className={`aspect-square rounded-[5px] ${
 active
 ? "bg-[#6798ff]"
 : "bg-[#1e1e1e]"
 }`}
 />
 ))}
 </div>
 <p className="mt-3 text-[11.5px] text-[#a7a7a7]">
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
 <h1 className="text-[28px] font-medium tracking-[-0.02em] text-white sm:text-[32px]">
 Create your account
 </h1>
 <p className="mt-2 text-[14px] leading-relaxed text-[#a7a7a7]">
 Start building better habits today. It&apos;s free and takes
 less than a minute.
 </p>
 </header>

 <div className="mt-8 space-y-4">
 <button
 type="button"
 onClick={handleGoogleSignIn}
 disabled={isGoogleLoading}
 className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#454545] bg-transparent px-4 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#1e1e1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {isGoogleLoading ? (
 <Spinner light={false} />
 ) : (
 <GoogleIcon className="h-[18px] w-[18px]" />
 )}
 Continue with Google
 </button>

 {googleNotice && (
 <div className="flex items-start gap-2 rounded-lg bg-[#141414] px-3.5 py-2.5 text-[12px] leading-relaxed text-white ring-1 ring-[#454545]">
 <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
 <span>{googleNotice}</span>
 </div>
 )}

 <div className="flex items-center gap-3">
 <span className="h-px flex-1 bg-[#1e1e1e]" />
 <span className="text-[10.5px] font-medium font-mono uppercase tracking-[0.08em] text-[#a7a7a7]">
 or sign up with email
 </span>
 <span className="h-px flex-1 bg-[#1e1e1e]" />
 </div>

 <form className="space-y-5" onSubmit={handleSubmit} noValidate>
 <div>
 <label
 htmlFor="email"
 className="mb-1.5 block text-[12.5px] font-medium text-[#a7a7a7]"
 >
 Email address
 </label>
 <div className="relative">
 <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a7a7a7]" />
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
 className="mb-1.5 block text-[12.5px] font-medium text-[#a7a7a7]"
 >
 Password
 </label>
 <div className="relative">
 <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a7a7a7]" />
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
 className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#a7a7a7] transition hover:bg-[#1e1e1e] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50"
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
 className="mb-1.5 block text-[12.5px] font-medium text-[#a7a7a7]"
 >
 Confirm password
 </label>
 <div className="relative">
 <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a7a7a7]" />
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
 className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#a7a7a7] transition hover:bg-[#1e1e1e] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50"
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
 <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-[#a7a7a7]">
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
 className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#454545] accent-[#6798ff]"
 />
 <span>
 I agree to the{" "}
 <a
 href="/terms"
 className="font-medium text-[#6798ff] hover:underline"
 >
 Terms of Service
 </a>{" "}
 and{" "}
 <a
 href="/privacy"
 className="font-medium text-[#6798ff] hover:underline"
 >
 Privacy Policy
 </a>
 .
 </span>
 </label>
 {errors.terms && <FieldError message={errors.terms} />}
 </div>

 {formError && (
 <div className="flex items-start gap-2 rounded-lg bg-[#141414] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white ring-1 ring-[#454545]">
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

 <p className="mt-8 text-center text-[13px] text-[#a7a7a7]">
 Already have an account?{" "}
 <a
 href="/login"
 className="font-medium text-[#6798ff] hover:text-[#6798ff] hover:underline"
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
