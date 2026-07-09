/**
 * Portal content (Phases 5-7). Data intentionally left EMPTY — populate these
 * arrays with real content when ready. The pages render an empty state until
 * then, and light up automatically once you add entries. Types + helpers stay.
 */

// ── Orientation ──────────────────────────────────────────────────────────────
export const ORIENTATION_CHECKLIST: { label: string; note?: string }[] = [];
export const CORE_VALUES: string[] = [];
export const CODE_OF_CONDUCT: { n: number; text: string; heavy?: boolean }[] = [];

// ── Notices ──────────────────────────────────────────────────────────────────
export interface Notice {
  id: string;
  date: string;
  title: string;
  body: string;
  tone: 'routine' | 'odd';
}

export const NOTICES: Notice[] = [];

// ── Personnel / org chart ────────────────────────────────────────────────────
export interface Person {
  name: string;
  role: string;
  note?: string;
}
export interface Department {
  name: string;
  head: Person;
  members: Person[];
}

export const ORG: Department[] = [];

// ── Assignments ──────────────────────────────────────────────────────────────
export type TaskStatus = 'open' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  detail: string;
  heavy?: boolean;
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Open',
  'in-progress': 'In progress',
  done: 'Done',
};

/** Cycle a task's status (client-only theatre — never persisted). */
export function advanceStatus(s: TaskStatus): TaskStatus {
  return s === 'open' ? 'in-progress' : s === 'in-progress' ? 'done' : 'open';
}

export const ASSIGNMENTS: Task[] = [];
