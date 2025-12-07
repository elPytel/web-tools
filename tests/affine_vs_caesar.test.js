import { describe, it, expect } from 'vitest';
import { CaesarCipher } from '../src/js/tools/crypto/caesar.js';
import { AffineCipher } from '../src/js/tools/crypto/affine.js';

describe('Affine vs Caesar equivalence (a=1, b=shift)', () => {
  const shifts = [0, 1, 3, 25, -1, 27];
  const samples = [
    'ATTACK AT DAWN',
    'HELLO, WORLD!',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'THE QUICK BROWN FOX JUMPS',
  ];

  for (const shift of shifts) {
    const aff = new AffineCipher({ a: 1, b: shift });
    const caesar = new CaesarCipher({ shift });
    it(`matches Caesar for shift=${shift} (encryption)`, () => {
      for (const s of samples) {
        const expected = caesar.encrypt(s);
        const actual = aff.encrypt(s);
        // caesar.encrypt returns uppercase; aff.encrypt on uppercase input returns uppercase too
        expect(actual).toBe(expected);
      }
    });

    it(`matches Caesar for shift=${shift} (decryption)`, () => {
      for (const s of samples) {
        const enc = caesar.encrypt(s);
        const decByAffine = aff.decrypt(enc);
        // caesar.decrypt would be caesar.encrypt(enc, -shift) which equals original uppercase s
        expect(decByAffine).toBe(s);
      }
    });
  }
});
