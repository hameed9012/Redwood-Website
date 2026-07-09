/**
 * Static lore for the employee portal (Phase 5). In-fiction, deadpan-sinister
 * corporate voice. Nothing here is real; nothing persists.
 */

// ── Orientation ──────────────────────────────────────────────────────────────
export const ORIENTATION_CHECKLIST: { label: string; note?: string }[] = [
  { label: 'Collect your access card from the front desk' },
  { label: 'Read the Code of Conduct in full', note: 'All of it. Including the parts near the end.' },
  { label: 'Register your vehicle for the north lot' },
  { label: 'Do not register your vehicle for the north gate', note: 'These are different. This matters.' },
  { label: 'Meet your assigned associate' },
  { label: 'Learn which questions are answered here and which are not' },
];

export const CORE_VALUES: string[] = [
  'We are present in every supply chain that matters.',
  'We give back to the community, visibly.',
  'What is written down is written carefully.',
  'What is not written down did not happen.',
  'The river is a company matter.',
];

export const CODE_OF_CONDUCT: { n: number; text: string; heavy?: boolean }[] = [
  { n: 1, text: 'Arrive on time. Sign in. Sign out. The log is not optional.' },
  { n: 2, text: 'Wear your card above the waist and visible at all times on site.' },
  { n: 3, text: 'Company vehicles are for company routes. Odometers are read.' },
  { n: 4, text: 'Personal photography on site is prohibited. Especially at the water.' },
  { n: 5, text: 'Refer all outside inquiries to Community Relations. Do not improvise.', heavy: true },
  { n: 6, text: 'If you are asked what we transport, the answer is industrial solvent.', heavy: true },
  { n: 7, text: 'The north gate is not a shortcut. Do not use the north gate.', heavy: true },
  { n: 8, text: 'If you see something at the shoreline, you did not. Report it to your associate anyway.', heavy: true },
];

// ── Notices ──────────────────────────────────────────────────────────────────
export interface Notice {
  id: string;
  date: string;
  title: string;
  body: string;
  tone: 'routine' | 'odd';
}

export const NOTICES: Notice[] = [
  { id: 'N-118', date: '2026-06-30', title: 'Break room coffee machine', body: 'The machine is fixed. Please stop feeding it foreign coins. It knows.', tone: 'routine' },
  { id: 'N-117', date: '2026-06-29', title: 'North gate — reminder', body: 'The north gate remains closed to all personnel. This is not a maintenance issue and will not be resolved. Use the main lot.', tone: 'odd' },
  { id: 'N-116', date: '2026-06-28', title: 'River survey postponed', body: 'The independent river survey has been rescheduled to a later date, for the third time. Community Relations is handling the paperwork. No action needed.', tone: 'odd' },
  { id: 'N-115', date: '2026-06-27', title: 'Food truck rota', body: 'The community food truck runs Thursdays at the town square. Volunteers welcome. Wear the branded apron.', tone: 'routine' },
  { id: 'N-114', date: '2026-06-26', title: 'Overnight lot', body: 'Tankers held overnight must remain sealed. If a seal is broken on arrival, do not report it up the chain. Report it to your associate. Only your associate.', tone: 'odd' },
  { id: 'N-113', date: '2026-06-25', title: 'Parking', body: 'Reminder that the two spaces by the loading dock are reserved. You know whose they are.', tone: 'routine' },
];

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

export const ORG: Department[] = [
  {
    name: 'Logistics',
    head: { name: 'M. Vane', role: 'Director of Logistics', note: 'Owns the routes. Owns the schedule. Owns the odometers.' },
    members: [
      { name: 'D. Rourke', role: 'Fleet Lead' },
      { name: 'S. Okafor', role: 'Night Dispatch', note: 'Works only nights. Has never been seen in daylight on site.' },
      { name: 'T. Bell', role: 'Weigh Station Liaison' },
    ],
  },
  {
    name: 'Pharmaceutical Supply',
    head: { name: 'Dr. A. Course', role: 'Head of Supply' },
    members: [
      { name: 'J. Iyer', role: 'Compounding' },
      { name: 'R. Salt', role: 'Inventory', note: 'Counts everything twice. The counts rarely match.' },
    ],
  },
  {
    name: 'Community Relations',
    head: { name: 'P. Wren', role: 'Head of Community Relations', note: 'Handles the surveys, the cleanups, and the questions.' },
    members: [
      { name: 'L. Marsh', role: 'Events & Food Trucks' },
      { name: 'C. Ford', role: 'Press & Local Government' },
    ],
  },
  {
    name: 'Site Maintenance',
    head: { name: 'H. Pike', role: 'Facilities Lead', note: 'Keeps the north gate. Do not ask for the key.' },
    members: [{ name: 'G. Ash', role: 'Groundskeeping — Shoreline' }],
  },
  {
    name: '████████',
    head: { name: '—', role: '—', note: 'This department is not listed in the directory. Its head does not attend meetings.' },
    members: [],
  },
];

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

export const ASSIGNMENTS: Task[] = [
  { id: 'T-01', title: 'Sign the overnight log', detail: 'Every night. Even the nights nothing runs. Especially those.' },
  { id: 'T-02', title: 'Re-label the blue drums', detail: 'The blue drums are now “industrial solvent”. They were always industrial solvent.', heavy: true },
  { id: 'T-03', title: 'Escort the food truck', detail: 'Thursday, town square. Smile. Hand out the branded water bottles.' },
  { id: 'T-04', title: 'Walk the shoreline at dawn', detail: 'Before the survey team, if the survey ever happens. Clear anything that shouldn’t be seen.', heavy: true },
  { id: 'T-05', title: 'Return the north lot keys', detail: 'The north LOT. Not the north gate. Read the tag twice.' },
];
