export function log2(n) { return Math.log(n) / Math.log(2); }

export function classifyStrength(bits) {
  if (bits >= 90) return {label:'Very strong', cls:'ok'};
  if (bits >= 70) return {label:'Strong', cls:'ok'};
  if (bits >= 50) return {label:'Medium', cls:'warn'};
  return {label:'Weak', cls:'bad'};
}

export function bigPow(base, exp) {
  base = BigInt(base);
  exp = BigInt(exp);
  let res = 1n, b = base, e = exp;
  while (e > 0n) {
    if (e & 1n) res *= b;
    b *= b; e >>= 1n;
  }
  return res;
}

export function formatBigInt(n) {
  const s = n.toString();
  if (s.length <= 15) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  }
  const mant = s.slice(0, 3);
  const exp = s.length - 1;
  return `${mant[0]}.${mant.slice(1)} × 10^${exp}`;
}

export function secondsToHuman(sec) {
  const units = [
    ['roků', 365*24*3600],
    ['dní', 24*3600],
    ['hod', 3600],
    ['min', 60],
    ['s', 1],
  ];
  let s = Number.isFinite(sec) ? sec : Infinity;
  if (!Number.isFinite(s) || s>1e18) return '≈ nekonečno';
  const parts = [];
  for (const [name, size] of units) {
    const v = Math.floor(s / size);
    if (v>0) { parts.push(`${v} ${name}`); s -= v*size; }
    if (parts.length>=3) break;
  }
  return parts.length ? parts.join(' ') : '0 s';
}

/**
 * computeRateAndHashTime(params)
 * params: { mode, rate, ghz, instr, ms }
 * returns { rate, perHashSec }
 */
export function computeRateAndHashTime({ mode='manual', rate=1, ghz=0, instr=1, ms=1 } = {}) {
  if (mode === 'manual') {
    const r = Math.max(1, Number.parseFloat(rate) || 1);
    return { rate: r, perHashSec: null };
  }
  if (mode === 'cpu') {
    const _ghz = Math.max(0.000001, Number.parseFloat(ghz) || 0);
    const _instr = Math.max(1, Number.parseFloat(instr) || 1);
    const freqHz = _ghz * 1e9;
    const _rate = freqHz / _instr;
    return { rate: _rate, perHashSec: null };
  }
  if (mode === 'hash') {
    const _ms = Math.max(0, Number.parseFloat(ms) || 0);
    if (_ms === 0) return { rate: Infinity, perHashSec: 0 };
    const perHashSec = _ms/1000.0;
    const _rate = 1000.0 / _ms;
    return { rate: _rate, perHashSec: perHashSec };
  }
  return { rate: Math.max(1, Number.parseFloat(rate)||1), perHashSec: null };
}
