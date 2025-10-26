import { describe, it, expect } from 'vitest';
import { computeDiffMinutes, formatPretty, computeDiff } from '../src/timecalc.js';

describe('timecalc', () => {
  it('calculates simple interval correctly', () => {
    const minutes = computeDiffMinutes('08:00', '12:30');
    expect(minutes).toBe(270);
    expect(formatPretty(minutes)).toBe('4 h 30 min');
  });

  it('calculates interval across midnight', () => {
    const { minutes, pretty } = computeDiff('22:30', '01:15');
    expect(minutes).toBe(165);
    expect(pretty).toBe('2 h 45 min');
  });

  it('zero-length interval', () => {
    const { minutes, pretty } = computeDiff('09:00', '09:00');
    expect(minutes).toBe(0);
    expect(pretty).toBe('0 min');
  });

  it('throws on invalid input', () => {
    expect(() => computeDiffMinutes('xx', '10:00')).toThrow();
    expect(() => computeDiffMinutes('09:00', null)).toThrow();
  });
});
