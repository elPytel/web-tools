export async function loadMarkdown(mdFile, docEl, tocEl, slugify) {
    try {
        const res = await fetch(mdFile, { cache: 'no-store' });
        if (!res.ok) throw new Error('MD not found');
        const md = await res.text();

        // Render
        const html = window.marked ? marked.parse(md) : `<pre>${md.replace(/[&<]/g, m => ({ '&': '&amp;', '<': '&lt;' }[m]))}</pre>`;
        docEl.innerHTML = html;

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
    } catch (e) {
        docEl.innerHTML = `<p class="muted">Nenašel jsem <code>${mdFile}</code>. Přidej prosím soubor do této složky.</p>`;
        tocEl.innerHTML = '';
    }
}
