import { describe, it, expect } from 'vitest';
import { caesarShift, encrypt, decrypt } from '../src/caesar.js';

describe('caesar cipher', () => {
  it('shifts letters forward', () => {
    expect(caesarShift('ABC', 1)).toBe('BCD');
    expect(encrypt('xyz', 2)).toBe('ZAB');
  });

  it('wraps around the alphabet', () => {
    expect(caesarShift('Z', 1)).toBe('A');
    expect(caesarShift('Y', 3)).toBe('B');
  });

  it('preserves non-letters', () => {
    expect(caesarShift('Hello, World! 123', 5)).toBe('MJQQT, BTWQI! 123');
  });

  it('decrypts correctly (negative shift)', () => {
    const enc = encrypt('Attack at dawn!', 5);
    expect(decrypt(enc, 5)).toBe('ATTACK AT DAWN!');
  });

  it('handles large shifts by normalizing modulo 26', () => {
    expect(caesarShift('A', 27)).toBe('B');
    expect(caesarShift('A', -1)).toBe('Z');
  });

  it('throws on invalid inputs', () => {
    expect(() => caesarShift(null, 3)).toThrow();
    expect(() => caesarShift('A', NaN)).toThrow();
  });
});
