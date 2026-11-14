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
    <header className="sticky top-0 z-40 border-b border-[#1e1e1e] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src={logo} alt="HabitStreaks" className="h-8 w-8 rounded-lg" />
          <span className="hidden text-[15px] font-medium tracking-[-0.01em] text-white sm:inline">
            HabitStreaks
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-0.5 rounded-full bg-[#141414] p-1"
            >
              {APP_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  aria-label={label}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]/60 ${
                      isActive
                        ? "bg-[#1e1e1e] text-white"
                        : "text-[#a7a7a7] hover:text-white"
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:px-4"
            >
              <SparkIcon className="h-4 w-4" />
              <span className="hidden md:inline">New habit</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#454545] bg-transparent text-[#a7a7a7] transition hover:border-white hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 text-[13px] font-medium md:flex">
              <a
                href="#features"
                className="rounded-full px-3.5 py-2 text-[#a7a7a7] transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="rounded-full px-3.5 py-2 text-[#a7a7a7] transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                How it works
              </a>
            </nav>

            <Link
              to="/login"
              className="rounded-full px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-[#1e1e1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition hover:bg-[#d4d4d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
