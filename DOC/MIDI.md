
# 1) Přehrávací hlava + auto-scroll

Uvidíš běžící svislou linku a editor se bude jemně posouvat.

**CSS** (přidej do `<style>`):

```css
.playhead {
  position:absolute; top:0; bottom:0; width:2px;
  background: var(--accent, #3b82f6); opacity:.85; pointer-events:none;
}
```

**HTML** (do `#gridArea` přidej hned po vytvoření kontejneru – stačí jednorázově):

```js
const playhead = document.createElement('div');
playhead.id = 'playhead';
playhead.className = 'playhead';
gridElArea.appendChild(playhead);
```

**JS** (nahoru k proměnným):

```js
let playheadRAF = null;
```

**JS** (po `Tone.Transport.start()` ve `rebuildAndPlay()`):

```js
const startTime = Tone.now();
cancelAnimationFrame(playheadRAF);
const bpmNow = Tone.Transport.bpm.value;
const secPerQ = 60 / bpmNow;

const animate = () => {
  const t = Tone.now() - startTime;          // sekundy od startu
  const q = t / secPerQ;                      // čtvrti
  const x = Math.round(q * PX_PER_Q);
  playhead.style.left = x + 'px';
  // auto-scroll, drž playhead s malou rezervou
  const viewL = roll.scrollLeft, viewR = viewL + roll.clientWidth - 120;
  if (x > viewR) roll.scrollLeft = x - (roll.clientWidth - 120);
  playheadRAF = requestAnimationFrame(animate);
};
playheadRAF = requestAnimationFrame(animate);

// při stopnutí:
Tone.Transport.scheduleOnce(()=>{
  cancelAnimationFrame(playheadRAF);
  playhead.style.left = '0px';
  status('Stop (konec skladby)');
}, endSec);
```

A když klikneš na **Stop**:

```js
btnStop.addEventListener('click', ()=>{
  Tone.Transport.stop();
  cancelAnimationFrame(playheadRAF);
  playhead.style.left = '0px';
  status('Stop');
});
```

---

# 2) Respektuj tempo z MIDI (tempo map)

Když načteš soubor, převezmi první nalezené tempo (fallback na ruční vstup).

**Po `midi = new Midi(...)` v `loadMidiFromArrayBuffer`:**

```js
const tempoEv = midi.header.tempos?.[0];
if (tempoEv && tempoEv.bpm) {
  tempoEl.value = Math.round(tempoEv.bpm);
}
```

> Pozn.: @tonejs/midi umí i vícetempové skladby; pro MVP ber první tempo. Později lze přehrávání plánovat v „ticks“ s mapou.

---

# 3) Export zpět do .mid

Umožní stáhnout, co jsi v editoru poskládal.

**Tlačítko do toolbaru:**

```html
<button id="btnExport" class="btn">⬇ Export .mid</button>
```

**JS – handler:**

```js
import { Midi } from 'https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.28/build/Midi.js';

const btnExport = document.getElementById('btnExport');
btnExport.addEventListener('click', ()=>{
  const m = new Midi();
  m.header.timeSignatures.push({ ticks:0, timeSignature:[4,4], measures:0 });
  m.header.setTempo(Number(tempoEl.value) || 120);

  const tr = m.addTrack();
  // převod čtvrťů -> sekundy
  const bpm = Number(tempoEl.value) || 120;
  const secPerQ = 60 / bpm;

  for (const n of notes) {
    tr.addNote({
      midi: n.pitch,
      time: n.timeQ * secPerQ,
      duration: n.durQ * secPerQ,
      velocity: Math.max(0, Math.min(1, n.vel ?? 0.8)),
    });
  }

  const blob = new Blob([m.toArray()], { type: 'audio/midi' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'midi_editor_export.mid';
  document.body.appendChild(a);
  a.click();
  a.remove();
});
```

---

# 4) Rychlá kvantizace vybraných not

Jedno tlačítko, které srovná vybranou notu na mřížku.

**Tlačítko:**

```html
<button id="btnQuant" class="btn">⌁ Kvantizovat</button>
```

**JS – handler:**

```js
const btnQuant = document.getElementById('btnQuant');
btnQuant.addEventListener('click', ()=>{
  if (!selectedId) return;
  const n = notes.find(x=>x.id===selectedId);
  if (!n) return;
  const step = 1/Math.max(1, Number(gridEl.value)||4);
  n.timeQ = Math.max(0, Math.round(n.timeQ / step) * step);
  n.durQ  = Math.max(1/16, Math.round(n.durQ / step) * step);
  redrawGrid(); buildRuler(); updateSelectedPanel();
});
```

---

# 5) Jemné doladění UX editoru

* **Zabránit nechtěnému označování textu** během drag:

```css
.grid, .note { user-select:none; -webkit-user-select:none; }
```

* **Arrow klávesy** pro jemný posun vybrané noty:

```js
document.addEventListener('keydown', (e)=>{
  if (!selectedId) return;
  const n = notes.find(x=>x.id===selectedId);
  if (!n) return;
  const stepQ = 1/Math.max(1, Number(gridEl.value)||4);
  if (e.key==='ArrowLeft'){ n.timeQ = Math.max(0, n.timeQ - stepQ); }
  else if (e.key==='ArrowRight'){ n.timeQ = n.timeQ + stepQ; }
  else if (e.key==='ArrowUp'){ n.pitch = Math.min(MAX_NOTE, n.pitch + 1); }
  else if (e.key==='ArrowDown'){ n.pitch = Math.max(MIN_NOTE, n.pitch - 1); }
  else return;
  e.preventDefault();
  redrawGrid(); selectNote(n.id);
});
```

* **Kolečko myši nad notou mění velocity** (rychlejší výuka dynamiky):

```js
gridElArea.addEventListener('wheel', (e)=>{
  const el = e.target.closest('.note');
  if (!el) return;
  e.preventDefault();
  const n = notes.find(x => x.id === el.dataset.id);
  if (!n) return;
  const delta = (e.deltaY < 0 ? 0.05 : -0.05);
  n.vel = Math.max(0.05, Math.min(1, (n.vel ?? 0.8) + delta));
  selectNote(n.id);
});
```

---

# 6) Robustnější načítání demo souborů

Na GitHub Pages občas selže caching/manifest; pro jistotu ještě:

* v `populateDemoSelect()` přidej `cache: 'no-store'` (už máš),
* validuj CORS v konzoli (u cizích URL),
* udrž placeholder v selectu (děláš dobře),
* případně dej fallback na pár vestavěných Base64 dem.

---

# 7) Drobné bezpečné defaulty

* Když nejsou žádné noty: `estimateTotalQ()` už řeší minimum 32 — super.
* Při přehrávání: disable/enable tlačítka, aby se nespouštělo víckrát:

```js
btnPlay.disabled = true;
Tone.Transport.scheduleOnce(()=>{ btnPlay.disabled = false; }, endSec);
```

