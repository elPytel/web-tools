// Dynamically import ESM PDF.js to guarantee an exported module (handles CDN variants)
(async ()=>{
  try {
    console.log('[pdf-organizer] importing pdfjs ESM...');
    // use a working ESM build with proper CORS headers
    const mod = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.mjs');
    const pdfjsLib = mod.default || mod;
    const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.mjs';
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      console.log('[pdf-organizer] pdfjs ESM loaded, workerSrc =', workerUrl);
    } else {
      console.warn('[pdf-organizer] imported pdfjs missing GlobalWorkerOptions', pdfjsLib);
    }
    // expose to legacy code in this file
    window.__pdfjsLib = pdfjsLib;
  } catch (err) {
    console.error('[pdf-organizer] failed to import pdfjs ESM', err);
    window.__pdfjsLib = undefined;
  }

  // nyní spusť hlavní logiku (může číst window.__pdfjsLib a global PDFLib)
  main();
})();

function main(){
  // global error instrumentation
  window.addEventListener('error', (ev)=> console.error('[pdf-organizer] window.error', ev.error || ev.message, ev));
  window.addEventListener('unhandledrejection', (ev)=> console.error('[pdf-organizer] unhandledrejection', ev.reason));

  console.log('[pdf-organizer] module start - checking pdfjs globals:', {
    __pdfjsLib: window.__pdfjsLib,
    pdfjsBuild: window['pdfjs-dist/build/pdf'],
    pdfjsLib: window.pdfjsLib
  });
  const pdfjsLib = window.__pdfjsLib || window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
  console.log('[pdf-organizer] resolved pdfjsLib:', pdfjsLib && {
    hasGetDocument: !!(pdfjsLib && pdfjsLib.getDocument),
    workerSrc: pdfjsLib && pdfjsLib.GlobalWorkerOptions && pdfjsLib.GlobalWorkerOptions.workerSrc,
    version: pdfjsLib && pdfjsLib.version
  });

  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>[...r.querySelectorAll(s)];
  const status = (msg)=> $('#status').textContent = 'Stav: ' + msg;

  const grid = $('#grid');
  const fileEl = $('#file');
  const dropEl = $('#drop');

  const btnAdd = $('#btnAdd');
  const btnSelectAll = $('#btnSelectAll');
  const btnClearSel = $('#btnClearSel');
  const btnDelete = $('#btnDelete');
  const btnDuplicate = $('#btnDuplicate');
  const btnExportAll = $('#btnExportAll');
  const btnExportSel = $('#btnExportSel');

  // ===== Data model =====
  /** @type {Array<{id:string,name:string,bytes:Uint8Array,pdfDoc?:any,pdfjsDoc?:any,pageCount:number}>} */
  const sources = [];
  /** @type {Array<{id:string,srcId:string,pageIndex:number, label:string}>} */
  let pages = [];

  async function ensurePdfLib(src){
    if (!src.pdfDoc) src.pdfDoc = await PDFLib.PDFDocument.load(src.bytes);
    return src.pdfDoc;
  }
  async function ensurePdfJs(src){
    console.log('[pdf-organizer] ensurePdfJs start', { srcId: src.id, name: src.name, hasPdfjs: !!pdfjsLib });
    if (!src.pdfjsDoc) {
      if (!pdfjsLib || !pdfjsLib.getDocument) {
        const e = new Error('PDF.js library not available (pdfjsLib missing)');
        console.error('[pdf-organizer] ensurePdfJs error', e);
        throw e;
      }
      console.log('[pdf-organizer] calling pdfjsLib.getDocument for', src.id);
      try {
        const docReq = pdfjsLib.getDocument({ data: src.bytes });
        src.pdfjsDoc = docReq.promise ? await docReq.promise : await docReq;
        console.log('[pdf-organizer] pdfjs loaded document', { srcId: src.id, numPages: src.pdfjsDoc && src.pdfjsDoc.numPages });
      } catch (err) {
        console.error('[pdf-organizer] pdfjs getDocument failed for', src.id, err);
        throw err;
      }
    }
    return src.pdfjsDoc;
  }

  function uid(){ return crypto.randomUUID(); }

  function renderGrid(){
    grid.innerHTML = '';
    pages.forEach((pg, idx)=>{
      const src = sources.find(s => s.id === pg.srcId);
      const el = document.createElement('div');
      el.className = 'thumb';
      el.draggable = true;
      el.dataset.id = pg.id;
      el.dataset.index = idx;

      el.innerHTML = `
        <div class="sel" title="Vybrat/odznačit">✓</div>
        <div class="badge">${idx+1}</div>
        <div class="page"><canvas></canvas></div>
        <div class="meta"><span>${escapeHtml(src?.name || 'PDF')}</span><span>str. ${pg.pageIndex+1}</span></div>
      `;

      if (selected.has(pg.id)) el.classList.add('selected');

      el.addEventListener('dragstart', (e)=>{
        el.classList.add('dragging');
        e.dataTransfer.setData('text/plain', pg.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend', ()=> el.classList.remove('dragging'));
      el.addEventListener('dragover', (e)=>{
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      el.addEventListener('drop', (e)=>{
        e.preventDefault();
        const dragId = e.dataTransfer.getData('text/plain');
        if (!dragId || dragId === pg.id) return;
        reorderPage(dragId, pg.id);
      });

      el.querySelector('.sel').addEventListener('click', ()=>{
        toggleSelect(pg.id);
        el.classList.toggle('selected', selected.has(pg.id));
      });

      grid.appendChild(el);
      lazyThumb(el, pg);
    });
    status(`Načteno stránek: ${pages.length} • Zdrojových PDF: ${sources.length}`);
  }

  const selected = new Set();
  function toggleSelect(id){
    if (selected.has(id)) selected.delete(id); else selected.add(id);
  }
  function clearSelection(){ selected.clear(); $$('.thumb', grid).forEach(e=>e.classList.remove('selected')); }
  function selectAll(){ pages.forEach(p=>selected.add(p.id)); $$('.thumb', grid).forEach(e=>e.classList.add('selected')); }

  function reorderPage(dragId, dropId){
    const a = pages.findIndex(p=>p.id===dragId);
    const b = pages.findIndex(p=>p.id===dropId);
    if (a<0 || b<0 || a===b) return;
    const [item] = pages.splice(a,1);
    pages.splice(b,0,item);
    renderGrid();
  }

  const obs = new IntersectionObserver(async entries=>{
    for (const ent of entries){
      if (!ent.isIntersecting) continue;
      const el = ent.target;
      obs.unobserve(el);
      const id = el.dataset.id;
      const pg = pages.find(p=>p.id===id);
      if (!pg) continue;
      await renderThumbInto(el, pg);
    }
  }, { root: null, rootMargin: '200px', threshold: 0.01 });

  function lazyThumb(el, pg){ obs.observe(el); }

  async function renderThumbInto(el, pg){
    try {
      console.log('[pdf-organizer] renderThumbInto enter', { pageId: pg.id, srcId: pg.srcId, pageIndex: pg.pageIndex });
      const src = sources.find(s=>s.id===pg.srcId);
      if (!src) return;
      const pdf = await ensurePdfJs(src);
      const page = await pdf.getPage(pg.pageIndex+1);

      const pageBox = el.querySelector('.page');
      const canvas = el.querySelector('canvas');
      if (!canvas || !pageBox) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const box = pageBox.getBoundingClientRect();
      const targetCssW = Math.max(32, Math.floor(box.width));
      console.log('[pdf-organizer] pageBox metrics', { boxWidth: box.width, targetCssW });

      const dpr = window.devicePixelRatio || 1;
      const baseVp = page.getViewport({ scale: 1 });
      const scale = targetCssW / baseVp.width;
      const vp = page.getViewport({ scale: scale * dpr });
      console.log('[pdf-organizer] viewport', { baseWidth: baseVp.width, scale, dpr, vpWidth: vp.width, vpHeight: vp.height });

      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
      canvas.style.height = `${Math.floor(vp.height / dpr)}px`;

      const renderResult = page.render({ canvasContext: ctx, viewport: vp });
      if (renderResult && typeof renderResult.then === 'function') {
        await renderResult;
      } else if (renderResult && renderResult.promise) {
        await renderResult.promise;
      }
      console.log('[pdf-organizer] renderThumbInto done', { pageId: pg.id });
    } catch (e) {
      console.warn('Render thumb failed', e);
    }
  }

  btnAdd.addEventListener('click', ()=> fileEl.click());
  fileEl.addEventListener('change', async (e)=>{
    await addFiles([...e.target.files]);
    fileEl.value = '';
  });

  ;['dragenter','dragover'].forEach(ev => dropEl.addEventListener(ev, e=>{ e.preventDefault(); dropEl.classList.add('drag'); }));
  ;['dragleave','drop'].forEach(ev => dropEl.addEventListener(ev, e=>{ e.preventDefault(); dropEl.classList.remove('drag'); }));
  dropEl.addEventListener('drop', async (e)=>{
    const files = [...(e.dataTransfer?.files || [])].filter(f=>f.type==='application/pdf' || f.name.endsWith('.pdf'));
    await addFiles(files);
  });

  async function addFiles(files){
    if (!files.length) return;
    status(`Načteno ${files.length} soubor(ů)…`);
    for (const f of files){
      const buf = new Uint8Array(await f.arrayBuffer());
      const src = { id: uid(), name: f.name, bytes: buf, pageCount: 0, pdfDoc: undefined, pdfjsDoc: undefined };
      console.log('[pdf-organizer] addFiles - new source', { id: src.id, name: src.name, size: buf.length });
      try {
        const doc = await PDFLib.PDFDocument.load(buf);
        src.pdfDoc = doc;
        src.pageCount = doc.getPageCount();
        console.log('[pdf-organizer] pdf-lib loaded', { id: src.id, pageCount: src.pageCount });
      } catch (e){
        try {
          if (!pdfjsLib || !pdfjsLib.getDocument) throw new Error('PDF.js not available');
          const pdfjsDoc = await pdfjsLib.getDocument({ data: buf }).promise;
          src.pdfjsDoc = pdfjsDoc;
          src.pageCount = pdfjsDoc.numPages;
          console.log('[pdf-organizer] pdfjs fallback loaded', { id: src.id, pageCount: src.pageCount });
        } catch (err) {
          console.error('PDF parse failed', err);
          continue;
        }
      }
      sources.push(src);
      for (let i=0; i<src.pageCount; i++){
        pages.push({ id: uid(), srcId: src.id, pageIndex: i, label: `${src.name}#${i+1}` });
      }
    }
    renderGrid();
  }

  btnSelectAll.addEventListener('click', ()=>{ selectAll(); renderGrid(); });
  btnClearSel.addEventListener('click', ()=>{ clearSelection(); renderGrid(); });

  btnDelete.addEventListener('click', ()=>{
    if (!selected.size) return;
    pages = pages.filter(p => !selected.has(p.id));
    clearSelection();
    renderGrid();
  });

  btnDuplicate.addEventListener('click', ()=>{
    if (!selected.size) return;
    const clones = [];
    for (const p of pages){
      clones.push(p);
      if (selected.has(p.id)){
        clones.push({ id: uid(), srcId: p.srcId, pageIndex: p.pageIndex, label: p.label });
      }
    }
    pages = clones;
    renderGrid();
  });

  btnExportAll.addEventListener('click', ()=> exportPages(pages));
  btnExportSel.addEventListener('click', ()=>{
    const arr = pages.filter(p => selected.has(p.id));
    if (!arr.length){ alert('Nejsou vybrané žádné stránky.'); return; }
    exportPages(arr);
  });

  async function exportPages(items){
    if (!items.length) return;
    status('Exportuji… (slučuji stránky)');
    const out = await PDFLib.PDFDocument.create();

    const bySrc = new Map();
    for (const it of items){
      if (!bySrc.has(it.srcId)) bySrc.set(it.srcId, []);
      bySrc.get(it.srcId).push(it.pageIndex);
    }

    for (const [srcId, idxs] of bySrc.entries()){
      const src = sources.find(s=>s.id===srcId);
      if (!src) continue;
      const doc = await ensurePdfLib(src);
      const unique = [...new Set(idxs)];
      const copied = await out.copyPages(doc, unique);
      const indexMap = new Map(unique.map((pi, i)=>[pi, i]));
      for (const it of items.filter(x=>x.srcId===srcId)){
        const pick = copied[indexMap.get(it.pageIndex)];
        out.addPage(pick);
      }
    }

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = buildExportName(items);
    document.body.appendChild(a); a.click(); a.remove();
    status(`Hotovo. Vyexportováno stran: ${items.length}`);
  }

  function buildExportName(items){
    const srcSet = new Set(items.map(i=>sources.find(s=>s.id===i.srcId)?.name || 'pdf'));
    const base = (srcSet.size===1 ? [...srcSet][0].replace(/\.pdf$/i,'') : 'merged');
    return `${base}-organized.pdf`;
  }

  function escapeHtml(s=''){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  status('Připraveno. Přidej PDF soubory (více najednou je podporováno). Přeskládej, vyber a exportuj.');
}