#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const I18N_DIR = path.join(SRC, 'locale');

// Simple ANSI color helpers (no external deps)
const c = {
  reset: (s) => `\x1b[0m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[22m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

function findFiles(dir, exts = ['.html']) {
  const out = [];
  async function walk(d) {
    const items = await fs.readdir(d, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(d, it.name);
      if (it.isDirectory()) await walk(full);
      else if (exts.includes(path.extname(it.name).toLowerCase())) out.push(full);
    }
  }
  return walk(dir).then(() => out);
}

async function loadI18nFiles() {
  const files = await fs.readdir(I18N_DIR);
  const jsons = files.filter(f => f.endsWith('.json'));
  const out = {};
  for (const f of jsons) {
    // Expect filenames like name.lang.json (e.g. transposition.en.json)
    const parts = f.split('.');
    if (parts.length < 3) continue; // skip unexpected files
    const lang = parts[parts.length - 2];
    const txt = await fs.readFile(path.join(I18N_DIR, f), 'utf8');
    try {
      const parsed = JSON.parse(txt);
      if (!out[lang]) out[lang] = {};
      // merge parsed into out[lang]
      (function merge(target, src) {
        for (const k of Object.keys(src || {})) {
          if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
            if (!target[k] || typeof target[k] !== 'object') target[k] = {};
            merge(target[k], src[k]);
          } else {
            target[k] = src[k];
          }
        }
      })(out[lang], parsed);
    } catch (e) {
      console.error(`ERROR: failed to parse ${f}: ${e.message}`);
      process.exitCode = 2;
    }
  }
  return out;
}

function extractKeysFromHtml(text) {
  const keys = [];
  // matches data-i18n, data-i18n-placeholder, data-i18n-title
  const re = /data-i18n(?:-placeholder|-title)?\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
  let m;
  while ((m = re.exec(text))) {
    const k = m[1] || m[2];
    if (k) keys.push(k);
  }
  return keys;
}

function getNested(obj, pathStr) {
  return pathStr.split('.').reduce((acc, k) => (acc && Object.prototype.hasOwnProperty.call(acc, k) ? acc[k] : undefined), obj);
}

async function main() {
  const htmlFiles = await findFiles(SRC, ['.html']);
  const usedKeysMap = new Map(); // key -> Set(files)
  for (const f of htmlFiles) {
    const txt = await fs.readFile(f, 'utf8');
    const keys = extractKeysFromHtml(txt);
    for (const k of keys) {
      if (!usedKeysMap.has(k)) usedKeysMap.set(k, new Set());
      usedKeysMap.get(k).add(path.relative(ROOT, f));
    }
  }
  const usedKeys = Array.from(usedKeysMap.keys()).sort();

  const i18n = await loadI18nFiles();
  const langs = Object.keys(i18n).sort();
  if (langs.length === 0) {
    console.error('No i18n JSON files found in', I18N_DIR);
    process.exit(1);
  }

  const missing = {};
  for (const lang of langs) missing[lang] = [];

  for (const key of usedKeys) {
    for (const lang of langs) {
      const val = getNested(i18n[lang], key);
      if (typeof val === 'undefined') missing[lang].push(key);
    }
  }

  // Summary header
  console.log(c.bold(`\nI18N check — scanned ${htmlFiles.length} HTML files, found ${usedKeys.length} unique keys, languages: ${langs.join(', ')}`));

  let anyMissing = false;
  for (const lang of langs) {
    if (missing[lang].length) {
      anyMissing = true;
      console.log(c.red(`\nMissing translations for ${lang} (${missing[lang].length}):`));
      for (const k of missing[lang]) {
        const files = Array.from(usedKeysMap.get(k) || []).slice(0, 10);
        console.log('  -', c.yellow(k), c.cyan(`(used in ${files.length} file(s): ${files.join(', ')})`));
      }
    } else {
      console.log(c.green(`\nOK: all keys present for ${lang}`));
    }
  }

  // Also report unused keys in JSON (optional)
  for (const lang of langs) {
    const allKeys = new Set();
    (function walk(obj, prefix='') {
      for (const k of Object.keys(obj || {})) {
        const p = prefix ? `${prefix}.${k}` : k;
        if (obj[k] && typeof obj[k] === 'object') walk(obj[k], p);
        else allKeys.add(p);
      }
    })(i18n[lang]);
    const unused = Array.from(allKeys).filter(k => !usedKeys.includes(k));
    if (unused.length) {
      console.log(c.cyan(`\nNote: ${lang} has ${unused.length} translation keys not used in HTML (possible dead keys).`));
      // show up to 20 unused keys
      const sample = unused.slice(0, 20);
      for (const k of sample) console.log('  •', k);
      if (unused.length > sample.length) console.log(`  ...and ${unused.length - sample.length} more`);
    } else {
      console.log(c.green(`\nNo unused keys for ${lang}`));
    }
  }

  if (anyMissing) process.exitCode = 3;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('check-i18n.mjs')) {
  main().catch(err => { console.error(err); process.exit(2); });
}
