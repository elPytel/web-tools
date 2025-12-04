// Morse code page module (moved from inline script in Morse_code.html)
// Provides: text<->morse conversion, playback (WebAudio), and WAV export

// --- Normalizace češtiny (diakritika) ---
function normalizeCzech(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ů/g, 'u')
    .replace(/ẞ/g, 'SS')
    .replace(/ß/g, 'ss');
}

import { pctToDb } from '../midi.js';

const MORSE = {
  A: ".-",    B: "-...",  C: "-.-.",  D: "-..",   E: ".",
  F: "..-.",  G: "--.",   H: "....",  I: "..",    J: ".---",
  K: "-.-",   L: ".-..",  M: "--",    N: "-.",    O: "---",
  P: ".--.",  Q: "--.-",  R: ".-.",   S: "...",   T: "-",
  U: "..-",   V: "...-",  W: ".--",   X: "-..-",  Y: "-.--",
  Z: "--..",
  "CH": "----",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "!": "-.-.--", "/": "-..-.",  "(": "-.--.",  ")": "-.--.-",
  "&": ".-...",  ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.",  "-": "-....-", "_": "..--.-", '"': ".-..-.",
  "$": "...-..-", "@": ".--.-."
};

const REVERSE = {};
for (const [k, v] of Object.entries(MORSE)) REVERSE[v] = k;

function splitWithCH(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (i + 1 < s.length && s[i] === 'C' && s[i+1] === 'H') {
      out.push('CH'); i += 2;
    } else { out.push(s[i]); i++; }
  }
  return out;
}

function textToMorse(input) {
  const norm = normalizeCzech(input).toUpperCase();
  const words = norm.split(/\s+/).filter(Boolean);
  const encodedWords = words.map(w => {
    const letters = splitWithCH(w);
    return letters.map(ch => {
      if (MORSE[ch]) return MORSE[ch];
      if (/^[A-Z0-9]$/.test(ch)) return MORSE[ch] || '?';
      return MORSE[ch] || '';
    }).filter(Boolean).join(' ');
  });
  return encodedWords.join(' / ');
}

function morseToText(input) {
  const words = input.trim().split(/\s*\/\s*/);
  const decodedWords = words.map(w => {
    const letters = w.trim().split(/\s+/).filter(Boolean);
    const chars = letters.map(code => REVERSE[code] || '?');
    return chars.join('');
  });
  return decodedWords.join(' ').replace(/\bCH\b/g, 'CH');
}

// --- Audio ---
let audioCtx = null; let stopFlag = false;
let masterGain = null; // global gain node for page-level volume control (0..1)
let _pendingVolumePct = null;
function dotMsFromWPM(wpm) { return 1200 / Math.max(1, wpm); }

async function playMorse(morse, wpm=18, freq=650) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    try {
      masterGain = audioCtx.createGain();
      // default to 80% if not set yet; convert percent->dB->linear using pctToDb
      const initialPct = (_pendingVolumePct != null) ? _pendingVolumePct : 80;
      const db0 = pctToDb(initialPct);
      const linear0 = Math.pow(10, db0 / 20);
      masterGain.gain.value = linear0;
      masterGain.connect(audioCtx.destination);
      _pendingVolumePct = null;
    } catch(e) { masterGain = null; }
  }
  stopFlag = false;
  const unit = dotMsFromWPM(wpm);
  const tone = (durMs) => new Promise(res => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    if (masterGain) osc.connect(gain).connect(masterGain);
    else osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.005);
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime + (durMs/1000 - 0.01));
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + (durMs/1000));
    setTimeout(() => { osc.stop(); res(); }, durMs);
  });
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < morse.length && !stopFlag; i++) {
    const ch = morse[i];
    if (ch === '.') { await tone(unit); await sleep(unit); }
    else if (ch === '-') { await tone(3*unit); await sleep(unit); }
    else if (ch === ' ') { await sleep(2*unit); }
    else if (ch === '/') { await sleep(6*unit); }
  }
}

function stopAudio() { stopFlag = true; }

// Set page-level volume in percent (0-100). Applies immediately if audio initialized,
// otherwise stored and applied when audio context is created.
export function setVolumePercent(pct) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  // Use project's pctToDb helper so mapping matches the MIDI player (returns dB).
  const db = pctToDb(p);
  const linear = Math.pow(10, db / 20);

  if (masterGain && audioCtx) {
    try { masterGain.gain.setValueAtTime(linear, audioCtx.currentTime); } catch(e) { masterGain.gain.value = linear; }
  } else {
    _pendingVolumePct = p;
  }

  // update on-page label if present
  try {
    const lbl = document.getElementById('volLabel');
    if (lbl) lbl.textContent = p + '%';
  } catch (e) {}

  // expose last value on window for non-module callers
  try { window.__morse_volume_pct = p; } catch(e){}
}

// Ease of use for inline scripts: attach to window
try { window.setMorseVolume = setVolumePercent; } catch(e) {}

function renderMorseToWav(morse, wpm=18, freq=650, sampleRate=44100) {
  const unitMs = dotMsFromWPM(wpm);
  const unitSamples = Math.round(sampleRate * unitMs / 1000);
  const twoPi = Math.PI * 2;
  const samples = [];
  const appendSilence = (samplesCount) => { for (let i=0;i<samplesCount;i++) samples.push(0); };
  const appendTone = (samplesCount) => {
    const fadeSamples = Math.min(Math.round(sampleRate*0.005), Math.floor(samplesCount/4));
    for (let i=0;i<samplesCount;i++) {
      const phase = (i / sampleRate) * freq * twoPi;
      let amp = Math.sin(phase);
      if (i < fadeSamples) amp *= (i / fadeSamples);
      else if (i > samplesCount - fadeSamples) amp *= ((samplesCount - i) / fadeSamples);
      samples.push(amp * 0.6);
    }
  };
  for (let i = 0; i < morse.length; i++) {
    const ch = morse[i];
    if (ch === '.') { appendTone(unitSamples); appendSilence(unitSamples); }
    else if (ch === '-') { appendTone(3*unitSamples); appendSilence(unitSamples); }
    else if (ch === ' ') { appendSilence(2*unitSamples); }
    else if (ch === '/') { appendSilence(6*unitSamples); }
  }
  const numChannels = 1; const bufferLength = samples.length; const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample; const byteRate = sampleRate * blockAlign;
  const dataSize = bufferLength * bytesPerSample; const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let offset = 0;
  function writeString(s) { for (let i=0;i<s.length;i++) view.setUint8(offset++, s.charCodeAt(i)); }
  function writeUint32(v) { view.setUint32(offset, v, true); offset += 4; }
  function writeUint16(v) { view.setUint16(offset, v, true); offset += 2; }
  writeString('RIFF'); writeUint32(36 + dataSize); writeString('WAVE'); writeString('fmt ');
  writeUint32(16); writeUint16(1); writeUint16(numChannels); writeUint32(sampleRate);
  writeUint32(byteRate); writeUint16(blockAlign); writeUint16(16); writeString('data'); writeUint32(dataSize);
  for (let i = 0; i < bufferLength; i++) { let s = samples[i]; if (s>1) s=1; else if (s<-1) s=-1; view.setInt16(offset, Math.round(s*32767), true); offset +=2; }
  return new Blob([view], { type: 'audio/wav' });
}

// --- UI binding (exported as default initializer) ---
export default function initMorsePage() {
  const textInput = document.getElementById('textInput');
  const morseOutput = document.getElementById('morseOutput');
  const morseInput = document.getElementById('morseInput');
  const textOutput = document.getElementById('textOutput');
  const toMorseBtn = document.getElementById('toMorseBtn');
  const toTextBtn = document.getElementById('toTextBtn');
  const copyMorseBtn = document.getElementById('copyMorseBtn');
  const copyTextBtn = document.getElementById('copyTextBtn');
  const clearTextBtn = document.getElementById('clearTextBtn');
  const clearMorseBtn = document.getElementById('clearMorseBtn');
  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');
  const wpmEl = document.getElementById('wpm');
  const freqEl = document.getElementById('freq');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!textInput) return; // bail when page structure not present

  toMorseBtn.addEventListener('click', () => { morseOutput.value = textToMorse(textInput.value); });
  toTextBtn.addEventListener('click', () => { textOutput.value = morseToText(morseInput.value); });
  copyMorseBtn.addEventListener('click', async () => { await navigator.clipboard.writeText(morseOutput.value || ''); });
  copyTextBtn.addEventListener('click', async () => { await navigator.clipboard.writeText(textOutput.value || ''); });
  clearTextBtn.addEventListener('click', () => { textInput.value = ''; morseOutput.value=''; });
  clearMorseBtn.addEventListener('click', () => { morseInput.value = ''; textOutput.value=''; });

  playBtn.addEventListener('click', async () => {
    const morse = morseOutput.value || textToMorse(textInput.value);
    if (!morse) return;
    stopFlag = false;
    playBtn.disabled = true; stopBtn.disabled = false;
    try { await playMorse(morse, Number(wpmEl.value||18), Number(freqEl.value||650)); }
    finally { playBtn.disabled = false; stopBtn.disabled = true; }
  });
  stopBtn.addEventListener('click', () => stopAudio());

  // live conversion
  textInput.addEventListener('input', () => { morseOutput.value = textToMorse(textInput.value); });
  morseInput.addEventListener('input', () => { textOutput.value = morseToText(morseInput.value); });

  // download WAV
  downloadBtn.addEventListener('click', () => {
    const morse = morseOutput.value || textToMorse(textInput.value);
    if (!morse) return alert('Není nic k exportu. Nejprve vygenerujte Morse kód.');
    downloadBtn.disabled = true;
    try {
      const blob = renderMorseToWav(morse, Number(wpmEl.value||18), Number(freqEl.value||650));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'morse.wav'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } finally { downloadBtn.disabled = false; }
  });

  // fill legend
  const entries = Object.entries(MORSE).filter(([k,_]) => k.length === 1 || k === 'CH');
  const half = Math.ceil(entries.length / 2);
  function fillLegend(tbodyId, arr) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = arr.map(([k,v]) => `<tr><td><b>${k}</b></td><td><code>${v}</code></td></tr>`).join('');
  }
  fillLegend('legendA', entries.slice(0, half));
  fillLegend('legendB', entries.slice(half));
}

// Auto-init when module is loaded in a page (module script at end of body)
document.addEventListener('DOMContentLoaded', () => {
  try { initMorsePage(); } catch (e) { /* ignore */ }
});
