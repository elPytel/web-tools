import Cipher from './cipher.js';

/**
 * Affine cipher: E(x) = (a * x + b) mod 26
 * Decryption uses modular inverse of a (a^{-1}) modulo 26.
 *
 * Options:
 * - a: multiplier (must be coprime with 26). Default: 5
 * - b: shift. Default: 8
 */
export class AffineCipher extends Cipher {
  constructor(options = {}) {
    super(options);
    const defaults = { a: 5, b: 8 };
    this.options = Object.assign({}, defaults, this.options || {}, options || {});
  }

  encrypt(plaintext, opts = {}) {
    const { a, b } = Object.assign({}, this.options, opts);
    if (!Number.isInteger(a) || !Number.isInteger(b)) throw new TypeError('a and b must be integers');
    if (gcd(a, 26) !== 1) throw new Error('Multiplier a must be coprime with 26');

    return [...plaintext].map(ch => {
      const code = ch.codePointAt(0);
      // uppercase A-Z
      if (code >= 65 && code <= 90) {
        const x = code - 65;
        const y = mod(a * x + b, 26);
        return String.fromCharCode(y + 65);
      }
      // lowercase a-z
      if (code >= 97 && code <= 122) {
        const x = code - 97;
        const y = mod(a * x + b, 26);
        return String.fromCharCode(y + 97);
      }
      // leave other characters untouched
      return ch;
    }).join('');
  }

  decrypt(ciphertext, opts = {}) {
    const { a, b } = Object.assign({}, this.options, opts);
    if (!Number.isInteger(a) || !Number.isInteger(b)) throw new TypeError('a and b must be integers');
    const aInv = modInv(a, 26);
    if (aInv === null) throw new Error('Multiplier a has no modular inverse modulo 26');

    return [...ciphertext].map(ch => {
      const code = ch.codePointAt(0);
      if (code >= 65 && code <= 90) {
        const y = code - 65;
        const x = mod(aInv * (y - b), 26);
        return String.fromCharCode(x + 65);
      }
      if (code >= 97 && code <= 122) {
        const y = code - 97;
        const x = mod(aInv * (y - b), 26);
        return String.fromCharCode(x + 97);
      }
      return ch;
    }).join('');
  }
}

export default AffineCipher;

// --- helpers ---
function mod(n, m) {
  return ((n % m) + m) % m;
}

function egcd(a, b) {
  if (b === 0) return { g: a, x: 1, y: 0 };
  const res = egcd(b, a % b);
  return { g: res.g, x: res.y, y: res.x - Math.floor(a / b) * res.y };
}

function modInv(a, m) {
  const res = egcd(a, m);
  if (res.g !== 1) return null;
  return mod(res.x, m);
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) {
    const t = b; b = a % b; a = t;
  }
  return a;
}
