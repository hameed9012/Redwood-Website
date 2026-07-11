import { describe, it, expect } from 'vitest';
import { classifyQuery } from './lookup';

describe('classifyQuery', () => {
  it('reads a mention or raw snowflake as a member query', () => {
    expect(classifyQuery('<@123456789012345678>')).toEqual({ kind: 'member', discordId: '123456789012345678' });
    expect(classifyQuery('<@!123456789012345678>')).toEqual({ kind: 'member', discordId: '123456789012345678' });
    expect(classifyQuery('123456789012345678')).toEqual({ kind: 'member', discordId: '123456789012345678' });
  });

  it('reads anything else as trimmed text', () => {
    expect(classifyQuery('  ABC123 ')).toEqual({ kind: 'text', text: 'ABC123' });
    expect(classifyQuery('Adam Marcuz')).toEqual({ kind: 'text', text: 'Adam Marcuz' });
  });
});
