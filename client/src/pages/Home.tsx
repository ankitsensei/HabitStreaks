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
    <div className="min-h-svh bg-black text-[#f5f5f7]">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11.5px] font-medium text-[#66AFFF] backdrop-blur">
                <FlameIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
                Build better habits, one day at a time
              </span>

              <h1 className="mt-5 text-[38px] font-bold leading-[1.05] tracking-tight text-[#f5f5f7] sm:text-[52px]">
                Small habits.
                <br />
                <span className="text-[#409AFF]">Unbreakable streaks.</span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[rgba(235,235,245,0.6)] sm:text-[16px]">
                HabitStreaks helps you check in daily, protect your momentum, and
                see the progress you&apos;ve worked for — all in one calm,
                focused place. Track what matters and let the streak do the
                motivating.
              </p>

              {isAuthenticated && user && (
                <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#1c1c1e] p-4 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.8)]">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0A84FF] text-[15px] font-bold text-white shadow-[0_0_20px_rgba(10,132,255,0.4)]">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#f5f5f7]">
                      <span className="truncate">{user.email}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#30D158]/10 px-2 py-0.5 text-[10px] font-bold text-[#30D158] ring-1 ring-[#30D158]/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#30D158]" />
                        Signed in
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] text-[rgba(235,235,245,0.55)]">
                      Welcome back. Your next streak starts today.
                    </p>
                    <Link
                      to="/habits"
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#409AFF] transition hover:text-[#66AFFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
                    >
                      View my habits
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-[rgba(235,235,245,0.55)]">
                {["Free forever", "No credit card", "Private by default"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-[#30D158]/15 text-[#30D158]">
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
              <div className="relative rounded-[26px] border border-white/[0.08] bg-[#1c1c1e] p-6 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(235,235,245,0.4)]">
                      This week
                    </p>
                    <p className="mt-1 text-[16px] font-bold text-[#f5f5f7]">
                      Your streak
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF9F0A]/10 px-2.5 py-1 text-[11.5px] font-bold text-[#FF9F0A] ring-1 ring-[#FF9F0A]/25">
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
                            ? "bg-[#0A84FF] text-white shadow-[0_2px_8px_rgba(10,132,255,0.4)]"
                            : "border border-dashed border-white/15 text-[rgba(235,235,245,0.35)]"
                        }`}
                      >
                        {item.done ? (
                          <CheckIcon className="h-3.5 w-3.5" />
                        ) : (
                          item.day
                        )}
                      </span>
                      <span className="mt-1 block text-[10px] font-medium text-[rgba(235,235,245,0.4)]">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2.5">
                  {habits.map((habit) => (
                    <div
                      key={habit.name}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5"
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                          habit.done
                            ? "bg-[#30D158] text-white"
                            : "border border-white/15 text-[rgba(235,235,245,0.35)]"
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
                              ? "text-[rgba(235,235,245,0.5)] line-through"
                              : "text-[#e5e5ea]"
                          }`}
                        >
                          {habit.name}
                        </p>
                        <p className="text-[10.5px] text-[rgba(235,235,245,0.4)]">
                          {habit.time}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          habit.done
                            ? "bg-[#30D158]/10 text-[#30D158]"
                            : "bg-white/[0.08] text-[rgba(235,235,245,0.6)]"
                        }`}
                      >
                        {habit.done ? "Done" : "Today"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-[rgba(235,235,245,0.55)]">
                      Weekly progress
                    </span>
                    <span className="text-[#409AFF]">
                      72%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full w-[72%] rounded-full bg-[#0A84FF]" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-7 -left-4 rotate-2 rounded-2xl border border-white/[0.08] bg-[#2c2c2e] px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A]">
                    <FlameIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-bold text-[#f5f5f7]">
                      You&apos;re on a roll
                    </p>
                    <p className="text-[10.5px] text-[rgba(235,235,245,0.55)]">
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
          className="scroll-mt-24 border-t border-white/[0.08]"
        >
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A84FF]">
                Everything you need
              </p>
              <h2 className="mt-3 text-[28px] font-bold tracking-tight text-[#f5f5f7] sm:text-[36px]">
                Built to make consistency feel easy
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                No overwhelming dashboards or complicated systems. Just the tools
                you need to show up for yourself every day.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/[0.08] bg-[#1c1c1e] p-5 transition hover:-translate-y-0.5 hover:border-[#0A84FF]/40"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#0A84FF]/10 text-[#409AFF] ring-1 ring-[#0A84FF]/20 transition group-hover:scale-105">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[14px] font-bold text-[#f5f5f7]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[rgba(235,235,245,0.55)]">
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
          className="scroll-mt-24 border-t border-white/[0.08]"
        >
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A84FF]">
                How it works
              </p>
              <h2 className="mt-3 text-[28px] font-bold tracking-tight text-[#f5f5f7] sm:text-[36px]">
                Three steps to a better routine
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-white/[0.08] bg-[#1c1c1e] p-6"
                >
                  <span className="text-[13px] font-bold tracking-[0.12em] text-[#409AFF]/70">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-[15px] font-bold text-[#f5f5f7]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[rgba(235,235,245,0.55)]">
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
            <div className="relative mx-auto max-w-6xl rounded-[28px] border border-white/[0.08] bg-[#1c1c1e] px-6 py-14 text-center sm:py-16">
              <div className="relative z-10">
                <h2 className="mx-auto max-w-2xl text-[28px] font-bold tracking-tight text-white sm:text-[38px]">
                  Your best year starts with{" "}
                  <span className="text-[#409AFF]">one small habit.</span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                  Join HabitStreaks today and give yourself the structure to keep
                  going — even on the days you don&apos;t feel like it.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#0A84FF] px-6 py-3 text-[14.5px] font-semibold text-white shadow-[0_0_30px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40"
                  >
                    Create your free account
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-6 py-3 text-[14.5px] font-semibold text-white backdrop-blur transition hover:bg-white/[0.14] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-[12px] text-[rgba(235,235,245,0.55)] sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#0A84FF] text-white">
              <FlameIcon className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold text-[#e5e5ea]">
              HabitStreaks
            </span>
          </div>

          <p>© {currentYear} HabitStreaks. All rights reserved.</p>

          <div className="flex items-center gap-4 font-medium">
            <a
              href="#features"
              className="transition hover:text-[#409AFF]"
            >
              Features
            </a>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={signOut}
                className="transition hover:text-[#409AFF]"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                className="transition hover:text-[#409AFF]"
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
