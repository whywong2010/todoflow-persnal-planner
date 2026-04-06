import type { Todo } from "@/types/todo";

const TODOS_KEY = "todo-next:v1:todos";
const REMINDER_KEYS = "todo-next:v1:reminder-keys";
const REMINDER_STATE = "todo-next:v1:reminder-state";

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") {
    return [];
  }

  const todos = parseJson<Todo[]>(window.localStorage.getItem(TODOS_KEY), []);
  return Array.isArray(todos) ? todos : [];
}

export function saveTodos(todos: Todo[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export function loadReminderKeys(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const keys = parseJson<string[]>(
    window.localStorage.getItem(REMINDER_KEYS),
    [],
  );
  return Array.isArray(keys) ? keys : [];
}

export function saveReminderKeys(keys: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REMINDER_KEYS, JSON.stringify(keys));
}

export function loadReminderState(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }

  const state = parseJson<Record<string, number>>(
    window.localStorage.getItem(REMINDER_STATE),
    {},
  );

  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return {};
  }

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(state)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      normalized[key] = value;
    }
  }
  return normalized;
}

export function saveReminderState(state: Record<string, number>): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REMINDER_STATE, JSON.stringify(state));
}
