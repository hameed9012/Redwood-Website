import { describe, it, expect } from 'vitest';
import { hasHighCommandRole } from './permissions';

describe('hasHighCommandRole', () => {
  const hcRoleId = '4';
  it('true when the member holds the high-command role', () => {
    expect(hasHighCommandRole(['1', '4', '6'], hcRoleId)).toBe(true);
  });
  it('false when they do not', () => {
    expect(hasHighCommandRole(['1', '2'], hcRoleId)).toBe(false);
  });
  it('false for an empty role set', () => {
    expect(hasHighCommandRole([], hcRoleId)).toBe(false);
  });
});
