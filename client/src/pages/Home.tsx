import { Link } from "react-router-dom";
import {
 ArrowRightIcon,
 CalendarIcon,
 ChartIcon,
 CheckIcon,
 FlameIcon,
 ShieldIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
import { useAuth } from "../lib/auth";

const features = [
 {
 icon: FlameIcon,
 title: "Streaks that motivate",
 description:
 "Watch your consistency grow day by day and protect the momentum you've built.",
 },
 {
 icon: CalendarIcon,
 title: "Effortless check-ins",
 description:
 "One tap a day is all it takes. No friction, no complicated setup, no excuses.",
 },
 {
 icon: ChartIcon,
 title: "Monthly & yearly reports",
 description:
 "See exactly how far you've come with clear progress reports that keep you going.",
 },
 {
 icon: ShieldIcon,
 title: "Private by default",
 description:
 "Your habits and progress belong to you. We never sell or share your data.",
 },
];

const week = [
 { day: "M", done: true },
 { day: "T", done: true },
 { day: "W", done: true },
 { day: "T", done: true },
 { day: "F", done: true },
 { day: "S", done: false },
 { day: "S", done: false },
];

const habits = [
 { name: "Morning run", time: "6:30 AM", done: true },
 { name: "Read 20 pages", time: "8:00 PM", done: true },
 { name: "Meditate", time: "9:30 PM", done: false },
];

const steps = [
 {
 number: "01",
 title: "Create your account",
 description:
 "Sign up in seconds with your email or Google, then verify it once.",
 },
 {
 number: "02",
 title: "Check in every day",
 description:
 "Add the habits that matter and mark them off as you go about your day.",
 },
 {
 number: "03",
 title: "Watch your streaks grow",
 description:
 "Build momentum, review your reports, and turn small wins into lasting change.",
 },
];

const currentYear = new Date().getFullYear();

const getInitials = (email: string) => {
 const localPart = email.split("@")[0] ?? "";
 const parts = localPart.split(/[._-]+/).filter(Boolean);

 if (parts.length >= 2) {
 return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
 }

 return (localPart.slice(0, 2) || "HS").toUpperCase();
};

const Home = () => {
 const { user, isAuthenticated, signOut } = useAuth();
 const initials = user ? getInitials(user.email) : "";

 return (
 <div className="min-h-svh bg-[#0a0a0a] text-white">
 <Navbar />

 <main className="blueprint-grid">
 {/* Hero */}
 <section className="relative">
 <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
 <div>
 <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#a7a7a7]">
 <FlameIcon className="h-3.5 w-3.5 text-[#6798ff]" />
 Build better habits, one day at a time
 </span>

 <h1 className="mt-5 text-[40px] font-medium leading-[1.13] tracking-[-0.03em] text-white sm:text-[64px] sm:tracking-[-0.036em]">
 Small habits.{" "}
 <span className="mx-0.5 inline-block rounded-full bg-white px-4 py-0.5 text-[#0a0a0a] tracking-normal sm:px-6 sm:py-1">
 Unbreakable
 </span>{" "}
 streaks.
 </h1>

 <p className="mt-6 max-w-[480px] text-[16px] leading-[1.5] text-[#a7a7a7]">
 HabitStreaks helps you check in daily, protect your momentum, and
 see the progress you&apos;ve worked for — all in one calm,
 focused place.
 </p>

 {isAuthenticated && user && (
 <div className="mt-8 flex items-center gap-4 rounded-lg border border-[#313131] bg-[#141414] p-4">
 <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#6798ff] text-[15px] font-medium text-white">
 {initials}
 </span>
 <div className="min-w-0 flex-1">
 <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-white">
 <span className="truncate">{user.email}</span>
 <span className="inline-flex items-center gap-1 rounded-full bg-[#6798ff]/10 px-2 py-0.5 text-[10px] font-medium text-[#6798ff] ring-1 ring-[#6798ff]/25">
 <span className="h-1.5 w-1.5 rounded-full bg-[#6798ff]" />
 Signed in
 </span>
 </p>
 <p className="mt-1 text-[12px] text-[#a7a7a7]">
 Welcome back. Your next streak starts today.
 </p>
 <Link
 to="/habits"
 className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#6798ff] transition hover:text-[#6798ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/50"
 >
 View my habits
 <ArrowRightIcon className="h-3.5 w-3.5" />
 </Link>
 </div>
 </div>
 )}

 <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-[#a7a7a7]">
 {["Free forever", "No credit card", "Private by default"].map(
 (item) => (
 <span key={item} className="inline-flex items-center gap-1.5">
 <span className="grid h-4 w-4 place-items-center rounded-full bg-[#6798ff]/15 text-white">
 <CheckIcon className="h-2.5 w-2.5" />
 </span>
 {item}
 </span>
 ),
 )}
 </div>
 </div>

 {/* Product visual */}
 <div className="relative mx-auto w-full max-w-md">
 <div className="relative rounded-lg border border-[#313131] bg-[#141414] p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[11px] font-medium font-mono uppercase tracking-[0.08em] text-[#a7a7a7]">
 This week
 </p>
 <p className="mt-1 text-[16px] font-medium text-white">
 Your streak
 </p>
 </div>
 <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6798ff]/10 px-2.5 py-1 text-[11.5px] font-medium text-[#6798ff] ring-1 ring-[#6798ff]/25">
 <FlameIcon className="h-3.5 w-3.5" />
 12 days
 </span>
 </div>

 <div className="mt-5 grid grid-cols-7 gap-1.5">
 {week.map((item, index) => (
 <div key={index} className="text-center">
 <span
 className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-[10px] font-medium ${
 item.done
 ? "bg-[#6798ff] text-white"
 : "border border-dashed border-[#313131] text-[#7c7c7c]"
 }`}
 >
 {item.done ? (
 <CheckIcon className="h-3.5 w-3.5" />
 ) : (
 item.day
 )}
 </span>
 <span className="mt-1 block text-[10px] font-medium text-[#a7a7a7]">
 {item.day}
 </span>
 </div>
 ))}
 </div>

 <div className="mt-6 space-y-2.5">
 {habits.map((habit) => (
 <div
 key={habit.name}
 className="flex items-center gap-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2.5"
 >
 <span
 className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
 habit.done
 ? "bg-[#6798ff] text-white"
 : "border border-[#313131] text-[#7c7c7c]"
 }`}
 >
 {habit.done ? (
 <CheckIcon className="h-3.5 w-3.5" />
 ) : (
 <span className="h-1.5 w-1.5 rounded-full bg-current" />
 )}
 </span>
 <div className="min-w-0 flex-1">
 <p
 className={`truncate text-[12.5px] font-medium ${
 habit.done
 ? "text-[#a7a7a7] line-through"
 : "text-white"
 }`}
 >
 {habit.name}
 </p>
 <p className="text-[10.5px] text-[#a7a7a7]">
 {habit.time}
 </p>
 </div>
 <span
 className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
 habit.done
 ? "bg-[#6798ff]/10 text-[#6798ff]"
 : "bg-[#1e1e1e] text-[#a7a7a7]"
 }`}
 >
 {habit.done ? "Done" : "Today"}
 </span>
 </div>
 ))}
 </div>

 <div className="mt-5">
 <div className="flex items-center justify-between text-[11px] font-medium">
 <span className="text-[#a7a7a7]">
 Weekly progress
 </span>
 <span className="text-[#6798ff]">
 72%
 </span>
 </div>
 <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1e1e1e]">
 <div className="h-full w-[72%] rounded-lg bg-[#6798ff]" />
 </div>
 </div>
 </div>

 <div className="absolute -bottom-7 -left-4 rotate-2 rounded-lg border border-[#313131] bg-[#141414] px-4 py-3">
 <div className="flex items-center gap-2.5">
 <span className="grid h-9 w-9 place-items-center rounded-full bg-[#6798ff]/10 text-[#6798ff]">
 <FlameIcon className="h-[18px] w-[18px]" />
 </span>
 <div>
 <p className="text-[11.5px] font-medium text-white">
 You&apos;re on a roll
 </p>
 <p className="text-[10.5px] text-[#a7a7a7]">
 Best streak: 21 days
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Features */}
 <section
 id="features"
 className="scroll-mt-24 border-t border-[#313131]"
 >
 <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
 <div className="max-w-2xl">
 <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#a7a7a7]">
 Everything you need
 </p>
 <h2 className="mt-3 text-[32px] font-medium tracking-[-0.02em] text-white sm:text-[40px]">
 Built to make consistency feel easy
 </h2>
 <p className="mt-3 text-[14.5px] leading-relaxed text-[#a7a7a7]">
 No overwhelming dashboards or complicated systems. Just the tools
 you need to show up for yourself every day.
 </p>
 </div>

 <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {features.map((feature) => (
 <div
 key={feature.title}
 className="group rounded-lg border border-[#313131] bg-[#141414] p-5 transition hover:-translate-y-0.5 hover:border-[#454545]"
 >
 <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#6798ff]/10 text-[#6798ff] ring-1 ring-[#6798ff]/20 transition group-hover:scale-105">
 <feature.icon className="h-5 w-5" />
 </span>
 <h3 className="mt-4 text-[14px] font-medium text-white">
 {feature.title}
 </h3>
 <p className="mt-2 text-[12.5px] leading-relaxed text-[#a7a7a7]">
 {feature.description}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* How it works */}
 <section
 id="how-it-works"
 className="scroll-mt-24 border-t border-[#313131]"
 >
 <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
 <div className="max-w-2xl">
 <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#a7a7a7]">
 How it works
 </p>
 <h2 className="mt-3 text-[32px] font-medium tracking-[-0.02em] text-white sm:text-[40px]">
 Three steps to a better routine
 </h2>
 </div>

 <div className="mt-10 grid gap-6 md:grid-cols-3">
 {steps.map((step) => (
 <div
 key={step.number}
 className="relative rounded-lg border border-[#313131] bg-[#141414] p-6"
 >
 <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[#a7a7a7]">
 {step.number}
 </span>
 <h3 className="mt-3 text-[15px] font-medium text-white">
 {step.title}
 </h3>
 <p className="mt-2 text-[13px] leading-relaxed text-[#a7a7a7]">
 {step.description}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Closing CTA */}
 {!isAuthenticated && (
 <section className="px-5 py-16 sm:py-20">
 <div className="relative mx-auto max-w-6xl rounded-lg bg-white px-6 py-14 text-center sm:py-16">
 <div className="relative z-10">
 <h2 className="mx-auto max-w-2xl text-[30px] font-medium tracking-[-0.02em] text-[#0a0a0a] sm:text-[40px]">
 Your best year starts with{" "}
 <span>one small habit.</span>
 </h2>
 <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#6b6b6b]">
 Join HabitStreaks today and give yourself the structure to keep
 going — even on the days you don&apos;t feel like it.
 </p>
 <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
 <Link
 to="/register"
 className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] px-6 py-3 text-[14.5px] font-medium text-white transition hover:bg-[#1e1e1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
 >
 Create your free account
 <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
 </Link>
 <Link
 to="/login"
 className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/20 px-6 py-3 text-[14.5px] font-medium text-[#0a0a0a] transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
 >
 Sign in
 </Link>
 </div>
 </div>
 </div>
 </section>
 )}
 </main>

 <footer className="border-t border-[#313131]">
 <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-[12px] text-[#a7a7a7] sm:flex-row">
 <div className="flex items-center gap-2.5">
 <span className="grid h-7 w-7 place-items-center rounded bg-white text-[#0a0a0a]">
 <FlameIcon className="h-3.5 w-3.5" />
 </span>
 <span className="font-medium text-white">
 HabitStreaks
 </span>
 </div>

 <p>© {currentYear} HabitStreaks. All rights reserved.</p>

 <div className="flex items-center gap-4 font-medium">
 <a
 href="#features"
 className="transition hover:text-[#6798ff]"
 >
 Features
 </a>
 {isAuthenticated ? (
 <button
 type="button"
 onClick={signOut}
 className="transition hover:text-[#6798ff]"
 >
 Sign out
 </button>
 ) : (
 <Link
 to="/login"
 className="transition hover:text-[#6798ff]"
 >
 Sign in
 </Link>
 )}
 </div>
 </div>
 </footer>
 </div>
 );
};

export default Home;
