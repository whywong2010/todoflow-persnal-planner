"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  loadReminderKeys,
  loadTodos,
  saveReminderKeys,
  saveTodos,
} from "@/lib/todo-storage";
import type { Todo, TodoFilters, TodoPriority } from "@/types/todo";

const REMINDER_WINDOW_MINUTES = 30;
const REMINDER_GRACE_MINUTES = 10;

const PRIORITY_LABEL: Record<TodoPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const PRIORITY_BADGE: Record<TodoPriority, string> = {
  low: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/30",
  high: "bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/35",
};

const EMPTY_FILTERS: TodoFilters = {
  query: "",
  priority: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
};

interface TodoDraft {
  title: string;
  description: string;
  dueAt: string;
  priority: TodoPriority;
}

interface ReminderPopup {
  key: string;
  title: string;
  dueAt: string;
}

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function todayKey(): string {
  return toDateKey(new Date());
}

function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("zh-Hant", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDueLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "時間格式錯誤";
  }

  return new Intl.DateTimeFormat("zh-Hant", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toMonthLabel(value: Date): string {
  return new Intl.DateTimeFormat("zh-Hant", {
    year: "numeric",
    month: "long",
  }).format(value);
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function createMonthGrid(month: Date): Date[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const firstVisible = new Date(monthStart);
  firstVisible.setDate(monthStart.getDate() - monthStart.getDay());

  const lastVisible = new Date(monthEnd);
  lastVisible.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const cells: Date[] = [];
  const cursor = new Date(firstVisible);
  while (cursor <= lastVisible) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

function startDraft(dateKey: string): TodoDraft {
  return {
    title: "",
    description: "",
    dueAt: `${dateKey}T09:00`,
    priority: "medium",
  };
}

function keepTimeAndSetDate(currentDueAt: string, nextDateKey: string): string {
  const current = new Date(currentDueAt);
  if (Number.isNaN(current.getTime())) {
    return `${nextDateKey}T09:00`;
  }

  const hours = String(current.getHours()).padStart(2, "0");
  const minutes = String(current.getMinutes()).padStart(2, "0");
  return `${nextDateKey}T${hours}:${minutes}`;
}

export function TodoApp() {
  const [hydrated, setHydrated] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [monthCursor, setMonthCursor] = useState<Date>(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => todayKey());
  const [filters, setFilters] = useState<TodoFilters>(EMPTY_FILTERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TodoDraft>(() => startDraft(todayKey()));
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reminderPopups, setReminderPopups] = useState<ReminderPopup[]>([]);
  const reminderKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setTodos(loadTodos());
      reminderKeysRef.current = new Set(loadReminderKeys());

      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission);
      }

      if (typeof window !== "undefined") {
        const saved = window.localStorage.getItem("todo-next:v1:sound-enabled");
        if (saved !== null) {
          setSoundEnabled(saved === "1");
        }
      }

      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveTodos(todos);
  }, [hydrated, todos]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      "todo-next:v1:sound-enabled",
      soundEnabled ? "1" : "0",
    );
  }, [hydrated, soundEnabled]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    const checkReminders = (): void => {
      const nowMs = Date.now();
      const windowMs = REMINDER_WINDOW_MINUTES * 60 * 1000;
      const graceMs = REMINDER_GRACE_MINUTES * 60 * 1000;
      let changed = false;

      for (const todo of todos) {
        if (todo.status === "done") {
          continue;
        }

        const dueMs = new Date(todo.dueAt).getTime();
        if (Number.isNaN(dueMs)) {
          continue;
        }

        const untilDue = dueMs - nowMs;
        if (untilDue > windowMs || untilDue < -graceMs) {
          continue;
        }

        const reminderKey = `${todo.id}:${todo.dueAt}`;
        if (reminderKeysRef.current.has(reminderKey)) {
          continue;
        }

        setReminderPopups((current) => {
          if (current.some((popup) => popup.key === reminderKey)) {
            return current;
          }
          return [
            ...current,
            { key: reminderKey, title: todo.title, dueAt: todo.dueAt },
          ];
        });

        try {
          const supportsNotification = "Notification" in window;
          if (supportsNotification && permission === "granted") {
            const isOverdue = untilDue <= 0;
            new Notification(
              isOverdue ? `任務已到期：${todo.title}` : `任務即將到期：${todo.title}`,
              {
                body: isOverdue
                  ? `截止時間 ${toDueLabel(todo.dueAt)}（已超過）`
                  : `截止時間 ${toDueLabel(todo.dueAt)}（提前 ${REMINDER_WINDOW_MINUTES} 分鐘提醒）`,
              },
            );
          }
        } catch {
          // Ignore browser notification errors and still keep in-app popups.
        }

        if (soundEnabled) {
          playReminderTone();
        }

        reminderKeysRef.current.add(reminderKey);
        changed = true;
      }

      if (changed) {
        saveReminderKeys([...reminderKeysRef.current]);
      }
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 30_000);
    return () => window.clearInterval(timer);
  }, [hydrated, permission, todos]);

  function dismissReminderPopup(key: string): void {
    setReminderPopups((current) => current.filter((popup) => popup.key !== key));
  }

  function playReminderTone(): void {
    if (typeof window === "undefined") {
      return;
    }

    const audioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!audioContextClass) {
      return;
    }

    try {
      const context = new audioContextClass();
      const now = context.currentTime;
      const beepPattern = [0, 0.22];

      for (const offset of beepPattern) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now + offset);

        gainNode.gain.setValueAtTime(0.0001, now + offset);
        gainNode.gain.exponentialRampToValueAtTime(0.08, now + offset + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          now + offset + 0.16,
        );

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.18);
      }

      window.setTimeout(() => void context.close(), 900);
    } catch {
      // Ignore audio runtime errors.
    }
  }

  const filteredTodos = useMemo(() => {
    const loweredQuery = filters.query.trim().toLowerCase();

    return todos.filter((todo) => {
      if (loweredQuery) {
        const haystack = `${todo.title} ${todo.description}`.toLowerCase();
        if (!haystack.includes(loweredQuery)) {
          return false;
        }
      }

      if (filters.priority !== "all" && todo.priority !== filters.priority) {
        return false;
      }

      if (filters.status !== "all" && todo.status !== filters.status) {
        return false;
      }

      const key = toDateKey(todo.dueAt);
      if (filters.dateFrom && key < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && key > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [filters, todos]);

  const monthCells = useMemo(() => createMonthGrid(monthCursor), [monthCursor]);

  const summaryByDate = useMemo(() => {
    const summary = new Map<string, { total: number; open: number }>();

    for (const todo of filteredTodos) {
      const key = toDateKey(todo.dueAt);
      const current = summary.get(key) ?? { total: 0, open: 0 };
      current.total += 1;
      if (todo.status === "todo") {
        current.open += 1;
      }
      summary.set(key, current);
    }

    return summary;
  }, [filteredTodos]);

  const selectedTodos = useMemo(() => {
    return filteredTodos
      .filter((todo) => toDateKey(todo.dueAt) === selectedDate)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }, [filteredTodos, selectedDate]);

  const openCount = filteredTodos.filter((todo) => todo.status === "todo")
    .length;

  const doneCount = filteredTodos.length - openCount;

  function resetDraft(dateKey: string): void {
    setEditingId(null);
    setDraft(startDraft(dateKey));
  }

  function setDateAndKeepDraftTime(dateKey: string): void {
    setSelectedDate(dateKey);
    setDraft((current) => ({
      ...current,
      dueAt: keepTimeAndSetDate(current.dueAt, dateKey),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const title = draft.title.trim();
    if (!title || !draft.dueAt) {
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      setTodos((current) =>
        current.map((todo) =>
          todo.id === editingId
            ? {
                ...todo,
                title,
                description: draft.description.trim(),
                dueAt: draft.dueAt,
                priority: draft.priority,
                updatedAt: now,
              }
            : todo,
        ),
      );
    } else {
      const todo: Todo = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        title,
        description: draft.description.trim(),
        dueAt: draft.dueAt,
        priority: draft.priority,
        status: "todo",
        createdAt: now,
        updatedAt: now,
      };

      setTodos((current) => [...current, todo]);
    }

    const nextDate = toDateKey(draft.dueAt) || selectedDate;
    setSelectedDate(nextDate);
    setMonthCursor(startOfMonth(new Date(draft.dueAt)));
    resetDraft(nextDate);
  }

  function handleEdit(todo: Todo): void {
    setEditingId(todo.id);
    setDraft({
      title: todo.title,
      description: todo.description,
      dueAt: todo.dueAt.slice(0, 16),
      priority: todo.priority,
    });

    const key = toDateKey(todo.dueAt);
    if (key) {
      setSelectedDate(key);
      setMonthCursor(startOfMonth(new Date(todo.dueAt)));
    }
  }

  function toggleTodo(id: string): void {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status: todo.status === "done" ? "todo" : "done",
              updatedAt: new Date().toISOString(),
            }
          : todo,
      ),
    );
  }

  function removeTodo(id: string): void {
    setTodos((current) => current.filter((todo) => todo.id !== id));
    if (editingId === id) {
      resetDraft(selectedDate);
    }
  }

  async function requestNotificationPermission(): Promise<void> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.12),transparent_35%),#020617] px-4 py-6 text-slate-100 md:px-8 md:py-10">
      {reminderPopups.length > 0 ? (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,360px)] space-y-2">
          {reminderPopups.map((popup) => (
            <article
              key={popup.key}
              className="rounded-xl border border-amber-300/40 bg-slate-950/95 p-3 shadow-xl"
            >
              <p className="text-xs tracking-[0.12em] text-amber-200">提醒</p>
              <p className="mt-1 text-sm font-semibold text-white">{popup.title}</p>
              <p className="mt-1 text-xs text-slate-300">
                截止 {toDueLabel(popup.dueAt)}（提前 {REMINDER_WINDOW_MINUTES} 分鐘）
              </p>
              <button
                type="button"
                onClick={() => dismissReminderPopup(popup.key)}
                className="mt-2 rounded-lg border border-white/20 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-white/10"
              >
                知道了
              </button>
            </article>
          ))}
        </div>
      ) : null}
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_16px_60px_-20px_rgba(2,132,199,0.5)] backdrop-blur-sm md:p-6">
          <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.25em] text-sky-300/80">
                PERSONAL TODO
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                日曆任務管理
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                用日曆掌握截止時間，聚焦今天要完成的事。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20"
              >
                {permission === "granted"
                  ? "提醒已啟用"
                  : permission === "denied"
                    ? "提醒被封鎖"
                    : "啟用提醒"}
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled((current) => !current)}
                className="rounded-xl border border-teal-400/40 bg-teal-500/10 px-3 py-2 text-sm text-teal-100 transition hover:bg-teal-500/20"
              >
                {soundEnabled ? "聲音已開啟" : "聲音已關閉"}
              </button>
            </div>
          </header>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs text-slate-400">符合篩選</p>
              <p className="mt-1 text-xl font-semibold">{filteredTodos.length}</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs text-slate-400">待完成</p>
              <p className="mt-1 text-xl font-semibold text-amber-200">
                {openCount}
              </p>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs text-slate-400">已完成</p>
              <p className="mt-1 text-xl font-semibold text-emerald-200">
                {doneCount}
              </p>
            </article>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
              placeholder="搜尋標題或描述"
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-sky-400 transition focus:ring-2"
            />
            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  priority: event.target.value as TodoFilters["priority"],
                }))
              }
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-sky-400 transition focus:ring-2"
            >
              <option value="all">全部優先級</option>
              <option value="high">高優先級</option>
              <option value="medium">中優先級</option>
              <option value="low">低優先級</option>
            </select>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as TodoFilters["status"],
                }))
              }
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-sky-400 transition focus:ring-2"
            >
              <option value="all">全部狀態</option>
              <option value="todo">未完成</option>
              <option value="done">已完成</option>
            </select>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateFrom: event.target.value,
                }))
              }
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-sky-400 transition focus:ring-2"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateTo: event.target.value,
                }))
              }
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-sky-400 transition focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              清空篩選
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-lg font-semibold">{toMonthLabel(monthCursor)}</p>
              <p className="text-xs text-slate-400">點選日期查看任務</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm transition hover:bg-white/10"
              >
                上月
              </button>
              <button
                type="button"
                onClick={() => setMonthCursor(startOfMonth(new Date()))}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm transition hover:bg-white/10"
              >
                本月
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm transition hover:bg-white/10"
              >
                下月
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <p key={day}>{day}</p>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {monthCells.map((date) => {
              const key = toDateKey(date);
              const currentMonth = date.getMonth() === monthCursor.getMonth();
              const selected = key === selectedDate;
              const today = key === todayKey();
              const summary = summaryByDate.get(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDateAndKeepDraftTime(key)}
                  className={cn(
                    "min-h-20 rounded-xl border px-2 py-2 text-left transition",
                    currentMonth
                      ? "border-white/15 bg-slate-950/55"
                      : "border-white/5 bg-slate-950/30 text-slate-500",
                    selected && "border-sky-300 bg-sky-500/15",
                    today && "ring-1 ring-emerald-300/60",
                    "hover:border-sky-300/60 hover:bg-sky-500/10",
                  )}
                >
                  <p className="text-xs">{date.getDate()}</p>
                  {summary ? (
                    <div className="mt-2 space-y-1 text-[11px]">
                      <p className="rounded bg-white/8 px-1.5 py-0.5">
                        共 {summary.total}
                      </p>
                      <p className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-100">
                        待辦 {summary.open}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-slate-500">無任務</p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_16px_60px_-24px_rgba(15,118,110,0.6)] backdrop-blur-sm md:p-6">
          <header className="mb-4">
            <p className="text-xs tracking-[0.2em] text-teal-300/80">DAY VIEW</p>
            <h2 className="mt-2 text-xl font-semibold">
              {selectedDate} 的任務 ({selectedTodos.length})
            </h2>
          </header>

          <form onSubmit={handleSubmit} className="mb-5 space-y-3">
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              placeholder="任務標題"
              className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-teal-400 transition focus:ring-2"
            />
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder="任務描述（可選）"
              className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-teal-400 transition focus:ring-2"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={draft.dueAt}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    dueAt: event.target.value,
                  }))
                }
                required
                className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-teal-400 transition focus:ring-2"
              />
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as TodoPriority,
                  }))
                }
                className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-teal-400 transition focus:ring-2"
              >
                <option value="high">高優先級</option>
                <option value="medium">中優先級</option>
                <option value="low">低優先級</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-teal-400"
              >
                {editingId ? "更新任務" : "新增任務"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => resetDraft(selectedDate)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm transition hover:bg-white/10"
                >
                  取消編輯
                </button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            {!hydrated ? (
              <p className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">
                載入任務中...
              </p>
            ) : selectedTodos.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-400">
                這一天沒有符合條件的任務。
              </p>
            ) : (
              selectedTodos.map((todo) => (
                <article
                  key={todo.id}
                  className="rounded-xl border border-white/12 bg-slate-950/70 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className={cn(
                          "font-medium",
                          todo.status === "done" && "text-slate-500 line-through",
                        )}
                      >
                        {todo.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        截止 {toTimeLabel(todo.dueAt)}
                      </p>
                      {todo.description ? (
                        <p className="mt-2 text-sm text-slate-300">
                          {todo.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs",
                        PRIORITY_BADGE[todo.priority],
                      )}
                    >
                      {PRIORITY_LABEL[todo.priority]}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      className="rounded-lg border border-white/20 px-2.5 py-1.5 transition hover:bg-white/10"
                    >
                      {todo.status === "done" ? "改為未完成" : "標記完成"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(todo)}
                      className="rounded-lg border border-white/20 px-2.5 py-1.5 transition hover:bg-white/10"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTodo(todo.id)}
                      className="rounded-lg border border-rose-400/40 px-2.5 py-1.5 text-rose-200 transition hover:bg-rose-500/15"
                    >
                      刪除
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
