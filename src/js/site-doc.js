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

    console.log('[site-doc] connectedCallback', { src: this.src, title: this.title, toggleable: this.toggleable });

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
    console.log('[site-doc] shell rendered; body/toc elements created');
  }

  async _loadMarkdown() {
    if (!this.src) {
      console.warn('[site-doc] _loadMarkdown called but `src` is empty');
      return;
    }
    console.log('[site-doc] loading markdown ->', this.src);
    try {
      // Ensure common markdown & highlighting libs are available. If pages didn't include
      // `marked` or `highlight.js` as globals, load lightweight CDN bundles so
      // _loadMarkdown can render reliably.
      const loadScriptOnce = (src, tagAttr) => new Promise((resolve, reject) => {
        console.log('[site-doc] loadScriptOnce requested for', src, { tagAttr });
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          console.log('[site-doc] script element already present for', src);
          if (existing.getAttribute('data-site-doc-loaded') === '1') return resolve();
          existing.addEventListener('load', () => { existing.setAttribute('data-site-doc-loaded', '1'); console.log('[site-doc] existing script loaded', src); resolve(); });
          existing.addEventListener('error', (e) => { console.warn('[site-doc] existing script error', src, e); reject(new Error('Failed loading ' + src)); });
          return;
        }
        const s = document.createElement('script');
        if (tagAttr) s.setAttribute('data-site-doc', tagAttr);
        s.src = src;
        s.async = true;
        s.onload = () => { s.setAttribute('data-site-doc-loaded', '1'); console.log('[site-doc] script loaded', src); resolve(); };
        s.onerror = (ev) => { console.warn('[site-doc] script failed to load', src, ev); reject(new Error('Failed loading ' + src)); };
        document.head.appendChild(s);
      });

      const loadCssOnce = (href) => new Promise((resolve) => {
        console.log('[site-doc] loadCssOnce requested for', href);
        const existing = document.querySelector(`link[href="${href}"]`);
        if (existing) { console.log('[site-doc] stylesheet already present for', href); return resolve(); }
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
        // stylesheets don't reliably fire load across all browsers; resolve immediately.
        console.log('[site-doc] stylesheet appended', href);
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
          console.log('[site-doc] marked not present; attempting CDN then local');
          try {
            await loadScriptOnce('https://cdn.jsdelivr.net/npm/marked/marked.min.js', 'marked-cdn');
            console.log('[site-doc] loaded marked from CDN');
          } catch (cdnErr) {
            console.warn('site-doc: CDN marked failed, attempting local vendor', cdnErr);
            try {
              await loadScriptOnce(localMarked, 'marked-local');
              console.log('[site-doc] loaded marked from local vendor', localMarked);
            } catch (localErr) {
              console.warn('site-doc: local marked fallback failed', localErr);
            }
          }
        } else {
          console.log('[site-doc] marked already available on window');
        }

        // highlight.js (syntax highlighting + optional stylesheet) — try CDN, then local
        if (!window.hljs) {
          console.log('[site-doc] hljs not present; attempting CDN then local');
          try {
            await loadCssOnce('https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github-dark.min.css');
            await loadScriptOnce('https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/lib/common.min.js', 'hljs-cdn');
            console.log('[site-doc] loaded highlight.js from CDN');
          } catch (cdnErr) {
            console.warn('site-doc: CDN highlight.js failed, attempting local vendor', cdnErr);
            try {
              await loadCssOnce(localCss);
              await loadScriptOnce(localHljs, 'hljs-local');
              console.log('[site-doc] loaded highlight.js from local vendor', localHljs);
            } catch (localErr) {
              console.warn('site-doc: local highlight.js fallback failed', localErr);
            }
          }
        } else {
          console.log('[site-doc] hljs already available on window');
        }
      }

      try {
        await ensureMarkedAndHljs();
      } catch (err) {
        // If the CDN load fails, continue — core/markdown will degrade gracefully.
        console.warn('site-doc: optional dependency load failed', err);
      }

      // Verify the markdown file exists before importing and trying to render it.
      let mdExists = false;
      try {
        try {
          const headResp = await fetch(this.src, { method: 'HEAD' });
          mdExists = headResp && headResp.ok;
        } catch (headErr) {
          // Some servers don't support HEAD; fall back to GET.
          const getResp = await fetch(this.src, { method: 'GET' });
          mdExists = getResp && getResp.ok;
        }
      } catch (checkErr) {
        mdExists = false;
      }

      if (!mdExists) {
        console.warn('[site-doc] markdown not found, removing component:', this.src);
        try { if (this.parentNode) this.parentNode.removeChild(this); else this.remove(); } catch (e) { try { this.style.display = 'none'; } catch (ee) {} }
        return;
      }

      // import the existing markdown_tools which handles KaTeX, highlighting and TOC
      const mod = await import('./core/markdown.js');
      console.log('[site-doc] markdown module loaded, calling loadMarkdown for', this.src);

      // fallback slugify (same as earlier pages)
      const slugify = s => s
        .toLowerCase()
        .normalize('NFD').replace(/\p{M}/gu, '')
        .replace(/[^\w\s-]/g, '')
        .trim().replace(/\s+/g, '-');

      // markdown_tools.loadMarkdown expects (mdFile, targetEl, tocEl, slugify)
      await mod.loadMarkdown(this.src, this._bodyEl, this._tocEl, slugify);
      console.log('[site-doc] loadMarkdown finished for', this.src);
    } catch (err) {
      console.warn('site-doc: failed to load markdown', err);
      console.warn(err && err.stack ? err.stack : err);
      // If the documentation can't be loaded (404 or other error), remove
      // the entire component so the card does not appear on the page.
      try {
        if (this.parentNode) this.parentNode.removeChild(this);
        else this.remove();
      } catch (removeErr) {
        // fallback: hide the element
        try { this.style.display = 'none'; } catch (e) {}
      }
      return;
    }
  }
}

customElements.define('site-doc', SiteDoc);

export default SiteDoc;
