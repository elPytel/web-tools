import { describe, it, expect } from 'vitest';
import { transposeEncrypt, transposeDecrypt } from '../src/js/tools/crypto/transposition.js';

describe('transposition cipher', () => {
  it('round-trips with lettersOnly preserving non-letters', () => {
    const txt = 'Attack at dawn! 123';
    const opts = { key1: 'KEY', lettersOnly: true };
    const enc = transposeEncrypt(txt, opts);
    const dec = transposeDecrypt(enc, opts);
    expect(dec).toBe(txt);
  });

  it('normalize option removes spaces and diacritics and uppercases', () => {
    const txt = 'Čau světe';
    const opts = { key1: 'K', normalize: true };
    const enc = transposeEncrypt(txt, opts);
    // normalized output contains only A-Z (no spaces/diacritics) and is uppercase
    expect(enc).toMatch(/^[A-Z]+$/);
  });

  it('double transposition decrypts back to original (lettersOnly)', () => {
    const txt = 'Meet me at 9pm!';
    const opts = { key1: 'ABC', key2: 'KEY', double: true, lettersOnly: true };
    const enc = transposeEncrypt(txt, opts);
    const dec = transposeDecrypt(enc, opts);
    expect(dec).toBe(txt);
  });

  it('uses custom padChar when padding is required', () => {
    const txt = 'HELLO';
    const opts = { key1: 'LONGKEY', padChar: 'Z' };
    const enc = transposeEncrypt(txt, opts);
    expect(enc.includes('Z')).toBe(true);
  });

  it('decrypt(encrypt(text)) returns padded result when not normalizing', () => {
    const txt = 'SHORT';
    // key length 3 forces padding (5 chars -> 2 rows -> 6 cells)
    const opts = { key1: 'ABC', padChar: 'X' };
    const enc = transposeEncrypt(txt, opts);
    const dec = transposeDecrypt(enc, opts);
    // padded original should be SHORT + 'X'
    expect(dec).toBe('SHORTX');
  });

  it('example: TAJNYUTOK with key "klíč" produces padded decrypted result', () => {
    const txt = 'TAJNYUTOK';
    const opts = { key1: 'klíč' };
    const enc = transposeEncrypt(txt, opts);
    const dec = transposeDecrypt(enc, opts);
    // key length 4 -> rows = ceil(9/4) = 3 -> cells = 12 -> padding 3
    expect(dec).toBe('TAJNYUTOKXXX');
  });

  it('example with diacritics and normalize: "Tajný útok" -> normalized and padded', () => {
    const txt = 'Tajný útok';
    const opts = { key1: 'klíč', normalize: true };
    const enc = transposeEncrypt(txt, opts);
    // normalized form should contain only uppercase A-Z
    expect(enc).toMatch(/^[A-Z]+$/);
    expect(enc).toBe('NOXJTXTYKAUX'); // from explanation document
    const dec = transposeDecrypt(enc, opts);
    // normalized plaintext is TAJNYUTOK, padded to 12 cells
    expect(dec).toBe('TAJNYUTOKXXX');
  });
});
