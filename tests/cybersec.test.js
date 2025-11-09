import { describe, it, expect } from 'vitest';
import { log2, classifyStrength, bigPow, formatBigInt, secondsToHuman, computeRateAndHashTime } from '../src/js/cybersec.js';

describe('cybersec utils', () => {
  it('log2 computes base-2 logarithm', () => {
    expect(log2(8)).toBeCloseTo(3, 12);
  });

  it('classifyStrength returns expected labels', () => {
    expect(classifyStrength(95).label).toBe('Very strong');
    expect(classifyStrength(75).label).toBe('Strong');
    expect(classifyStrength(55).label).toBe('Medium');
    expect(classifyStrength(30).label).toBe('Weak');
  });

  it('bigPow computes big integer powers', () => {
    expect(bigPow(26, 3)).toEqual(17576n);
  });

  it('formatBigInt formats small numbers with thin space grouping', () => {
    expect(formatBigInt(17576n)).toBe(`17\u202F576`);
  });

  it('formatBigInt uses scientific notation for large numbers', () => {
    expect(formatBigInt(12345678901234567n)).toBe('1.23 × 10^16');
  });

  it('secondsToHuman returns human readable time (hours/minutes)', () => {
    expect(secondsToHuman(3600)).toContain('1 hod'); // flexible match for localization
    expect(secondsToHuman(60)).toContain('1 min');
  });

  it('computeRateAndHashTime manual mode', () => {
    const r = computeRateAndHashTime({ mode: 'manual', rate: 500 });
    expect(r.perHashSec).toBeNull();
    expect(r.rate).toBeCloseTo(500, 9);
  });

  it('computeRateAndHashTime cpu mode', () => {
    const r = computeRateAndHashTime({ mode: 'cpu', ghz: 5, instr: 10 });
    expect(r.rate).toBeCloseTo(5e9 / 10, 6);
    expect(r.perHashSec).toBeNull();
  });

  it('computeRateAndHashTime hash mode', () => {
    const r = computeRateAndHashTime({ mode: 'hash', ms: 1 });
    expect(r.rate).toBeCloseTo(1000, 6);
    expect(r.perHashSec).toBeCloseTo(0.001, 12);
  });
});
