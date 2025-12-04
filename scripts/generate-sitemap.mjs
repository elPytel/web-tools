// scripts/generate-sitemap.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://elpytel.github.io/web-tools/';

// Pomocná funkce pro XML escapování
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function main() {
  const toolsPath = path.join('src', 'tools.json');
  const raw = await readFile(toolsPath, 'utf8');
  const data = JSON.parse(raw);

  const updated = (data.meta && data.meta.updated) || null;

  // Vytáhneme všechny cesty z categories[].tools[].path
  const toolPaths = [];
  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      if (!cat.tools) continue;
      for (const t of cat.tools) {
        if (t.path) {
          toolPaths.push(t.path);
        }
      }
    }
  }

  // Uděláme unikátní seznam URL
  const urls = new Set();

  // Domovská stránka
  urls.add(BASE_URL);

  for (const rel of toolPaths) {
    // relativní -> plná URL
    const url = new URL(rel, BASE_URL).href;
    urls.add(url);
  }

  const lastmodTag = updated
    ? `<lastmod>${escapeXml(updated)}</lastmod>`
    : '';

  const urlEntries = [...urls].map(u => {
    return [
      '  <url>',
      `    <loc>${escapeXml(u)}</loc>`,
      lastmodTag && `    ${lastmodTag}`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.7</priority>',
      '  </url>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

  // Sitemap musí být v kořeni GitHub Pages – tady přímo do rootu repa
  await writeFile('src/sitemap.xml', xml, 'utf8');
  console.log('✅ sitemap.xml vygenerován. Po pushi na GitHub bude dostupný na:');
  console.log('   https://elpytel.github.io/web-tools/src/sitemap.xml');
}

main().catch(err => {
  console.error('❌ Chyba při generování sitemap.xml:', err);
  process.exit(1);
});
