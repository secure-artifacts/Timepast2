export type ViewKey = "today" | "entries" | "notes" | "todos" | "pomodoro" | "settings";

export interface EventType {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  pinned: boolean;
  archived: boolean;
}

export interface TimeEntry {
  id: number;
  entryDate: string;
  startTime: string;
  endTime: string;
  eventTypeId: number;
  eventName: string;
  eventColor: string;
  note: string;
  sourceMode: "manual" | "timer" | "pomodoro";
  createdAt: string;
}

export interface TimeEntryInput {
  id?: number;
  entryDate: string;
  startTime: string;
  endTime: string;
  eventTypeId: number;
  note: string;
  sourceMode: "manual" | "timer" | "pomodoro";
}

export interface StickyNote {
  id: number;
  content: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  pinned: boolean;
  fontSize: number;
  styleJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface StickyNoteInput {
  id?: number;
  content: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  pinned: boolean;
  fontSize: number;
  styleJson: string;
}

export type TodoPriority = "urgent" | "high" | "normal" | "low";

export interface Todo {
  id: number;
  title: string;
  note: string;
  completed: boolean;
  dueAt?: string | null;
  repeatRule: string;
  priority: TodoPriority;
  sortOrder: number;
  linkedNoteId?: number | null;
  createdAt: string;
}

export interface TodoInput {
  id?: number;
  title: string;
  note: string;
  completed: boolean;
  dueAt?: string | null;
  repeatRule: string;
  priority: TodoPriority;
  sortOrder: number;
  linkedNoteId?: number | null;
}

export interface PomodoroSession {
  id: number;
  startedAt: string;
  durationMinutes: number;
  breakMinutes: number;
  status: string;
  linkedTimeEntryId?: number | null;
}

export interface ActiveTimer {
  eventTypeId: number;
  eventName: string;
  eventColor: string;
  startedAt: string;
  note?: string;
}

