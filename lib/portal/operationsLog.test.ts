import { describe, it, expect } from 'vitest';
import { shapeOperationsLog, type ShiftLite, type IncidentLite } from './operationsLog';

const shifts: ShiftLite[] = [
  { id: 's1', employeeName: 'A B', startedAt: '2026-07-11T00:00:00Z', endedAt: '2026-07-11T01:00:00Z', movementAccount: 'Docks, Overpass' },
];
const incidents: IncidentLite[] = [
  { shiftId: 's1', summary: 'Stop', location: 'Route 7' },
  { shiftId: 's1', summary: 'Delivery', location: 'Docks' },
];

describe('shapeOperationsLog', () => {
  it('attaches incidents to their shift and computes duration', () => {
    const rows = shapeOperationsLog(shifts, incidents);
    expect(rows).toHaveLength(1);
    expect(rows[0].duration).toBe('1h 0m');
    expect(rows[0].incidents).toHaveLength(2);
    expect(rows[0].employeeName).toBe('A B');
  });
});
