async function loadKatexIfNeeded() {
    if (window.renderMathInElement) return;
    // load CSS
    if (!document.querySelector('link[data-katex]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
        l.setAttribute('data-katex', '1');
        document.head.appendChild(l);
    }
    // load katex and auto-render scripts sequentially
    const loadScript = (src, attr) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        if (attr) s.setAttribute('data-katex', attr);
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = (e) => reject(new Error('Failed loading ' + src));
        document.head.appendChild(s);
    });

    try {
        await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js', 'katex');
        await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js', 'katex-auto');
    } catch (e) {
        console.warn('Could not load KaTeX auto-render:', e);
    }
}

export async function loadMarkdown(mdFile, docEl, tocEl, slugify, options = {}) {
    try {
        const res = await fetch(mdFile, { cache: 'no-store' });
        if (!res.ok) throw new Error('MD not found');
        const md = await res.text();

        // Render
        const html = window.marked ? marked.parse(md) : `<pre>${md.replace(/[&<]/g, m => ({ '&': '&amp;', '<': '&lt;' }[m]))}</pre>`;
        docEl.innerHTML = html;

        // Convert GitHub/MkDocs-style admonition callouts written as
        // > [!warning] Title\n> rest...
        // into <div class="admonition admonition-warning">...</div>
        (function transformAdmonitions(root){
            const bqs = Array.from(root.querySelectorAll('blockquote'));
            const re = /^\s*\[!(\w+)\]\s*(.*)/i;
            bqs.forEach(bq => {
                const p = bq.querySelector('p');
                if (!p) return;
                const match = p.textContent.match(re);
                if (!match) return;
                const type = match[1].toLowerCase();
                const titleText = match[2] || (type.charAt(0).toUpperCase() + type.slice(1));
                // remove the token from the paragraph HTML (preserve inner markup)
                p.innerHTML = p.innerHTML.replace(/^[\s\n]*\[!\w+\]\s*/i, '');
                // if the author included a title after the token (e.g. "[!warning] Bezpečnost:"),
                // strip that title from the start of the paragraph so it doesn't repeat
                const titleTrim = titleText.trim();
                if (titleTrim) {
                    // escape for regex
                    const esc = titleTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // remove title text and an optional trailing colon from the start of innerHTML/text
                    p.innerHTML = p.innerHTML.replace(new RegExp('^\\s*' + esc + '\\s*:?\s*', 'i'), '');
                }

                const adv = document.createElement('div');
                adv.className = `admonition admonition-${type}`;
                const titleEl = document.createElement('div');
                titleEl.className = 'admonition-title';
                titleEl.textContent = titleText;
                adv.appendChild(titleEl);

                // move all children of blockquote into admonition (except stray empty text)
                Array.from(bq.childNodes).forEach(node => {
                    // avoid moving the title token node twice (we already stripped it)
                    adv.appendChild(node.cloneNode(true));
                });

                bq.parentNode.replaceChild(adv, bq);
            });
        })(docEl);

        // Headings → id + ToC
        const heads = docEl.querySelectorAll('h1, h2, h3');
        tocEl.innerHTML = '';
        heads.forEach(h => {
            if (!h.id) h.id = slugify(h.textContent);
            const a = document.createElement('a');
            a.href = `#${h.id}`;
            a.textContent = h.textContent;
            tocEl.appendChild(a);
        });

        // Otevřít kotvu z URL (hash)
        if (location.hash) {
            document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        }

        // Obarvi kód
        window.hljs?.highlightAll();

        // Render LaTeX if requested (default true). This will dynamically load KaTeX + auto-render if not present.
        const enableKatex = options.katex !== false; // default true
        if (enableKatex) {
            try {
                await loadKatexIfNeeded();
                if (window.renderMathInElement) {
                    // safe defaults: support $, $$, \(...\), \[...\]
                    window.renderMathInElement(docEl, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '\\[', right: '\\]', display: true },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '$', right: '$', display: false }
                        ],
                        throwOnError: false,
                        errorColor: '#cc0000'
                    });
                }
            } catch (err) {
                // don't fail rendering if KaTeX has issues
                console.warn('LaTeX render failed', err);
            }
        }
    } catch (e) {
        docEl.innerHTML = `<p class="muted">Nenašel jsem <code>${mdFile}</code>. Přidej prosím soubor do této složky.</p>`;
        tocEl.innerHTML = '';
    }
}

export default loadMarkdown;
