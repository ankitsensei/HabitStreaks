import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  ChartIcon,
  LogoutIcon,
  SlidersIcon,
  SparkIcon,
} from "./Icons";
import { useAuth } from "../lib/auth";
import logo from "../assets/logo_dark.jpeg";

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
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src={logo}
            alt="logo"
            className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#0A84FF] text-white shadow-[0_0_18px_rgba(10,132,255,0.45)]"
          />
          <span className="hidden text-[15px] font-semibold tracking-tight text-[#f5f5f7] sm:inline">
            HabitStreaks
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.06] p-1 backdrop-blur"
            >
              {APP_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  aria-label={label}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 ${
                      isActive
                        ? "bg-white/[0.14] text-white"
                        : "text-[rgba(235,235,245,0.6)] hover:bg-white/[0.08] hover:text-white"
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0A84FF] px-2.5 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_0_18px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60 sm:px-4"
            >
              <SparkIcon className="h-4 w-4" />
              <span className="hidden md:inline">New habit</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.06] text-[rgba(235,235,245,0.6)] transition hover:border-[#FF453A]/40 hover:bg-[#FF453A]/10 hover:text-[#FF453A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF453A]/40"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-6 text-[13px] font-medium text-[rgba(235,235,245,0.6)] md:flex">
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#how-it-works" className="transition hover:text-white">
                How it works
              </a>
            </nav>

            <Link
              to="/login"
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[rgba(235,235,245,0.8)] transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-[#0A84FF] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60"
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
