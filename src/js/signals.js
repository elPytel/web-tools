// WebAudio + vizualizace pro Signály (MVP)
let ctx, osc, gain, shaper, comp, analyser, analyserTD;
let running = false;

const state = {
  wave: 'sine',
  rect: 'none',      // none | half | full
  freq: 440,
  gain: 0.1,
  additive: [],      // [{n, amp}]
  periodic: null
};

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    // uzly
    gain = ctx.createGain();        gain.gain.value = 0.0; // start muted
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;  // safety
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.1;

    shaper = ctx.createWaveShaper();
    setRect(state.rect);

    analyser = ctx.createAnalyser();     // FFT
    analyser.fftSize = 2048;             // 1024 bins
    analyser.smoothingTimeConstant = 0.6;

    analyserTD = ctx.createAnalyser();   // time-domain
    analyserTD.fftSize = 2048;

    // routing (osc → shaper → gain → comp → destination)
    // osc se připojí/odpojí dynamicky
    shaper.connect(gain);
    gain.connect(comp);
    comp.connect(ctx.destination);

    // rozbočení do analyzérů
    gain.connect(analyser);
    gain.connect(analyserTD);
  }
}

// ====== Oscillator / PeriodicWave ======
function rebuildOsc() {
  if (osc) { try { osc.stop(); } catch{}; osc.disconnect(); osc = null; }
  osc = ctx.createOscillator();

  if (state.wave === 'additive' && state.additive.length) {
    // PeriodicWave z harmonických
    const nH = Math.max(...state.additive.map(h => h.n));
    const real = new Float32Array(nH + 1); // cos
    const imag = new Float32Array(nH + 1); // sin
    // harmonické nastavíme do 'imag' (čistě sinusové fáze)
    state.additive.forEach(({n, amp}) => { if (n > 0) imag[n] = amp; });
    const periodic = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    state.periodic = periodic;
    osc.setPeriodicWave(periodic);
  } else {
    osc.type = state.wave; // 'sine' | 'square' | 'triangle' | 'sawtooth'
  }

  osc.frequency.value = state.freq;
  osc.connect(shaper);
  if (running) osc.start();
}

// ====== Public setters ======
export function setWave(w) {
  state.wave = w;
  ensureCtx();
  rebuildOsc();
}
export function setRect(mode) {
  state.rect = mode;
  if (!shaper) ensureCtx();
  // WaveShaper transfer
  if (mode === 'none') {
    shaper.curve = null;
    return;
  }
  const N = 2048;
  const curve = new Float32Array(N);
  for (let i=0;i<N;i++){
    const x = (i / (N-1)) * 2 - 1; // -1..1
    if (mode === 'half') {
      curve[i] = Math.max(0, x); // půlvlnná: propustí kladnou část
    } else {
      curve[i] = Math.abs(x);    // plnovlnná: absolutní hodnota
    }
  }
  shaper.curve = curve;
}
export function setFreq(f) {
  state.freq = Math.max(50, Math.min(20000, f|0));
  if (!ctx) return;
  if (!osc) rebuildOsc();
  try {
    // krátký fade, aby neklapl
    const now = ctx.currentTime;
    const g = gain.gain;
    const v = g.value;
    g.setTargetAtTime(v*0.2, now, 0.01); // jemný útlum
    osc.frequency.setTargetAtTime(state.freq, now, 0.01);
    g.setTargetAtTime(v, now + 0.02, 0.02);
  } catch {}
}
export function setGain(v) {
  state.gain = Math.max(0, Math.min(1, v));
  if (!ctx) return;
  // -6 dBFS soft limit (necháme kompresor dělat bezpečnost)
  gain.gain.setTargetAtTime(state.gain, ctx.currentTime, 0.01);
}
export function setAdditive(arr) {
  state.additive = (arr||[]).filter(h => h && h.n>=1 && h.amp>0);
  if (state.wave === 'additive') {
    ensureCtx();
    rebuildOsc();
  }
}

// ====== Start/Stop ======
export async function start() {
  ensureCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  if (!osc) rebuildOsc();
  try { osc.start(); } catch {}
  running = true;
  // fade in
  gain.gain.cancelScheduledValues(0);
  gain.gain.setTargetAtTime(state.gain, ctx.currentTime, 0.02);
}
export function stop() {
  if (!ctx) return;
  // fade out a stop
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  if (osc) { try { osc.stop(ctx.currentTime + 0.05); } catch{}; }
  running = false;
}

// ====== Vizualizace ======
let viz = { osc: null, fft: null, showOscEl: null, showFFTEl: null, raf: 0 };

export function initViz({ osc, fft, showOsc, showFFT }) {
  viz.osc = osc; viz.fft = fft; viz.showOscEl = showOsc; viz.showFFTEl = showFFT;
  ensureCtx();
  const loop = () => {
    viz.raf = requestAnimationFrame(loop);
    draw();
  };
  loop();
}

function draw() {
  if (!ctx) return;
  if (viz.osc && viz.showOscEl?.checked) drawTime(viz.osc, analyserTD);
  else if (viz.osc) clearCanvas(viz.osc);

  if (viz.fft && viz.showFFTEl?.checked) drawFFT(viz.fft, analyser);
  else if (viz.fft) clearCanvas(viz.fft);
}

function clearCanvas(c) {
  const g = c.getContext('2d'); const {width, height} = c;
  g.clearRect(0,0,width,height);
}

function drawTime(canvas, an) {
  const g = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
  const buf = new Uint8Array(an.frequencyBinCount);
  an.getByteTimeDomainData(buf);

  g.clearRect(0,0,w,h);
  g.lineWidth = 2; g.strokeStyle = '#60a5fa';
  g.beginPath();
  const step = w / buf.length;
  for (let i=0;i<buf.length;i++){
    const v = (buf[i] - 128) / 128; // -1..1
    const y = h*0.5 - v * (h*0.45);
    if (i===0) g.moveTo(0, y); else g.lineTo(i*step, y);
  }
  g.stroke();
}

function drawFFT(canvas, an) {
  const g = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
  const buf = new Uint8Array(an.frequencyBinCount);
  an.getByteFrequencyData(buf);

  g.clearRect(0,0,w,h);
  // logf osa: map bin -> freq -> x
  const sampleRate = ctx.sampleRate;
  const nfft = an.fftSize;
  const minF = 50, maxF = 20000;
  const logK = Math.log(maxF/minF);
  const fToX = f => Math.log(f/minF)/logK; // 0..1

  g.fillStyle = '#f59e0b';
  for (let i=1;i<buf.length;i++){
    const freq = i * sampleRate / nfft;
    if (freq < minF || freq > maxF) continue;
    const x = fToX(freq) * w;
    const v = buf[i] / 255; // 0..1
    const barH = v * (h-8);
    g.fillRect(x, h - barH, 2, barH);
  }
}

export function getState(){ return {...state, running}; }
