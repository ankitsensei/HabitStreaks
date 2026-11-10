import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  PencilIcon,
  SlidersIcon,
  SparkIcon,
  TrashIcon,
} from "../components/Icons";
import DeleteHabitDialog from "../components/DeleteHabitDialog";
import EditHabitModal from "../components/EditHabitModal";
import Navbar from "../components/Navbar";
import {
  ApiError,
  deleteHabit,
  getHabits,
  updateHabit,
} from "../lib/api";
import type { HabitWithCompletions, NewHabitInput } from "../lib/api";
import { clearToken, getToken, useAuth } from "../lib/auth";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLastYearRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 364);

  return { from: formatDateKey(from), to: formatDateKey(to) };
};

const Manage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [habits, setHabits] = useState<HabitWithCompletions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] =
    useState<HabitWithCompletions | null>(null);
  const [deletingHabit, setDeletingHabit] =
    useState<HabitWithCompletions | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    const loadHabits = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { from, to } = getLastYearRange();
        const result = await getHabits(token, from, to);

        if (!cancelled) {
          setHabits(result.habits);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403)
        ) {
          clearToken();
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load your habits. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadHabits();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, navigate]);

  const handleSaveHabit = async (input: NewHabitInput) => {
    if (!editingHabit) {
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const result = await updateHabit(token, editingHabit.id, input);

      setHabits((current) =>
        current.map((item) =>
          item.id === result.habit.id
            ? { ...result.habit, completions: item.completions }
            : item,
        ),
      );
      setEditingHabit(null);
      setNotice(`“${result.habit.name}” was updated.`);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        clearToken();
        navigate("/login", { replace: true });
      }

      throw err;
    }
  };

  const handleDeleteHabit = async () => {
    if (!deletingHabit) {
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      await deleteHabit(token, deletingHabit.id);

      setHabits((current) =>
        current.filter((item) => item.id !== deletingHabit.id),
      );
      setNotice(`“${deletingHabit.name}” was deleted.`);
      setDeletingHabit(null);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        clearToken();
        navigate("/login", { replace: true });
      }

      throw err;
    }
  };

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
            Edit or delete any habit from one place. Drag-to-reorder is coming
            next.
          </p>

          {notice && (
            <div
              role="status"
              className="mt-6 flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-emerald-700/70 transition hover:bg-emerald-100 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 dark:text-emerald-200/70 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-100"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 flex items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-white/80 px-6 py-16 text-[13px] font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 dark:border-white/20 dark:border-t-brand-300" />
              Loading your habits…
            </div>
          ) : habits.length === 0 ? (
            <div className="mt-8 rounded-[26px] border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-white/15 dark:bg-white/[0.02]">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20">
                <SlidersIcon className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-[20px] font-bold text-slate-900 dark:text-white">
                No habits to manage yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                Create your first habit, then come back here to edit it.
              </p>
              <Link
                to="/newhabit"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-5 py-3 text-[13.5px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 dark:focus-visible:ring-brand-500/40"
              >
                <SparkIcon className="h-4 w-4" />
                New habit
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {habits.map((habit) => (
                <article
                  key={habit.id}
                  className="flex items-center gap-4 rounded-[20px] border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur transition hover:border-brand-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-400/30 sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px]"
                    style={{ backgroundColor: `${habit.color}1f` }}
                  >
                    {habit.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
                      {habit.name}
                    </h2>
                    <p className="mt-0.5 truncate text-[11.5px] text-slate-500 dark:text-slate-400">
                      {habit.category} · {habit.target_per_week}× per week
                    </p>
                  </div>

                  <span
                    title="Check-ins in the last 12 months"
                    className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300 sm:inline"
                  >
                    {habit.completions.length}{" "}
                    {habit.completions.length === 1 ? "day" : "days"}
                  </span>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingHabit(habit)}
                      aria-label={`Edit ${habit.name}`}
                      title="Edit habit"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-200 dark:focus-visible:ring-brand-500/20"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingHabit(habit)}
                      aria-label={`Delete ${habit.name}`}
                      title="Delete habit"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:focus-visible:ring-rose-500/20"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={handleSaveHabit}
        />
      )}

      {deletingHabit && (
        <DeleteHabitDialog
          habit={deletingHabit}
          onClose={() => setDeletingHabit(null)}
          onConfirm={handleDeleteHabit}
        />
      )}
    </div>
  );
};

export default Manage;
