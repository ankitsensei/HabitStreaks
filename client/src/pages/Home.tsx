import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  FlameIcon,
  LogoutIcon,
  ShieldIcon,
  SparkIcon,
} from "../components/Icons";
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
    <div className="min-h-svh bg-[#f6f4fb] text-slate-900 dark:bg-[#0a0910] dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f6f4fb]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0910]/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30">
              <FlameIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[16px] font-bold tracking-tight">
              HabitStreaks
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-medium text-slate-600 md:flex dark:text-slate-300">
            <a
              href="#features"
              className="transition hover:text-brand-700 dark:hover:text-brand-300"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition hover:text-brand-700 dark:hover:text-brand-300"
            >
              How it works
            </a>
          </nav>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/newhabit"
                aria-label="Add a new habit"
                title="Add a new habit"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-md shadow-brand-600/25 transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 dark:focus-visible:ring-brand-500/40 sm:px-4"
              >
                <SparkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">New habit</span>
              </Link>
              <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-[11px] font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[170px] truncate text-[12px] font-semibold sm:block">
                  {user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:focus-visible:ring-rose-500/20"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/10"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-brand-600 to-fuchsia-600 px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-brand-600/25 transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-brand-300/30 blur-[120px] dark:bg-brand-600/20" />
            <div className="absolute -right-24 top-32 h-[380px] w-[380px] rounded-full bg-fuchsia-300/25 blur-[120px] dark:bg-fuchsia-600/15" />
            <div
              className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(124,58,237,0.18) 1px, transparent 0)",
                backgroundSize: "26px 26px",
              }}
            />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-[11.5px] font-semibold text-brand-700 shadow-sm backdrop-blur dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200">
                <FlameIcon className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-300" />
                Build better habits, one day at a time
              </span>

              <h1 className="mt-5 text-[38px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[52px] dark:text-white">
                Small habits.
                <br />
                <span className="bg-gradient-to-r from-brand-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent dark:from-brand-300 dark:via-fuchsia-300 dark:to-amber-200">
                  Unbreakable streaks.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px] dark:text-slate-400">
                HabitStreaks helps you check in daily, protect your momentum, and
                see the progress you&apos;ve worked for — all in one calm,
                focused place. Track what matters and let the streak do the
                motivating.
              </p>

              {isAuthenticated && user && (
                <div className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-[15px] font-bold text-white shadow-lg shadow-brand-500/25">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-slate-900 dark:text-white">
                      <span className="truncate">{user.email}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Signed in
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                      Welcome back. Your next streak starts today.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                {["Free forever", "No credit card", "Private by default"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
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
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-400/25 via-fuchsia-400/15 to-amber-300/25 blur-2xl"
              />

              <div className="relative -rotate-1 rounded-[26px] border border-white/80 bg-white p-6 shadow-[0_30px_70px_-30px_rgba(76,29,149,0.45)] dark:border-white/10 dark:bg-[#15131f]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                      This week
                    </p>
                    <p className="mt-1 text-[16px] font-bold text-slate-900 dark:text-white">
                      Your streak
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
                    <FlameIcon className="h-3.5 w-3.5" />
                    12 days
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-1.5">
                  {week.map((item, index) => (
                    <div key={index} className="text-center">
                      <span
                        className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold ${
                          item.done
                            ? "bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-sm shadow-brand-500/30"
                            : "border border-dashed border-slate-300 text-slate-300 dark:border-white/15 dark:text-slate-600"
                        }`}
                      >
                        {item.done ? (
                          <CheckIcon className="h-3.5 w-3.5" />
                        ) : (
                          item.day
                        )}
                      </span>
                      <span className="mt-1 block text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2.5">
                  {habits.map((habit) => (
                    <div
                      key={habit.name}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]"
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                          habit.done
                            ? "bg-emerald-500 text-white"
                            : "border border-slate-300 text-slate-300 dark:border-white/15 dark:text-slate-600"
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
                          className={`truncate text-[12.5px] font-semibold ${
                            habit.done
                              ? "text-slate-500 line-through dark:text-slate-400"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {habit.name}
                        </p>
                        <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
                          {habit.time}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          habit.done
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {habit.done ? "Done" : "Today"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Weekly progress
                    </span>
                    <span className="text-brand-700 dark:text-brand-300">
                      72%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-7 -left-4 rotate-2 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-xl shadow-brand-900/10 dark:border-white/10 dark:bg-[#1b1828]">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
                    <FlameIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-bold text-slate-900 dark:text-white">
                      You&apos;re on a roll
                    </p>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
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
          className="scroll-mt-24 border-t border-slate-200/70 dark:border-white/10"
        >
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
                Everything you need
              </p>
              <h2 className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 sm:text-[36px] dark:text-white">
                Built to make consistency feel easy
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600 dark:text-slate-400">
                No overwhelming dashboards or complicated systems. Just the tools
                you need to show up for yourself every day.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-400/30"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition group-hover:scale-105 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[14px] font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
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
          className="scroll-mt-24 border-t border-slate-200/70 bg-white/50 dark:border-white/10 dark:bg-white/[0.015]"
        >
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
                How it works
              </p>
              <h2 className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 sm:text-[36px] dark:text-white">
                Three steps to a better routine
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <span className="text-[13px] font-extrabold tracking-[0.12em] text-brand-400 dark:text-brand-300/70">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-[15px] font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
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
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[#160f2b] px-6 py-14 text-center sm:py-16">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/45 blur-3xl" />
                <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-fuchsia-600/35 blur-3xl" />
                <div
                  className="absolute inset-0 opacity-[0.14]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "22px 22px",
                  }}
                />
              </div>

              <div className="relative z-10">
                <h2 className="mx-auto max-w-2xl text-[28px] font-bold tracking-tight text-white sm:text-[38px]">
                  Your best year starts with{" "}
                  <span className="bg-gradient-to-r from-brand-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
                    one small habit.
                  </span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-white/60">
                  Join HabitStreaks today and give yourself the structure to keep
                  going — even on the days you don&apos;t feel like it.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[14.5px] font-semibold text-brand-800 shadow-lg transition hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                  >
                    Create your free account
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3.5 text-[14.5px] font-semibold text-white backdrop-blur transition hover:bg-white/[0.12] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200/70 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-[12px] text-slate-500 sm:flex-row dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white">
              <FlameIcon className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              HabitStreaks
            </span>
          </div>

          <p>© {currentYear} HabitStreaks. All rights reserved.</p>

          <div className="flex items-center gap-4 font-medium">
            <a
              href="#features"
              className="transition hover:text-brand-700 dark:hover:text-brand-300"
            >
              Features
            </a>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={signOut}
                className="transition hover:text-brand-700 dark:hover:text-brand-300"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                className="transition hover:text-brand-700 dark:hover:text-brand-300"
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
