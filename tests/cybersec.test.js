import { describe, it, expect, vi } from 'vitest';
import nodeCrypto from 'node:crypto';
import { log2, classifyStrength, bigPow, formatBigInt, secondsToHuman, computeRateAndHashTime, getWordlistEntry, randHex, randEmail, randDate, makeSalt, digestText, loadWordlistFromPath, loadCommonNames, loadCommonSurnames } from '../src/js/tools/cybersec.js';

// polyfill / test stub for Web Crypto API in Node environment
// vitest runs in Node where global crypto might be missing; use node:crypto underneath.
const fakeCrypto = {
  getRandomValues(buf) {
    const rnd = nodeCrypto.randomBytes(buf.length);
    buf.set(rnd);
    return buf;
  },
  subtle: {
    async digest(algo, data) {
      // algo like 'SHA-256' -> 'sha256'
      const alg = String(algo).toLowerCase().replace(/-/g, '');
      const h = nodeCrypto.createHash(alg);
      // data can be ArrayBuffer/TypedArray
      h.update(Buffer.from(data));
      return h.digest();
    }
  }
};

// ensure global crypto is available for the module under test
vi.stubGlobal('crypto', fakeCrypto);

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

  // ---------- additional tests ----------
  it('getWordlistEntry returns expected object', () => {
    const e = getWordlistEntry('nordpass');
    expect(e).not.toBeNull();
    expect(e.id).toBe('nordpass');
    expect(typeof e.label).toBe('string');
  });

  it('randHex returns correct length and hex chars', () => {
    const s = randHex(8);
    expect(s).toMatch(/^[0-9a-f]+$/);
    expect(s.length).toBe(16);
  });

  it('randEmail default returns email-like string', () => {
    const e = randEmail();
    expect(e).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  });

  it('randDate returns ISO date between 2015-01-01 and today', () => {
    const d = randDate();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const t = new Date(d).getTime();
    expect(t).toBeGreaterThanOrEqual(new Date('2015-01-01').getTime());
    expect(t).toBeLessThanOrEqual(Date.now());
  });

  it('makeSalt random yields hex of correct length; regdate is deterministic', () => {
    const r = makeSalt(8);
    expect(r).toMatch(/^[0-9a-f]+$/);
    expect(r.length).toBe(16);

    const s1 = makeSalt(8, '2020-01-01', 'regdate');
    const s2 = makeSalt(8, '2020-01-01', 'regdate');
    expect(s1).toBe(s2);
    expect(s1.length).toBe(16);
    expect(s1).toMatch(/^[0-9a-f]+$/);
  });

  it('digestText supports SHA-256 and returns known hash for "abc"', async () => {
    const h = await digestText('SHA-256', 'abc');
    expect(h).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('loadWordlistFromPath and loadCommon* functions work with fetch mock', async () => {
     // mock fetch for a simple wordlist
     vi.stubGlobal('fetch', async (path) => {
       if (path.includes('top_common')) {
         return { text: async () => 'one\ntwo\nthree\n' };
       }
       if (path.endsWith('.csv')) {
         // header + two rows, gender codes in first column
         return { text: async () => 'DRUH_JMENA,JMENO\nM,Jan\nF,Marie\n' };
       }
       if (path.endsWith('.txt')) {
         return { text: async () => 'novak\nsvoboda\n' };
       }
       return { text: async () => '' };
     });

     const wl = await loadWordlistFromPath('path/to/top_common.txt');
     expect(Array.isArray(wl)).toBeTruthy();
     expect(wl).toContain('one');
 
     const names = await loadCommonNames('file.csv', 'M');
     expect(names).toContain('jan');
     const surnames = await loadCommonSurnames('file.txt');
     expect(surnames).toContain('novak');
     // restore fetch mock
     vi.unstubAllGlobals();
   });
 });
