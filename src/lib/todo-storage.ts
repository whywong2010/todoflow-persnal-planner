import type { Todo } from "@/types/todo";

const TODOS_KEY = "todo-next:v1:todos";
const REMINDER_KEYS = "todo-next:v1:reminder-keys";

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
