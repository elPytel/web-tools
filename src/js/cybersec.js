// ========== Cybersecurity utilities ==========
/**
 * Compute integer power using BigInt (fast exponentiation).
 * @param {number|string|bigint} base - Base value.
 * @param {number|string|bigint} exp - Exponent (non-negative).
 * @returns {bigint} base ** exp as BigInt.
 */
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

/**
 * Format BigInt with thin-space grouping for small numbers,
 * or compact scientific-like notation for large numbers.
 * @param {bigint} n - Number to format.
 * @returns {string} Formatted string.
 */
export function formatBigInt(n) {
  const s = n.toString();
  if (s.length <= 15) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  }
  const mant = s.slice(0, 3);
  const exp = s.length - 1;
  return `${mant[0]}.${mant.slice(1)} × 10^${exp}`;
}

/**
 * Convert seconds to a human-readable Czech-like string.
 * Shows up to three largest units.
 * @param {number} sec - Seconds.
 * @returns {string} Human readable string (e.g. "1 hod 2 min").
 */
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
 * Compute rate and per-hash timing based on mode.
 * @param {Object} params - Parameters object.
 * @param {string} [params.mode='manual'] - 'manual'|'cpu'|'hash'
 * @param {number} [params.rate=1] - manual rate (hashes/s)
 * @param {number} [params.ghz=0] - CPU frequency in GHz (for cpu mode)
 * @param {number} [params.instr=1] - instructions per hash (for cpu mode)
 * @param {number} [params.ms=1] - milliseconds per hash (for hash mode)
 * @returns {{rate:number, perHashSec:number|null}} Computed rate and per-hash seconds (or null).
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

// ========== Wordlist configuration (unified) ==========

/**
 * Available wordlists (id, label, path).
 * @type {Array<{id:string,label:string,path:string}>}
 */
export const WORDLISTS = [
  { id: 'builtin', label: 'common top: 10', path: '../assets/top_common_pswd.txt' },
  { id: 'nordpass', label: 'nordpass top: 200', path: '../assets/nordpass_top-200.txt' },
  { id: 'darkweb', label: 'darkweb2017 top: 10000', path: '../assets/darkweb2017_top-10000.txt' }
];

/**
 * Get wordlist entry by id.
 * @param {string} id - Wordlist id.
 * @returns {{id:string,label:string,path:string}|null} Entry or null.
 */
export function getWordlistEntry(id){
  return WORDLISTS.find(e => e.id === id) || null;
}

/**
 * Load wordlist from a URL/path.
 * @param {string} path - URL or local path to text file.
 * @returns {Promise<string[]>} Array of non-empty lines.
 */
export function loadWordlistFromPath(path){
  return fetch(path)
    .then(resp => resp.text())
    .then(text => text.split(/\r?\n/).filter(line => line.trim() !== ''));
}

/**
 * Compute digest of text using WebCrypto or SparkMD5 for MD5.
 * @param {string} algo - 'MD5'|'SHA-1'|'SHA-256' etc.
 * @param {string} text - Input text.
 * @returns {Promise<string>} Hex digest string.
 */
export async function digestText(algo, text){
  algo = String(algo || '').toUpperCase();
  if (algo === 'MD5'){
    if (typeof SparkMD5 === 'undefined') throw new Error('SparkMD5 not available');
    return SparkMD5.hash(text);
  } else {
    const enc = new TextEncoder();
    const buf = enc.encode(text);
    const h = await crypto.subtle.digest(algo, buf);
    return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
}

/**
 * Generate random hex string of len bytes (2*len hex chars).
 * @param {number} len - Number of random bytes.
 * @returns {string} Hex string.
 */
export function randHex(len){
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/**
 * Generate random email address.
 * @param {string[]} [names=[]] - Optional first names to choose from.
 * @param {string[]} [surnames=[]] - Optional surnames to choose from.
 * @returns {string} Email address.
 */
export function randEmail(names=[], surnames=[]){
  const domains = ['gmail.com','seznam.cz','hotmail.com','centrum.cz','yahoo.com','post.cz','email.cz','atlas.cz','tiscali.cz'];
  if (names.length > 0 && surnames.length > 0){
    const name = names[Math.floor(Math.random()*names.length)];
    let surname = surnames[Math.floor(Math.random()*surnames.length)];
    // name to lower, remove diacritics
    const nameNorm = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    // surnema to lower, remove diacritics
    const surnameNorm = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const formats = [
      () => `${nameNorm}.${surnameNorm}`,
      () => `${nameNorm[0]}${surnameNorm}`,
      () => `${nameNorm}${surnameNorm[0]}`,
      () => `${nameNorm}${Math.floor(Math.random()*100)}`,
      () => `${surnameNorm}${Math.floor(Math.random()*100)}`,
    ];
    const localPart = formats[Math.floor(Math.random()*formats.length)]();
    const domain = domains[Math.floor(Math.random()*domains.length)];
    return `${localPart}@${domain}`;
  } else {
    const user_name = Math.random().toString(36).slice(2,9);
    const domain = domains[Math.floor(Math.random()*domains.length)];
    return `${user_name}@${domain}`;
  }
}

/**
 * Generate random ISO date between 2015-01-01 and today.
 * @returns {string} Date string in YYYY-MM-DD.
 */
export function randDate(){
  const start = new Date(2015,0,1).getTime();
  const end = Date.now();
  const d = new Date(start + Math.floor(Math.random()*(end-start)));
  return d.toISOString().slice(0,10);
}

/**
 * Create salt as hex string.
 * @param {number} len - Number of bytes (hex length = 2*len).
 * @param {string|null} [regdate=null] - Registration date used in 'regdate' mode.
 * @param {string} [mode='random'] - 'random' or 'regdate'.
 * @returns {string} Hex salt string of length 2*len.
 */
export function makeSalt(len, regdate=null, mode='random'){
  if (mode === 'regdate' && regdate){
    // Use SparkMD5 if available, otherwise derive a deterministic hex string from regdate
    let h = '';
    if (typeof SparkMD5 !== 'undefined') {
      h = SparkMD5.hash(String(regdate));
    } else {
      // deterministic hex fallback: encode chars to hex (synchronous)
      h = Array.from(String(regdate))
        .map(c => c.charCodeAt(0).toString(16).padStart(2,'0'))
        .join('');
    }
    const needed = len*2;
    while (h.length < needed) h = h + h;
    return h.slice(0, needed);
  }
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// load common names & surnames
let COMMON_NAMES_FILE = '../assets/OpenData-seznam_jmen.csv';
let COMMON_SURNAMES_FILE = '../assets/czech_surnames.txt';

/**
 * Load common first names from CSV.
 * @param {string} [file=COMMON_NAMES_FILE] - Path to CSV file.
 * @param {string|null} [gender=null] - 'M'|'F' or null for both.
 * @returns {Promise<string[]>} Array of lowercase names.
 */
export async function loadCommonNames(file=COMMON_NAMES_FILE, gender=null){
  let header = true;
  const names = [];
  let resp = null;
  try {
    resp = await fetch(file);
  } catch (e) {
    console.error('Error loading common names file:', e);
    return names;
  }
  const text = await resp.text();
  const lines = text.split(/\r?\n/);
  for (const line of lines){
    if (header){
      header = false;
      continue;
    }
    const parts = line.split(',');
    if (parts.length < 2) continue;
    const g = parts[0].trim();
    const name = parts[1].trim().toLowerCase();
    if (gender === null || gender === g || (gender === 'M' && g === 'MUZ') || (gender === 'F' && g === 'ZENA')) {
      names.push(name);
    }
  }
  return names;
}

/**
 * Load common surnames from text file (one per line).
 * @param {string} [file=COMMON_SURNAMES_FILE] - Path to surname file.
 * @returns {Promise<string[]>} Array of lowercase surnames.
 */
export async function loadCommonSurnames(file=COMMON_SURNAMES_FILE){
  let resp = null;
  try {
    resp = await fetch(file);
  } catch (e) {
    console.error('Error loading common surnames file:', e);
    return [];
  }
  const text = await resp.text();
  const lines = text.split(/\r?\n/);
  const surnames = lines.map(line => line.trim().toLowerCase()).filter(line => line !== '');
  return surnames;
}

// ========== Password generation utils ==========
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const DIGIT = '0123456789';
export const SYMS  = `!@#$%^&*()-_=+[]{};:,.?/\\'"\`~|<>`;
export const AMBIG = new Set(['0','O','o','1','l','I','|','\\',"'",'"','`']);

/**
 * Build alphabet string from flags (pure).
 * @param {{useUpper:boolean,useLower:boolean,useDigits:boolean,useSymbols:boolean,avoidAmb:boolean}} flags
 * @returns {string}
 */
export function buildAlphabetFromFlags(flags={}) {
  const { useUpper=false, useLower=false, useDigits=false, useSymbols=false, avoidAmb=false } = flags;
  let a = '';
  if (useUpper) a += UPPER;
  if (useLower) a += LOWER;
  if (useDigits) a += DIGIT;
  if (useSymbols) a += SYMS;
  if (avoidAmb) a = [...a].filter(ch => !AMBIG.has(ch)).join('');
  return a;
}

/**
 * Compute base-2 logarithm.
 * @param {number} n - Input number (must be > 0).
 * @returns {number} Base-2 logarithm of n.
 */
export function log2(n) { return Math.log(n) / Math.log(2); }

/**
 * Classify key/entropy strength into human label and class.
 * @param {number} bits - Entropy in bits.
 * @returns {{label:string, cls:string}} Classification object.
 */
export function classifyStrength(bits) {
  if (bits >= 90) return {label:'Very strong', cls:'ok'};
  if (bits >= 70) return {label:'Strong', cls:'ok'};
  if (bits >= 50) return {label:'Medium', cls:'warn'};
  return {label:'Weak', cls:'bad'};
}

/**
 * unbiased random index generator using crypto
 * @param {number} maxExclusive
 * @returns {number}
 */
export function randIndex(maxExclusive){
  const max = Math.floor(maxExclusive);
  if (max <= 0) return 0;
  const range = 256 - (256 % max);
  let x;
  do {
    x = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (x >= range);
  return x % max;
}

/**
 * Fisher-Yates shuffle (works in-place but returns array)
 * @param {Array} array
 * @returns {Array}
 */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randIndex(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generate single password (pure).
 * @param {number} len
 * @param {string} alphabet
 * @param {Object} opts - {ensureEach:boolean, useUpper, useLower, useDigits, useSymbols}
 * @returns {string}
 */
export function generateOne(len, alphabet, opts={}){
  const ensureEach = Boolean(opts.ensureEach);
  const arr = [...alphabet];
  if (!arr.length) return '';
  const chunks = [];

  if (ensureEach) {
    const pools = [];
    if (opts.useUpper) pools.push([...UPPER].filter(c => alphabet.includes(c)));
    if (opts.useLower) pools.push([...LOWER].filter(c => alphabet.includes(c)));
    if (opts.useDigits) pools.push([...DIGIT].filter(c => alphabet.includes(c)));
    if (opts.useSymbols) pools.push([...SYMS].filter(c => alphabet.includes(c)));

    for (const p of pools) {
      chunks.push(p.length ? p[randIndex(p.length)] : arr[randIndex(arr.length)]);
    }
  }

  while (chunks.length < len) {
    chunks.push(arr[randIndex(arr.length)]);
  }
  return shuffle(chunks).slice(0, len).join('');
}

/**
 * Generate multiple passwords (pure).
 * @param {number} len
 * @param {number} count
 * @param {Object} flags - same flags as buildAlphabetFromFlags + ensureEach
 * @returns {string[]}
 */
export function generatePasswords(len, count, flags={}) {
  const alphabet = buildAlphabetFromFlags(flags);
  const list = [];
  for (let i=0;i<count;i++){
    list.push(generateOne(len, alphabet, flags));
  }
  return list;
}

/**
 * Compute password metrics (combos, bits, classification, crack time) for given config (pure).
 * @param {number} len - password length
 * @param {Object} flags - same flags as buildAlphabetFromFlags
 * @param {Object} rateParams - {mode, rate, ghz, instr, ms}
 * @returns {{combos:bigint, combosFmt:string, bits:number, cls:{label:string,cls:string}, timeSec:number, timeText:string}}
 */
export function computePasswordStats(len, flags={}, rateParams={}) {
  const alphabet = buildAlphabetFromFlags(flags);
  const N = Math.max(0, alphabet.length);
  if (N === 0) {
    return { combos: 0n, combosFmt: '—', bits: 0, cls: {label:'—', cls:''}, timeSec: NaN, timeText:'—' };
  }

  // total combinations as BigInt
  const combos = bigPow(N, len);

  // bits of entropy (approx)
  const bits = (N > 0) ? (len * log2(N)) : 0;
  const cls = classifyStrength(bits);

  // compute rate info
  const { rate, perHashSec } = computeRateAndHashTime(rateParams);

  // compute time in seconds (try to handle very large BigInt safely)
  let timeSec;
  if (!Number.isFinite(rate)) {
    // rate === Infinity => effectively zero time to enumerate
    timeSec = 0;
  } else if (rate <= 0) {
    timeSec = Infinity;
  } else {
    const MAX_SAFE = Number.MAX_SAFE_INTEGER;

    // if combos fits into a safe Number, do precise floating division
    if (combos <= BigInt(MAX_SAFE)) {
      timeSec = Number(combos) / rate;
    } else {
      // approximate by integer division using integer part of rate to avoid losing BigInt precision
      const rateInt = Math.max(1, Math.floor(rate));
      const secondsBig = combos / BigInt(rateInt);
      timeSec = (secondsBig > BigInt(MAX_SAFE)) ? Infinity : Number(secondsBig);
    }
  }

  const timeText = Number.isFinite(timeSec) ? secondsToHuman(timeSec) : secondsToHuman(Infinity);
  const combosFmt = formatBigInt(combos);

  return { combos, combosFmt, bits, cls, timeSec, timeText };
}

/**
 * Build example table rows (pure) — returns array of objects for UI rendering.
 * @param {Object} flags - buildAlphabetFromFlags flags
 * @param {number[]} lengths - array of lengths
 * @param {Object} rateParams - computeRateAndHashTime params
 * @returns {Array<{L:number, lower:boolean, upper:boolean, digits:boolean, syms:boolean, combosFmt:string, secText:string}>}
 */
export function getExampleTableRows(flags={}, lengths=[3,8,12,17], rateParams={}) {
  const alphabet = buildAlphabetFromFlags(flags);
  const N = Math.max(0, alphabet.length);
  const rows = [];
  const { rate, perHashSec } = computeRateAndHashTime(rateParams);

  for (const L of lengths) {
    let combos = 0n;
    try { combos = bigPow(N, L); } catch(e){ combos = 0n; }
    const combosFmt = (N === 0) ? '—' : formatBigInt(combos);

    let sec;
    if (N === 0) sec = NaN;
    else if (perHashSec !== null) {
      sec = (combos > BigInt(Number.MAX_SAFE_INTEGER)) ? Infinity : Number(combos) * perHashSec;
    } else {
      sec = (!isFinite(rate) || rate === 0) ? Infinity : ((combos > BigInt(Number.MAX_SAFE_INTEGER)) ? Infinity : Number(combos) / rate);
    }
    const secText = (Number.isFinite(sec)) ? `${sec.toFixed(6)} sekund (${secondsToHuman(sec)})` : '≈ nekonečno';

    rows.push({
      L,
      lower: Boolean(flags.useLower),
      upper: Boolean(flags.useUpper),
      digits: Boolean(flags.useDigits),
      syms: Boolean(flags.useSymbols),
      combosFmt,
      secText
    });
  }
  return rows;
}
