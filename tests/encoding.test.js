import { describe, it, expect, beforeAll } from 'vitest';
import {
  formatNumber,
  parseToken,
  toAsciiCodes,
  toUtf8Bytes,
  bytesToUtf8,
  splitBySep
} from '../src/js/tools/encoding.js';

// Ensure TextEncoder/TextDecoder exist in the test environment (Node older versions)
beforeAll(() => {
  if (typeof global.TextEncoder === 'undefined') {
    // Node.js: import from util
    // dynamic import to avoid top-level ESM CJS mismatch in some runtimes
    // but Vitest/Node 18+ usually provide these globals.
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }
});

describe('encoding utilities', () => {
  it('formatNumber: decimal/hex/bin with padding and prefix', () => {
    expect(formatNumber(65, 10, false, false)).toBe('65');
    expect(formatNumber(65, 16, false, true)).toBe('41');
    expect(formatNumber(65, 16, true, true)).toBe('0x41');
    expect(formatNumber(5, 2, true, true)).toBe('0b00000101');
  });

  it('parseToken: understands prefixes and selected base', () => {
    expect(parseToken('0x41', 10)).toBe(65);
    expect(parseToken('0b101', 10)).toBe(5);
    expect(parseToken('41', 16)).toBe(65);
    expect(parseToken('  42  ', 10)).toBe(42);
    expect(parseToken('', 10)).toBeNull();
    expect(parseToken('not-a-num', 10)).toBeNull();
  });

  it('toAsciiCodes: replaces >127 with ? and counts replacements', () => {
    const { codes, replaced } = toAsciiCodes('ABCČ');
    // 'A' 'B' 'C' -> 65,66,67 and 'Č' >127 replaced by 63
    expect(codes.slice(0,3)).toEqual([65,66,67]);
    expect(codes[codes.length-1]).toBe(63);
    expect(replaced).toBeGreaterThanOrEqual(1);
  });

  it('utf8 bytes roundtrip for Czech and emoji', () => {
    const s = 'Čřž🙂';
    const bytes = toUtf8Bytes(s);
    expect(Array.isArray(bytes)).toBe(true);
    const out = bytesToUtf8(bytes);
    expect(out).toBe(s);
  });

  it('splitBySep: splits by custom separator, whitespace and commas', () => {
    expect(splitBySep('1 2 3', ' ')).toEqual(['1','2','3']);
    expect(splitBySep('a,b,c', ',')).toEqual(['a','b','c']);
  // providing ' ' as separator treats commas as additional separators, so commas are removed
  expect(splitBySep('  foo, bar  baz ', ' ')).toEqual(['foo','bar','baz']);
    expect(splitBySep('', ' ')).toEqual([]);
  });
});
