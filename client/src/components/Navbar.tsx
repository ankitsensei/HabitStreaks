import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  ChartIcon,
  FlameIcon,
  LogoutIcon,
  SlidersIcon,
  SparkIcon,
} from "./Icons";
import { useAuth } from "../lib/auth";

const APP_LINKS = [
  { to: "/habits", label: "Calendar", icon: CalendarIcon },
  { to: "/statistics", label: "Statistics", icon: ChartIcon },
  { to: "/manage", label: "Manage", icon: SlidersIcon },
] as const;

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f6f4fb]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0910]/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30">
            <FlameIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="hidden text-[16px] font-bold tracking-tight sm:inline">
            HabitStreaks
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
            >
              {APP_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  aria-label={label}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[12.5px] font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 dark:focus-visible:ring-brand-500/25 ${
                      isActive
                        ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-400/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            <Link
              to="/newhabit"
              aria-label="New habit"
              title="New habit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-600 px-2.5 py-2 text-[12.5px] font-semibold text-white shadow-md shadow-brand-600/25 transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 dark:focus-visible:ring-brand-500/40 sm:px-4"
            >
              <SparkIcon className="h-4 w-4" />
              <span className="hidden md:inline">New habit</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:focus-visible:ring-rose-500/20"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
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
  );
};

export default Navbar;
