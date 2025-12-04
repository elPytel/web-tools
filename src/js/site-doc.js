// Lightweight web component to render an external markdown file (docs/theory) declaratively.
// Usage: <script type="module" src="../js/site-doc.js"></script>
//        <site-doc src="caesar_explain.md" title="📘 Vysvětlení" toggle></site-doc>

const DEFAULT_TITLE = '📘 Dokumentace';



class SiteDoc extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.src = this.getAttribute('src') || '';
    this.title = this.getAttribute('title') || DEFAULT_TITLE;
    this.toggleable = this.hasAttribute('toggle');

    this._renderShell();
    // load markdown asynchronously
    this._loadMarkdown();
  }

  _storageKey() {
    return `site_doc:${this.src || this.title}`;
  }

  _renderShell() {
    // Create a simple light-DOM structure so global CSS (style.css) and highlight/KaTeX
    // can style the content normally.
    this.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'card';

    const headerBar = document.createElement('div');
    headerBar.className = 'explain-bar';

    const h = document.createElement('h2');
    h.textContent = this.title;
    headerBar.appendChild(h);

    if (this.toggleable) {
      const lab = document.createElement('label');
      lab.className = 'toggle-toggle';
      lab.style.margin = '0';
      lab.style.alignItems = 'center';
      lab.style.display = 'flex';
      lab.style.gap = '8px';

      const span = document.createElement('span');
      span.className = 'small';
      span.textContent = 'Zobrazit';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.setAttribute('aria-label', `${this.title} (zobrazit/skrýt)`);

      // restore persisted state
      const saved = localStorage.getItem(this._storageKey());
      if (saved !== null) chk.checked = (saved !== '0'); else chk.checked = true;

      chk.addEventListener('change', () => {
        const show = chk.checked;
        body.style.display = show ? '' : 'none';
        toc.style.display = show ? '' : 'none';
        localStorage.setItem(this._storageKey(), show ? '1' : '0');
        chk.setAttribute('aria-checked', show ? 'true' : 'false');
      });

      lab.appendChild(span);
      lab.appendChild(chk);
      headerBar.appendChild(lab);
    }

    wrapper.appendChild(headerBar);

    const toc = document.createElement('div');
    toc.className = 'toc';
    wrapper.appendChild(toc);

    const body = document.createElement('article');
    body.className = 'md';
    wrapper.appendChild(body);

    this.appendChild(wrapper);

    // expose for loader
    this._bodyEl = body;
    this._tocEl = toc;
  }

  async _loadMarkdown() {
    if (!this.src) return;
    try {
      // Ensure common markdown & highlighting libs are available. If pages didn't include
      // `marked` or `highlight.js` as globals, load lightweight CDN bundles so
      // _loadMarkdown can render reliably.
      const loadScriptOnce = (src, tagAttr) => new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          if (existing.getAttribute('data-site-doc-loaded') === '1') return resolve();
          existing.addEventListener('load', () => { existing.setAttribute('data-site-doc-loaded', '1'); resolve(); });
          existing.addEventListener('error', (e) => reject(new Error('Failed loading ' + src)));
          return;
        }
        const s = document.createElement('script');
        if (tagAttr) s.setAttribute('data-site-doc', tagAttr);
        s.src = src;
        s.async = true;
        s.onload = () => { s.setAttribute('data-site-doc-loaded', '1'); resolve(); };
        s.onerror = () => reject(new Error('Failed loading ' + src));
        document.head.appendChild(s);
      });

      const loadCssOnce = (href) => new Promise((resolve) => {
        const existing = document.querySelector(`link[href="${href}"]`);
        if (existing) return resolve();
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
        // stylesheets don't reliably fire load across all browsers; resolve immediately.
        resolve();
      });

      async function ensureMarkedAndHljs() {
        // Prefer CDN first for up-to-date libraries; fall back to local vendor files
        // under `/js/vendor/*` when CDN resources fail or are unavailable.
        const localMarked = '/js/vendor/marked.min.js';
        const localHljs = '/js/vendor/highlight.common.min.js';
        const localCss = '/js/vendor/github-dark.min.css';

        // marked (markdown parser) — try CDN, then local
        if (!window.marked) {
          try {
            await loadScriptOnce('https://cdn.jsdelivr.net/npm/marked/marked.min.js', 'marked-cdn');
          } catch (cdnErr) {
            console.warn('site-doc: CDN marked failed, attempting local vendor', cdnErr);
            try {
              await loadScriptOnce(localMarked, 'marked-local');
            } catch (localErr) {
              console.warn('site-doc: local marked fallback failed', localErr);
            }
          }
        }

        // highlight.js (syntax highlighting + optional stylesheet) — try CDN, then local
        if (!window.hljs) {
          try {
            await loadCssOnce('https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github-dark.min.css');
            await loadScriptOnce('https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/lib/common.min.js', 'hljs-cdn');
          } catch (cdnErr) {
            console.warn('site-doc: CDN highlight.js failed, attempting local vendor', cdnErr);
            try {
              await loadCssOnce(localCss);
              await loadScriptOnce(localHljs, 'hljs-local');
            } catch (localErr) {
              console.warn('site-doc: local highlight.js fallback failed', localErr);
            }
          }
        }
      }

      try {
        await ensureMarkedAndHljs();
      } catch (err) {
        // If the CDN load fails, continue — core/markdown will degrade gracefully.
        console.warn('site-doc: optional dependency load failed', err);
      }

      // import the existing markdown_tools which handles KaTeX, highlighting and TOC
      const mod = await import('./core/markdown.js');

      // fallback slugify (same as earlier pages)
      const slugify = s => s
        .toLowerCase()
        .normalize('NFD').replace(/\p{M}/gu, '')
        .replace(/[^\w\s-]/g, '')
        .trim().replace(/\s+/g, '-');

      // markdown_tools.loadMarkdown expects (mdFile, targetEl, tocEl, slugify)
      await mod.loadMarkdown(this.src, this._bodyEl, this._tocEl, slugify);
    } catch (err) {
      console.warn('site-doc: failed to load markdown', err);
      if (this._bodyEl) this._bodyEl.innerHTML = `<div class="muted">Nelze načíst dokumentaci: ${err && err.message ? err.message : String(err)}</div>`;
    }
  }
}

customElements.define('site-doc', SiteDoc);

export default SiteDoc;
