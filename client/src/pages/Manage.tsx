import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  GripIcon,
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
  reorderHabits,
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
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragStartHabitsRef = useRef<HabitWithCompletions[] | null>(null);
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

  const resetDragState = () => {
    dragStartHabitsRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const saveOrder = async (
    next: HabitWithCompletions[],
    previous: HabitWithCompletions[],
  ) => {
    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      await reorderHabits(
        token,
        next.map((habit) => habit.id),
      );
      setNotice("Habit order updated.");
    } catch (err) {
      setHabits(previous);

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
          : "Couldn't save the new habit order. Please try again.",
      );
    }
  };

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    habit: HabitWithCompletions,
  ) => {
    dragStartHabitsRef.current = habits;
    setDraggingId(habit.id);
    setDragOverId(habit.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(habit.id));

    const row = event.currentTarget.closest("article");

    if (row) {
      event.dataTransfer.setDragImage(row, 24, 24);
    }
  };

  const handleDragOver = (
    event: DragEvent<HTMLElement>,
    habitId: number,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId((current) => (current === habitId ? current : habitId));
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetId: number) => {
    event.preventDefault();

    const rawId = event.dataTransfer.getData("text/plain");
    const draggedId = draggingId ?? Number(rawId);
    const previous = dragStartHabitsRef.current ?? habits;

    resetDragState();

    if (
      !Number.isInteger(draggedId) ||
      draggedId <= 0 ||
      draggedId === targetId
    ) {
      return;
    }

    const fromIndex = habits.findIndex((habit) => habit.id === draggedId);
    const toIndex = habits.findIndex((habit) => habit.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const next = [...habits];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setHabits(next);
    void saveOrder(next, previous);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-svh bg-black text-[#f5f5f7]">
      <Navbar />

      <main className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#0A84FF]/15 blur-[120px]" />
          <div className="absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-[#BF5AF2]/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11.5px] font-medium text-[#66AFFF] backdrop-blur">
            <SlidersIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
            Manage
          </span>

          <h1 className="mt-4 text-[30px] font-bold tracking-tight text-[#f5f5f7] sm:text-[36px]">
            Manage your habits
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[rgba(235,235,245,0.6)]">
            Drag habits into the order you want — it carries over to your
            Calendar. You can also edit or delete any habit.
          </p>

          {notice && (
            <div
              role="status"
              className="mt-6 flex items-start gap-2.5 rounded-xl bg-[#30D158]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#30D158] ring-1 ring-[#30D158]/25"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#30D158]/70 transition hover:bg-[#30D158]/15 hover:text-[#30D158] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30D158]/40"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 flex items-center justify-center gap-3 rounded-[22px] border border-white/[0.08] bg-[#1c1c1e] px-6 py-16 text-[13px] font-medium text-[rgba(235,235,245,0.6)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#0A84FF]" />
              Loading your habits…
            </div>
          ) : habits.length === 0 ? (
            <div className="mt-8 rounded-[26px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] bg-[#0A84FF]/10 text-[#409AFF] ring-1 ring-[#0A84FF]/20">
                <SlidersIcon className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-[20px] font-bold text-[#f5f5f7]">
                No habits to manage yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[rgba(235,235,245,0.55)]">
                Create your first habit, then come back here to edit it.
              </p>
              <Link
                to="/newhabit"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_0_20px_rgba(10,132,255,0.35)] transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60"
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
                  onDragOver={(event) => handleDragOver(event, habit.id)}
                  onDrop={(event) => handleDrop(event, habit.id)}
                  className={`flex items-center gap-3 rounded-[20px] border bg-[#1c1c1e] p-4 shadow-[0_16px_32px_-24px_rgba(0,0,0,0.8)] transition sm:gap-4 sm:p-5 ${
                    dragOverId === habit.id && draggingId !== habit.id
                      ? "border-[#0A84FF]/60 ring-2 ring-[#0A84FF]/25"
                      : "border-white/[0.08] hover:border-white/[0.16]"
                  } ${draggingId === habit.id ? "opacity-50" : ""}`}
                >
                  <span
                    draggable
                    onDragStart={(event) => handleDragStart(event, habit)}
                    onDragEnd={resetDragState}
                    title="Drag to reorder"
                    aria-label={`Reorder ${habit.name}`}
                    className="grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded-md text-[rgba(235,235,245,0.35)] transition hover:bg-white/[0.08] hover:text-[rgba(235,235,245,0.7)] active:cursor-grabbing"
                  >
                    <GripIcon className="h-4 w-4" />
                  </span>

                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px]"
                    style={{ backgroundColor: `${habit.color}1f` }}
                  >
                    {habit.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-bold text-[#f5f5f7]">
                      {habit.name}
                    </h2>
                    <p className="mt-0.5 truncate text-[11.5px] text-[rgba(235,235,245,0.55)]">
                      {habit.category} · {habit.target_per_week}× per week
                    </p>
                  </div>

                  <span
                    title="Check-ins in the last 12 months"
                    className="hidden shrink-0 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[rgba(235,235,245,0.65)] sm:inline"
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
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-[12.5px] font-semibold text-[rgba(235,235,245,0.8)] transition hover:border-[#0A84FF]/40 hover:bg-[#0A84FF]/15 hover:text-[#409AFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingHabit(habit)}
                      aria-label={`Delete ${habit.name}`}
                      title="Delete habit"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-[12.5px] font-semibold text-[rgba(235,235,245,0.8)] transition hover:border-[#FF453A]/40 hover:bg-[#FF453A]/10 hover:text-[#FF6961] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF453A]/50"
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
