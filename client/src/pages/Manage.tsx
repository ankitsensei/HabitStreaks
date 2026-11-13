import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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
  const [dropHint, setDropHint] = useState<{
    id: number;
    place: "before" | "after";
  } | null>(null);
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
    setDropHint(null);
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

  // The whole row is draggable; dragging from the action buttons is cancelled
  // so clicks never turn into accidental drags.
  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    habit: HabitWithCompletions,
  ) => {
    if ((event.target as HTMLElement).closest("button")) {
      event.preventDefault();
      return;
    }

    dragStartHabitsRef.current = habits;
    setDraggingId(habit.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(habit.id));
    event.dataTransfer.setDragImage(event.currentTarget, 24, 24);
  };

  // The insertion point is whichever half of the hovered row the pointer is
  // in, so the blue line always shows exactly where the habit will land.
  const getDropPlace = (event: DragEvent<HTMLElement>): "before" | "after" => {
    const rect = event.currentTarget.getBoundingClientRect();

    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  };

  const handleDragOver = (
    event: DragEvent<HTMLElement>,
    habitId: number,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const place = getDropPlace(event);

    setDropHint((current) =>
      current?.id === habitId && current.place === place
        ? current
        : { id: habitId, place },
    );
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetId: number) => {
    event.preventDefault();

    const place = getDropPlace(event);
    const draggedId =
      draggingId ?? Number(event.dataTransfer.getData("text/plain"));
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
    const targetIndex = habits.findIndex((habit) => habit.id === targetId);

    if (fromIndex === -1 || targetIndex === -1) {
      return;
    }

    // Remove first, then find the target's shifted index, so dropping "after"
    // lands the habit directly below the row it was dropped on.
    const next = [...habits];
    const [moved] = next.splice(fromIndex, 1);
    let toIndex = next.findIndex((habit) => habit.id === targetId);

    if (place === "after") {
      toIndex += 1;
    }

    next.splice(toIndex, 0, moved);

    setHabits(next);
    void saveOrder(next, previous);
  };

  // Keyboard- and touch-friendly fallback: swap with the adjacent habit.
  const moveHabit = (habitId: number, direction: -1 | 1) => {
    const index = habits.findIndex((habit) => habit.id === habitId);
    const nextIndex = index + direction;

    if (index === -1 || nextIndex < 0 || nextIndex >= habits.length) {
      return;
    }

    const previous = habits;
    const next = [...habits];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    setHabits(next);
    void saveOrder(next, previous);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-svh bg-black text-[#f5f5f7]">
      <Navbar />

      <main>
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-5 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11.5px] font-medium text-[#66AFFF] backdrop-blur">
                <SlidersIcon className="h-3.5 w-3.5 text-[#FF9F0A]" />
                Manage
              </span>

              <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#f5f5f7] sm:text-[28px]">
                Manage your habits
              </h1>
              <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-[rgba(235,235,245,0.6)]">
                Drag to reorder — it carries over to your Calendar. You can
                also edit or delete any habit.
              </p>
            </div>

            <Link
              to="/newhabit"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#0A84FF] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60"
            >
              <SparkIcon className="h-3.5 w-3.5" />
              New habit
            </Link>
          </div>

          {notice && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#30D158]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#30D158] ring-1 ring-[#30D158]/25"
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
              className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#FF453A]/10 px-3.5 py-3 text-[12.5px] font-medium leading-relaxed text-[#FF6961] ring-1 ring-[#FF453A]/25"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-[#1c1c1e] px-6 py-10 text-[13px] font-medium text-[rgba(235,235,245,0.6)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#0A84FF]" />
              Loading your habits…
            </div>
          ) : habits.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#0A84FF]/10 text-[#409AFF] ring-1 ring-[#0A84FF]/20">
                <SlidersIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-[16px] font-bold text-[#f5f5f7]">
                No habits to manage yet
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-[rgba(235,235,245,0.55)]">
                Create your first habit, then come back here to edit it.
              </p>
              <Link
                to="/newhabit"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0A84FF] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#3395FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60"
              >
                <SparkIcon className="h-3.5 w-3.5" />
                New habit
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1c1c1e]">
              {habits.map((habit) => {
                const isFirst = habit.id === habits[0].id;
                const isLast = habit.id === habits[habits.length - 1].id;

                return (
                  <article
                    key={habit.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, habit)}
                    onDragEnd={resetDragState}
                    onDragOver={(event) => handleDragOver(event, habit.id)}
                    onDrop={(event) => handleDrop(event, habit.id)}
                    className={`group relative flex items-center gap-2.5 px-3 py-2.5 transition sm:px-4 ${
                      isFirst ? "" : "border-t border-white/[0.06]"
                    } ${
                      draggingId === habit.id ? "opacity-40" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {dropHint?.id === habit.id && dropHint.place === "before" && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[#0A84FF]"
                      />
                    )}
                    {dropHint?.id === habit.id && dropHint.place === "after" && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-[#0A84FF]"
                      />
                    )}

                    <span
                      title="Drag to reorder"
                      className="grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded-md text-[rgba(235,235,245,0.3)] transition group-hover:text-[rgba(235,235,245,0.55)] active:cursor-grabbing"
                    >
                      <GripIcon className="h-4 w-4" />
                    </span>

                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[17px]"
                      style={{ backgroundColor: `${habit.color}1f` }}
                    >
                      {habit.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[13.5px] font-semibold text-[#f5f5f7]">
                        {habit.name}
                      </h2>
                      <p className="mt-0 truncate text-[11px] text-[rgba(235,235,245,0.55)]">
                        {habit.category} · {habit.target_per_week}× per week
                      </p>
                    </div>

                    <span
                      title="Check-ins in the last 12 months"
                      className="hidden shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10.5px] font-semibold text-[rgba(235,235,245,0.65)] sm:inline"
                    >
                      {habit.completions.length}{" "}
                      {habit.completions.length === 1 ? "day" : "days"}
                    </span>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveHabit(habit.id, -1)}
                        disabled={isFirst}
                        aria-label={`Move ${habit.name} up`}
                        title="Move up"
                        className="grid h-7 w-7 place-items-center rounded-md text-[rgba(235,235,245,0.55)] transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50 disabled:pointer-events-none disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      >
                        <ChevronUpIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHabit(habit.id, 1)}
                        disabled={isLast}
                        aria-label={`Move ${habit.name} down`}
                        title="Move down"
                        className="grid h-7 w-7 place-items-center rounded-md text-[rgba(235,235,245,0.55)] transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50 disabled:pointer-events-none disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      >
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingHabit(habit)}
                        aria-label={`Edit ${habit.name}`}
                        title="Edit habit"
                        className="grid h-8 w-8 place-items-center rounded-md text-[rgba(235,235,245,0.6)] transition hover:bg-[#0A84FF]/15 hover:text-[#409AFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingHabit(habit)}
                        aria-label={`Delete ${habit.name}`}
                        title="Delete habit"
                        className="grid h-8 w-8 place-items-center rounded-md text-[rgba(235,235,245,0.6)] transition hover:bg-[#FF453A]/15 hover:text-[#FF6961] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF453A]/50"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
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
