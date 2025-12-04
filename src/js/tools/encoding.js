// Reusable encoding utilities used across tools
export function formatNumber(n, base, usePrefix, pad) {
  let s = n.toString(base).toUpperCase();
  if (pad) {
    const width = base === 16 ? 2 : (base === 2 ? 8 : 0);
    if (width) s = s.padStart(width, '0');
  }
  if (usePrefix) {
    if (base === 16) s = '0x' + s;
    if (base === 2)  s = '0b' + s;
  }
  return s;
}

export function parseToken(tok, base) {
  let t = tok.trim();
  if (!t) return null;
  // support 0x / 0b prefixes even if user selected different base
  if (/^0x/i.test(t)) return parseInt(t, 16);
  if (/^0b/i.test(t)) return parseInt(t.slice(2), 2);
  const n = parseInt(t, base);
  return Number.isFinite(n) ? n : null;
}

export function toAsciiCodes(str) {
  const codes = [];
  let replaced = 0;
  for (const ch of str) {
    let cp = ch.codePointAt(0);
    if (cp > 127) { cp = 63; replaced++; } // '?'
    codes.push(cp);
  }
  return { codes, replaced };
}

export function toUtf8Bytes(str) {
  const enc = new TextEncoder();
  return Array.from(enc.encode(str)); // 0..255
}

export function bytesToUtf8(bytes) {
  try {
    const dec = new TextDecoder('utf-8', { fatal: true });
    return dec.decode(new Uint8Array(bytes));
  } catch {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  }
}

export function splitBySep(str, sep) {
  if (!str || !str.trim()) return [];
  const esc = sep ? sep.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') : '';
  const re = esc ? new RegExp(`\\s*${esc}\\s*|\\s+|,\\s*`, 'g') : /\s+|,\s*/g;
  return str.split(re).filter(Boolean);
}

export default {
  formatNumber,
  parseToken,
  toAsciiCodes,
  toUtf8Bytes,
  bytesToUtf8,
  splitBySep
};
