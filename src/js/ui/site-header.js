import { initTheme, applyTheme, getStoredTheme } from '../ui/theme.js';
import { availableLangsForTool, detectToolNameFromPath, getCurrentLang, setLang, autoLoadPageTranslations, t as i18nT } from './i18n.js';

// Simple shared header inserted into light DOM (no shadow DOM) so it uses global CSS
const template = `
<header>
  <div class="header-top" style="display:flex;align-items:center;justify-content:space-between;gap:1rem">
    <h1 id="site-title">Web Tools</h1>
    <!-- Theme controls (day/auto/night) -->
    <div class="theme-toggle" id="themeControls">
      <label><input type="radio" name="theme" value="auto"> Auto</label>
      <label><input type="radio" name="theme" value="day"> Den</label>
      <label><input type="radio" name="theme" value="night"> Noc</label>
    </div>
  </div>
</header>
`;

class SiteHeader extends HTMLElement {
  constructor(){ super(); }
  connectedCallback(){
    // insert template into this element (light DOM)
    this.innerHTML = template;

    // initialize theme system (idempotent)
    try { initTheme(); } catch(e){ console.warn('[site-header] initTheme failed', e); }

    // Ensure a favicon is present for pages that include the shared header.
    // If the page already declares a favicon, don't override it.
    try {
      const hasIcon = !!document.querySelector('link[rel~="icon"], link[rel~="shortcut icon"], link[rel~="apple-touch-icon"]');
      if (!hasIcon) {
        const links = [
          { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
          { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
          { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
          { rel: 'shortcut icon', href: '/favicon.ico' }
        ];
        for (const attrs of links) {
          const l = document.createElement('link');
          for (const [k, v] of Object.entries(attrs)) l.setAttribute(k, v);
          document.head.appendChild(l);
        }
      }
    } catch (e) { console.warn('[site-header] favicon setup failed', e); }

    const titleAttr = this.getAttribute('title');
    let titleText = titleAttr ? titleAttr : (document.title || '');
    if (!titleAttr && titleText.includes('—')) titleText = titleText.split('—')[0].trim();
    const titleEl = this.querySelector('#site-title');

    // Translation ownership: if the host provides a data-i18n key (or
    // data-i18n-header), the header component should *own* applying that
    // translation. Remove the attribute so the global DOM walker doesn't
    // attempt to set text on the custom element (which causes duplicates
    // for components that contain form controls). Keep backwards
    // compatibility for pages that don't provide any key.
    const hostKey = this.getAttribute('data-i18n') || this.getAttribute('data-i18n-header');
    if (hostKey) {
      // consume the attribute to prevent the global translation pass
      try { this.removeAttribute('data-i18n'); } catch (e) {}
      try { this.removeAttribute('data-i18n-header'); } catch (e) {}

      const applyHostTitle = () => {
        try {
          const v = i18nT(hostKey);
          if (v && titleEl) {
            titleEl.textContent = v;
            return;
          }
        } catch (e) { /* ignore */ }
        // fallback
        if (titleEl) titleEl.textContent = titleText;
      };

      // initial attempt (i18n may not yet be loaded)
      applyHostTitle();

      // update when language changes. Listen to both the incoming request
      // event (`wt:setLang`) as well as the post-update event
      // (`wt:lang:changed`) dispatched by `setLang` so the header updates
      // whether the change was requested externally or invoked programmatically.
      window.addEventListener('wt:setLang', applyHostTitle);
      window.addEventListener('wt:lang:changed', applyHostTitle);
      // Update when a tool-specific translation file has finished loading
      // so the header can pick up per-page keys (e.g. `affine.header`).
      window.addEventListener('wt:tool:loaded', applyHostTitle);
    } else {
      if (titleEl) titleEl.textContent = titleText;
    }

    const stored = localStorage.getItem('site_theme_mode') || 'auto';
    const radios = this.querySelectorAll('#themeControls input[name="theme"]');
    radios.forEach(r => r.checked = (r.value === stored));

    const controls = this.querySelector('#themeControls');
    if (controls) controls.addEventListener('change', e => {
      // Only react to user-initiated changes on the theme radio inputs.
      // The language <select> is appended into the same container, and
      // its change events bubble here. Ignoring non-theme targets avoids
      // accidentally passing language codes (e.g. 'en') to applyTheme
      // which normalize to 'auto'. Also ignore programmatic events.
      try {
        if (!e || e.isTrusted === false) return;
        const tgt = e.target;
        if (!tgt) return;
        const tag = tgt.tagName && tgt.tagName.toLowerCase();
        if (tag === 'input' && tgt.name === 'theme') {
          if (tgt.value) applyTheme(tgt.value);
        }
      } catch (err) {
        // be defensive: don't allow header listener to throw
        console.warn('[site-header] theme control handler error', err);
      }
    });

    // Language selector (placed next to theme controls)
    (async () => {
      try {
        const langContainer = this.querySelector('#themeControls');
        if (!langContainer) return;
        const toolName = detectToolNameFromPath();
        const avail = await availableLangsForTool(toolName);
        if (!avail || avail.length <= 1) return; // single-language -> don't render selector

        const select = document.createElement('select');
        select.className = 'form-control auto-width';
        select.setAttribute('aria-label', 'language');
        const labels = { cs: 'CZ', en: 'EN' };
        for (const l of avail) {
          const opt = document.createElement('option');
          opt.value = l;
          opt.textContent = labels[l] || l.toUpperCase();
          select.appendChild(opt);
        }

        // initial value: prefer explicit stored user choice, then document lang, then i18n helper
        try {
          const storedLang = (typeof localStorage !== 'undefined') ? localStorage.getItem('wt_lang') : null;
          select.value = storedLang || document.documentElement.lang || getCurrentLang();
        } catch (e) {
          try { select.value = document.documentElement.lang || getCurrentLang(); } catch (ee) {}
        }

        select.addEventListener('change', async (ev) => {
          const v = ev.target.value;
          try { await setLang(v); } catch(e) { console.warn('[site-header] setLang failed', e); }
          try { await autoLoadPageTranslations(toolName); } catch(e) { console.warn('[site-header] autoLoadPageTranslations failed', e); }
        });

        // keep select in sync when language changes elsewhere
        try {
          window.addEventListener('wt:setLang', (ev) => {
            try { select.value = ev?.detail?.lang || document.documentElement.lang || getCurrentLang(); } catch (e) { /* ignore */ }
          });
        } catch (e) { /* ignore if window not available */ }

        // append after theme controls
        langContainer.appendChild(select);
      } catch (e) {
        console.warn('[site-header] error populating language selector', e);
      }
    })();

    window.addEventListener('theme:changed', ev => {
      const requested = ev.detail && ev.detail.requested ? ev.detail.requested : (localStorage.getItem('site_theme_mode') || 'auto');
      radios.forEach(r => r.checked = (r.value === requested));
    });
  }
}

customElements.define('site-header', SiteHeader);

export default SiteHeader;
