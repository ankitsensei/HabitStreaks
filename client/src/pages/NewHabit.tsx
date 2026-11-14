import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
 AlertIcon,
 ArrowRightIcon,
 CheckIcon,
 SparkIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
import { ApiError, addHabit, HABIT_CATEGORIES } from "../lib/api";
import type { HabitCategory } from "../lib/api";
import { clearToken, getToken, useAuth } from "../lib/auth";
import {
 CATEGORY_ICONS,
 COLOR_OPTIONS,
 ICON_OPTIONS,
 TARGET_OPTIONS,
 isLightColor,
} from "../lib/habitOptions";

const inputBase =
 "w-full rounded-lg border border-[#313131] bg-[#0a0a0a] px-3.5 py-2.5 text-[14px] text-white outline-none transition placeholder:text-[#7c7c7c] focus:border-[#6798ff] focus:ring-2 focus:ring-[#6798ff]/25";

const labelClass =
 "block text-[12.5px] font-medium text-[#a7a7a7]";

const primaryButton =
 "group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

const secondaryButton =
 "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#454545] bg-transparent px-5 py-2.5 text-[13.5px] font-medium text-white transition hover:bg-[#1e1e1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:w-auto";

const Spinner = () => (
 <span
 aria-hidden="true"
 className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]"
 />
);

const NewHabit = () => {
 const navigate = useNavigate();
 const { isAuthenticated } = useAuth();

 const [name, setName] = useState("");
 const [icon, setIcon] = useState<string>(ICON_OPTIONS[0].emoji);
 const [color, setColor] = useState<string>(COLOR_OPTIONS[0].value);
 const [category, setCategory] =
 useState<HabitCategory>("Health & Fitness");
 const [targetPerWeek, setTargetPerWeek] = useState(3);

 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!isAuthenticated) {
 navigate("/login", { replace: true });
 }
 }, [isAuthenticated, navigate]);

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setError(null);

 const trimmedName = name.trim();

 if (!trimmedName) {
 setError("Enter a habit name.");
 return;
 }

 if (trimmedName.length > 100) {
 setError("Habit name must be 100 characters or fewer.");
 return;
 }

 const token = getToken();

 if (!token) {
 navigate("/login", { replace: true });
 return;
 }

 setIsSubmitting(true);

 try {
 const result = await addHabit(token, {
 name: trimmedName,
 icon,
 color,
 category,
 targetPerWeek,
 });

 navigate("/habits", {
 replace: true,
 state: { addedHabit: result.habit.name },
 });
 } catch (err) {
 if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
 clearToken();
 navigate("/login", { replace: true });
 return;
 }

 setError(
 err instanceof ApiError
 ? err.message
 : "Something went wrong. Please try again.",
 );
 } finally {
 setIsSubmitting(false);
 }
 };

 if (!isAuthenticated) {
 return null;
 }

 return (
 <div className="min-h-svh bg-[#0a0a0a] text-white">
 <Navbar />

 <main>
 <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-5 sm:py-10">
 <div className="animate-fade-up">
 <div className="mb-5">
 <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#a7a7a7]">
 <SparkIcon className="h-3.5 w-3.5 text-[#6798ff]" />
 New habit
 </span>

 <h1 className="mt-2 text-[26px] font-medium tracking-[-0.02em] text-white sm:text-[32px]">
 What do you want to build?
 </h1>
 <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-[#a7a7a7]">
 Pick something specific, give it a weekly target, and make it
 yours. You can always add more habits later.
 </p>
 </div>

 <form
 onSubmit={handleSubmit}
 noValidate
 className="rounded-lg border border-[#313131] bg-[#141414] p-4 sm:p-5"
 >
 {error && (
 <div
 role="alert"
 className="mb-5 flex items-start gap-2.5 rounded-lg bg-[#141414] px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-white ring-1 ring-[#454545]"
 >
 <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 <div className="space-y-5">
 {/* Preview */}
 <div className="flex items-center gap-3 rounded-lg border border-[#313131] bg-[#0a0a0a] p-3">
 <span
 aria-hidden="true"
 className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[20px]"
 style={{ backgroundColor: `${color}1f`, color }}
 >
 {icon}
 </span>
 <div className="min-w-0">
 <p className="truncate text-[14px] font-medium text-white">
 {name.trim() || "Your new habit"}
 </p>
 <p className="mt-0.5 text-[12px] text-[#a7a7a7]">
 {category} · {targetPerWeek}{" "}
 {targetPerWeek === 1 ? "day" : "days"} per week
 </p>
 </div>
 </div>

 {/* Name */}
 <div>
 <div className="mb-1.5 flex items-baseline justify-between gap-3">
 <label htmlFor="habit-name" className={labelClass}>
 Habit name
 </label>
 <span className="text-[11px] font-medium tabular-nums text-[#a7a7a7]">
 {name.length}/100
 </span>
 </div>
 <input
 id="habit-name"
 name="habit-name"
 type="text"
 autoComplete="off"
 maxLength={100}
 required
 placeholder="e.g. Read 20 pages"
 value={name}
 onChange={(event) => setName(event.target.value)}
 className={inputBase}
 />
 </div>

 {/* Icon */}
 <div>
 <span className={labelClass}>Habit icon</span>
 <div
 role="group"
 aria-label="Habit icon"
 className="mt-2 flex flex-wrap gap-2"
 >
 {ICON_OPTIONS.map((option) => {
 const selected = icon === option.emoji;

 return (
 <button
 key={option.emoji}
 type="button"
 title={option.label}
 aria-label={option.label}
 aria-pressed={selected}
 onClick={() => setIcon(option.emoji)}
 className={`grid h-9 w-9 place-items-center rounded-lg border text-[17px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60 ${
 selected
 ? "border-[#6798ff] bg-[#6798ff]/15"
 : "border-[#313131] bg-[#141414] hover:border-[#6798ff]/40"
 }`}
 >
 <span aria-hidden="true">{option.emoji}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Color */}
 <div>
 <span className={labelClass}>Habit color</span>
 <div
 role="group"
 aria-label="Habit color"
 className="mt-2 flex flex-wrap gap-2"
 >
 {COLOR_OPTIONS.map((option) => {
 const selected = color === option.value;

 return (
 <button
 key={option.value}
 type="button"
 title={option.name}
 aria-label={option.name}
 aria-pressed={selected}
 onClick={() => setColor(option.value)}
 className={`grid h-8 w-8 place-items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60 ${
 isLightColor(option.value)
 ? "text-black"
 : "text-white"
 } ${
 selected
 ? "ring-2 ring-white ring-offset-2 ring-offset-[#141414]"
 : "hover:scale-110"
 }`}
 style={{ backgroundColor: option.value }}
 >
 {selected && (
 <CheckIcon
 className="h-4 w-4"
 aria-hidden="true"
 />
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* Category */}
 <fieldset>
 <legend className={labelClass}>Category</legend>
 <div className="mt-2 grid gap-2 sm:grid-cols-2">
 {HABIT_CATEGORIES.map((option) => {
 const selected = category === option;

 return (
 <label
 key={option}
 className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition focus-within:ring-2 focus-within:ring-[#6798ff]/60 ${
 selected
 ? "border-[#6798ff]/40 bg-[#6798ff]/10 text-[#6798ff]"
 : "border-[#313131] bg-[#141414] text-[#a7a7a7] hover:border-[#454545] hover:bg-[#1e1e1e]"
 }`}
 >
 <input
 type="radio"
 name="category"
 value={option}
 checked={selected}
 onChange={() => setCategory(option)}
 className="sr-only"
 />
 <span aria-hidden="true" className="text-[14px]">
 {CATEGORY_ICONS[option]}
 </span>
 <span>{option}</span>
 </label>
 );
 })}
 </div>
 </fieldset>

 {/* Targets per week */}
 <fieldset>
 <legend className={labelClass}>Targets per week</legend>
 <div className="mt-2 grid grid-cols-7 gap-2">
 {TARGET_OPTIONS.map((value) => {
 const selected = targetPerWeek === value;

 return (
 <button
 key={value}
 type="button"
 aria-label={`${value} ${
 value === 1 ? "day" : "days"
 } per week`}
 aria-pressed={selected}
 onClick={() => setTargetPerWeek(value)}
 className={`grid h-9 place-items-center rounded-lg border text-[13.5px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60 ${
 selected
 ? "border-transparent bg-white text-[#0a0a0a]"
 : "border-[#313131] bg-[#141414] text-[#a7a7a7] hover:border-[#6798ff]/40 hover:text-[#6798ff]"
 }`}
 >
 {value}
 </button>
 );
 })}
 </div>
 </fieldset>
 </div>

 <div className="mt-6 flex flex-col gap-3 border-t border-[#313131] pt-4 sm:flex-row sm:items-center sm:justify-between">
 <Link to="/" className={secondaryButton}>
 Cancel
 </Link>
 <button
 type="submit"
 disabled={isSubmitting}
 className={primaryButton}
 >
 {isSubmitting ? (
 <>
 <Spinner />
 Adding habit…
 </>
 ) : (
 <>
 Create habit
 <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 </main>
 </div>
 );
};

export default NewHabit;
