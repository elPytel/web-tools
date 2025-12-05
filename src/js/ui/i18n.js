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
  await loadLang(currentLang);
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
  await loadLang(lang);
  applyTranslations();
}

async function loadLang(lang) {
  // Resolve path relative to this module so fetch works regardless of page location
  const url = new URL(`../i18n/${lang}.json`, import.meta.url).href;
  const resp = await fetch(url);
  dict = await resp.json();
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
