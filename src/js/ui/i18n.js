// src/js/ui/i18n.js

const SUPPORTED = ['cs', 'en'];
const DEFAULT_LANG = 'cs';
const STORAGE_KEY = 'wt_lang';

let currentLang = DEFAULT_LANG;
let dict = null;

function detectLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && SUPPORTED.includes(fromUrl)) {
    console.info('[i18n] detectLang from URL param:', fromUrl);
    return fromUrl;
  }

  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (fromStorage && SUPPORTED.includes(fromStorage)) {
    console.info('[i18n] detectLang from localStorage:', fromStorage);
    return fromStorage;
  }

  const nav = navigator.language || navigator.userLanguage || 'cs';console.info('[i18n] detectLang from navigator.language:', nav);
  if (nav.toLowerCase().startsWith('cs')) {
    return 'cs';
  }
  return 'en';
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

export async function initI18n() {
  currentLang = detectLang();
  console.info(`[i18n] initI18n detected lang=${currentLang}`);
  await loadBaseLang(currentLang);
  applyTranslations();

  // pro přepínač v site-headeru -> poslouchat custom eventy
  window.addEventListener('wt:setLang', async (ev) => {
    const lang = ev.detail?.lang;
    console.info('[i18n] wt:setLang event', { from: currentLang, to: lang });
    if (!lang || !SUPPORTED.includes(lang)) return;
    await setLang(lang);
  });
}

export async function setLang(lang) {
  if (lang === currentLang) {
    console.debug(`[i18n] setLang called but already current=${currentLang}`);
    return;
  }
  console.info(`[i18n] setLang ${currentLang} -> ${lang}`);
  localStorage.setItem(STORAGE_KEY, lang);
  console.info('[i18n] setLang updated localStorage');
  currentLang = lang;
  await loadBaseLang(lang);
  applyTranslations();
  // Signal to interested parties that the language has been updated and
  // base translations have been applied. This event is separate from the
  // incoming `wt:setLang` which is used to *request* a language change
  // (and which some pages dispatch to trigger initI18n's listener).
  try {
    window.dispatchEvent(new CustomEvent('wt:lang:changed', { detail: { lang: currentLang } }));
  } catch (e) { /* ignore in non-DOM environments */ }
}

export async function availableLangsForTool(toolName) {
  const out = [];
  if (!toolName) return out;
  for (const lang of SUPPORTED) {
    const url = new URL(`../../locale/${toolName}.${lang}.json`, import.meta.url).href;
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      if (resp.ok) out.push(lang);
    } catch (e) {
      // fetch HEAD might be blocked by some servers; fall back to GET
      try {
        const r2 = await fetch(url);
        if (r2.ok) out.push(lang);
      } catch (e2) {
        // ignore
      }
    }
  }
  // return only actually available languages (empty if none)
  return out;
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
  // Notify listeners that a tool-specific translation file has been loaded
  // and merged into the dictionary. Use a dedicated event to avoid
  // triggering the language-change reload handler (which listens for
  // `wt:lang:changed`) and could otherwise create a feedback loop.
  try {
    window.dispatchEvent(new CustomEvent('wt:tool:loaded', { detail: { lang: currentLang, tool: name } }));
  } catch (e) { /* ignore in non-DOM environments */ }
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

// Return translated string for a key (or undefined if not available).
export function t(key) {
  try {
    if (!dict) return undefined;
    return getNested(dict, key);
  } catch (e) {
    return undefined;
  }
}

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

  // Reload tool-specific translations when language changes. Some pages
  // dispatch `wt:setLang` to *request* a change, while others call
  // `setLang` directly; therefore listen for both events so reloading
  // happens regardless of how the change was initiated.
  const reloadHandler = async () => {
    try {
      await loadLangFile(toolName);
    } catch (e) {
      console.warn('[i18n] failed to reload tool translations for', toolName, e && e.message);
    }
  };
  // Only reload when the language-change has been confirmed (wt:lang:changed).
  // Listening to `wt:setLang` here is unnecessary because `setLang` will
  // dispatch `wt:lang:changed` when base translations are applied.
  window.addEventListener('wt:lang:changed', reloadHandler);
}

export { detectToolNameFromPath };
