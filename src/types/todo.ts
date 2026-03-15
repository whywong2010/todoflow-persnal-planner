export type TodoPriority = "low" | "medium" | "high";

export type TodoStatus = "todo" | "done";

export interface Todo {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  priority: TodoPriority;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TodoFilters {
  query: string;
  priority: "all" | TodoPriority;
  status: "all" | TodoStatus;
  dateFrom: string;
  dateTo: string;
}
