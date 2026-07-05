import { describe, it, expect } from 'vitest';
import { hashSecretName, resolveTier } from './secretNames';

describe('secretNames', () => {
  it('hashes to the known SHA-256 hex (normalized)', async () => {
    expect(await hashSecretName('minnow')).toBe(
      '616bebcf52b9382c7741322b835bb7c56cf5e64298b80988ea934800f4beb843',
    );
  });

  it('resolves the placeholder codenames to their tiers', async () => {
    expect(await resolveTier('minnow')).toBe('recruit');
    expect(await resolveTier('tidewater')).toBe('employee');
    expect(await resolveTier('leviathan')).toBe('high-command');
  });

  it('is case- and whitespace-insensitive', async () => {
    expect(await resolveTier('  TIDEWATER ')).toBe('employee');
    expect(await resolveTier('LeViAtHaN')).toBe('high-command');
  });

  it('returns null for an unrecognized or empty name', async () => {
    expect(await resolveTier('not-a-real-name')).toBeNull();
    expect(await resolveTier('')).toBeNull();
    expect(await resolveTier('   ')).toBeNull();
  });
});
