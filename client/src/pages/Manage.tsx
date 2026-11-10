import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CalendarIcon,
  PencilIcon,
  SlidersIcon,
} from "../components/Icons";
import Navbar from "../components/Navbar";
import { useAuth } from "../lib/auth";

const upcoming = [
  "Edit any habit from one place",
  "Delete habits you no longer need",
  "Drag and drop to reorder your habits",
];

const Manage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-svh bg-[#f6f4fb] text-slate-900 dark:bg-[#0a0910] dark:text-slate-100">
      <Navbar />

      <main className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-brand-300/30 blur-[120px] dark:bg-brand-600/20" />
          <div className="absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-fuchsia-300/25 blur-[120px] dark:bg-fuchsia-600/15" />
        </div>

        <div className="relative mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-[11.5px] font-semibold text-brand-700 shadow-sm backdrop-blur dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200">
            <SlidersIcon className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-300" />
            Manage
          </span>

          <h1 className="mt-4 text-[30px] font-extrabold tracking-tight text-slate-900 sm:text-[36px] dark:text-white">
            Manage your habits
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
            One place to edit, remove, and organize the habits you&apos;re
            tracking.
          </p>

          <div className="mt-8 rounded-[26px] border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-white/15 dark:bg-white/[0.02]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
              <PencilIcon className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-[20px] font-bold text-slate-900 dark:text-white">
              Habit management is coming soon
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              This page will let you take full control of your habit list:
            </p>

            <ul className="mx-auto mt-6 max-w-md space-y-2.5 text-left">
              {upcoming.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-[12.5px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                >
                  <SlidersIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-500 dark:text-fuchsia-300" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/habits"
              className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:focus-visible:ring-white/10"
            >
              <CalendarIcon className="h-4 w-4" />
              Back to Calendar
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Manage;
