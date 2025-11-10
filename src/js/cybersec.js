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