import { Cipher } from './cipher.js';

/**
 * Caesar Cipher implementation
 * Extends the base Cipher class.
 * 
 * Uses a simple shift for encryption and decryption.
 * 
 * Options:
 * - shift: number of positions to shift (default: 3)
 */
export class CaesarCipher extends Cipher {
  constructor(options = {}) {
    super(options);
    const defaults = { shift: 3 };
    this.options = Object.assign({}, defaults, this.options || {}, options || {});
  }

  encrypt(plaintext, opts = {}) {
    const { shift } = Object.assign({}, this.options, opts);
    return caesarShift(plaintext, shift);
  }

  decrypt(ciphertext, opts = {}) {
    const { shift } = Object.assign({}, this.options, opts);
    return caesarShift(ciphertext, -shift);
  }
}

export function caesarShift(str, shift) {
  if (typeof str !== 'string') throw new TypeError('str must be a string');
  if (typeof shift !== 'number' || !Number.isFinite(shift)) throw new TypeError('shift must be a number');

  const A = 'A'.charCodeAt(0);
  const Z = 'Z'.charCodeAt(0);

  const normalized = ((shift % 26) + 26) % 26;

  return str
    .toUpperCase()
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code < A || code > Z) return ch;
      const shifted = ((code - A + normalized) % 26) + A;
      return String.fromCharCode(shifted);
    })
    .join('');
}

export function encrypt(str, shift) {
  return caesarShift(str, shift);
}

export function decrypt(str, shift) {
  return caesarShift(str, -shift);
}

export default caesarShift;
