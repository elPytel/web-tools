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

// ========== Wordlist configuration (unified) ==========
  // Map of available wordlists: key -> { label, path }
export const WORDLISTS = [
  { id: 'builtin', label: 'Vestavěný (top common)', path: '../assets/top_common_pswd.txt' },
  { id: 'darkweb', label: 'darkweb2017 top: 10000', path: '../assets/darkweb2017_top-10000.txt' },
  { id: 'nordpass', label: 'nordpass top: 200', path: '../assets/nordpass_top-200.txt' }
];

export function getWordlistEntry(id){
  return WORDLISTS.find(e => e.id === id) || null;
}

export function loadWordlistFromPath(path){
  return fetch(path)
    .then(resp => resp.text())
    .then(text => text.split(/\r?\n/).filter(line => line.trim() !== ''));
}

/**
 * digestText(algo, text)
 * - supports 'MD5' (SparkMD5.hash global), 'SHA-1', 'SHA-256'
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

export function randHex(len){
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/** randEmail(names, surnames)
 * - generates random email address
 * - if names & surnames arrays are provided, uses them to create realistic emails
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

/** randDate()
 * - generates random date between 2015-01-01 and today
 * - returns ISO date string (YYYY-MM-DD)
 */
export function randDate(){
  const start = new Date(2015,0,1).getTime();
  const end = Date.now();
  const d = new Date(start + Math.floor(Math.random()*(end-start)));
  return d.toISOString().slice(0,10);
}

/**
 * makeSalt(len, regdate, mode)
 * - len: number of bytes (hex length = 2*len)
 * - regdate: optional string (ISO date) used when mode === 'regdate'
 * - mode: 'random' (default) or 'regdate'
 */
export function makeSalt(len, regdate=null, mode='random'){
  if (mode === 'regdate' && regdate){
    let h = (typeof SparkMD5 !== 'undefined') ? SparkMD5.hash(String(regdate)) : '';
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
 * loadCommonNames(file, gender)
 * - loads common first names from CSV file:
 * - structure: DRUH_JMENA,JMENO
 * - gender: 'M'/'MUZ', 'F'/'ZENA', or null (both)
 * 
 * - returns array of names
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
 * loadCommonSurnames(file)
 * - loads common surnames from text file (one per line)
 * - returns array of surnames
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