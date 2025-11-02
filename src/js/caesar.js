export function caesarShift(str, shift) {
  if (typeof str !== 'string') throw new TypeError('str must be a string');
  if (typeof shift !== 'number' || !Number.isFinite(shift)) throw new TypeError('shift must be a number');

  const A = 'A'.charCodeAt(0);
  const Z = 'Z'.charCodeAt(0);

  const normalized = ((shift % 26) + 26) % 26; // ensure 0..25

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
