import { initTheme, applyTheme, getStoredTheme } from './theme.js';

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
    try { initTheme(); } catch(e){ /* ignore */ }

    // Ensure a favicon is present for pages that include the shared header.
    // If the page already declares a favicon, don't override it.
    try {
      const hasIcon = !!document.querySelector('link[rel~="icon"], link[rel~="shortcut icon"], link[rel~="apple-touch-icon"]');
      if (!hasIcon) {
        // Prefer the prepared PNG/ICO assets at the site root if available.
        // These are the common set produced by many favicon generators.
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
    } catch (e) { /* ignore if document.head not available */ }

  // set title (attribute 'title' on <site-header> or fallback to document.title before '—')
  const titleAttr = this.getAttribute('title');
  let titleText = titleAttr ? titleAttr : (document.title || '');
  if (!titleAttr && titleText.includes('—')) titleText = titleText.split('—')[0].trim();
  const titleEl = this.querySelector('#site-title');
  if (titleEl) titleEl.textContent = titleText;

  // sync radios with storage
  const stored = localStorage.getItem('site_theme_mode') || 'auto';
  const radios = this.querySelectorAll('#themeControls input[name="theme"]');
  radios.forEach(r => r.checked = (r.value === stored));

    // when user changes radios, apply theme
    const controls = this.querySelector('#themeControls');
    if (controls) controls.addEventListener('change', e => {
      if (e.target && e.target.value) applyTheme(e.target.value);
    });

    // keep radios synced when theme changes elsewhere
    window.addEventListener('theme:changed', ev => {
      const requested = ev.detail && ev.detail.requested ? ev.detail.requested : (localStorage.getItem('site_theme_mode') || 'auto');
      radios.forEach(r => r.checked = (r.value === requested));
    });

    // Note: chips/search are intentionally left out of the shared header.
    // Pages which need search/chips (e.g. menu) should render them locally.
  }
}

customElements.define('site-header', SiteHeader);

export default SiteHeader;
