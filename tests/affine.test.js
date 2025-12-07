import { describe, it, expect } from 'vitest';
import { AffineCipher } from '../src/js/tools/crypto/affine.js';

describe('affine cipher', () => {
  it('round-trips plaintext (preserves case and punctuation)', () => {
    const c = new AffineCipher({ a: 5, b: 8 });
    const plain = 'Hello, World! 123';
    const encrypted = c.encrypt(plain);
    const decrypted = c.decrypt(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('uses defaults when no options provided', () => {
    const c = new AffineCipher();
    const plain = 'Attack at dawn!';
    const enc = c.encrypt(plain);
    const dec = c.decrypt(enc);
    expect(dec).toBe(plain);
  });

  it('encrypts A -> I for a=5,b=8 (A->0 => 5*0+8=8 => I)', () => {
    const c = new AffineCipher({ a: 5, b: 8 });
    expect(c.encrypt('A')).toBe('I');
    expect(c.encrypt('a')).toBe('i');
    expect(c.decrypt('I')).toBe('A');
    expect(c.decrypt('i')).toBe('a');
  });

  it('preserves non-letters', () => {
    const c = new AffineCipher({ a: 5, b: 8 });
    expect(c.encrypt('123! ?.')).toBe('123! ?.');
  });

  it('throws when multiplier a is not coprime with 26', () => {
    const c = new AffineCipher({ a: 13, b: 5 }); // 13 shares factor with 26
    expect(() => c.encrypt('A')).toThrow();
    expect(() => c.decrypt('A')).toThrow();
  });
});
