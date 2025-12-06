// src/js/ui/i18n.js

const SUPPORTED = ['cs', 'en'];
const DEFAULT_LANG = 'cs';

let currentLang = DEFAULT_LANG;
let dict = null;

function detectLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;

  const fromStorage = localStorage.getItem('wt_lang');
  if (fromStorage && SUPPORTED.includes(fromStorage)) return fromStorage;

  const nav = navigator.language || navigator.userLanguage || 'cs';
  if (nav.toLowerCase().startsWith('cs')) return 'cs';
  return 'en';
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

export async function initI18n() {
  currentLang = detectLang();
  await loadBaseLang(currentLang);
  applyTranslations();

  // pro přepínač v site-headeru -> poslouchat custom eventy
  window.addEventListener('wt:setLang', async (ev) => {
    const lang = ev.detail?.lang;
    if (!lang || !SUPPORTED.includes(lang)) return;
    await setLang(lang);
  });
}

export async function setLang(lang) {
  if (lang === currentLang) return;
  localStorage.setItem('wt_lang', lang);
  currentLang = lang;
  await loadBaseLang(lang);
  applyTranslations();
}

async function loadBaseLang(lang) {
  // Load canonical files: index.<lang>.json and common.<lang>.json if they exist.
  dict = {};
  const baseNames = ['index', 'common'];
  for (const name of baseNames) {
    const url = new URL(`../../locale/${name}.${lang}.json`, import.meta.url).href;
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const obj = await resp.json();
      mergeDict(dict, obj);
    } catch (e) {
      // ignore missing or parse errors for optional files
      console.warn('[i18n] failed to load', url, e.message);
    }
  }
}

async function loadLangFile(name) {
  const url = new URL(`../../locale/${name}.${currentLang}.json`, import.meta.url).href;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
  const obj = await resp.json();
  mergeDict(dict, obj);
  applyTranslations();
}

function applyTranslations() {
  if (!dict) return;

  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = getNested(dict, key);
    if (typeof val === 'string') {
      // Pokud element obsahuje formulářové prvky, nepřepisuj celý obsah (to by odstranilo inputy).
      // Místo toho upravíme první textový uzel nebo vložíme nový textový uzel před první child.
      const hasFormChild = el.querySelector && el.querySelector('input,textarea,select,button');
      if (hasFormChild) {
        let replaced = false;
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = val;
            replaced = true;
            break;
          }
        }
        if (!replaced) {
          el.insertBefore(document.createTextNode(val), el.firstChild);
        }
      } else {
        // default: přepíšeme text
        el.textContent = val;
      }
    }
  });

  // placeholder překlady pro input / textarea
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = getNested(dict, key);
    if (typeof val === 'string') {
      el.placeholder = val;
    }
  });

  // title atribut překlady (pokud chceme)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = getNested(dict, key);
    if (typeof val === 'string') el.setAttribute('title', val);
  });
}

export function getCurrentLang() {
  return currentLang;
}

export { loadLangFile as loadTranslationsFile };

function mergeDict(target, src) {
  for (const k of Object.keys(src || {})) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      mergeDict(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
  }
}

function detectToolNameFromPath(pathname = location.pathname) {
  try {
    const last = pathname.split('/').filter(Boolean).pop() || '';
    return last.replace(/\.html?$/i, '');
  } catch (e) {
    return '';
  }
}

export async function autoLoadPageTranslations(name) {
  const toolName = name || detectToolNameFromPath();
  if (!toolName) return;
  try {
    await loadLangFile(toolName);
  } catch (e) {
    console.warn('[i18n] autoLoadPageTranslations failed to load', toolName, e && e.message);
  }

  // ensure we only register one listener per tool
  const flag = `__i18n_auto_loaded__:${toolName}`;
  if (window[flag]) return;
  window[flag] = true;

  window.addEventListener('wt:setLang', async () => {
    try {
      await loadLangFile(toolName);
    } catch (e) {
      console.warn('[i18n] failed to reload tool translations for', toolName, e && e.message);
    }
  });
}
