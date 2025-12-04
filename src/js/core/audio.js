/*
 * Moved from src/js/signals.js — minimal changes (file renamed to audio.js)
 */

let ctx, osc, gain, shaper, comp, analyser, analyserTD;
let running = false;

const state = {
  wave: 'sine',
  rect: 'none',
  freq: 440,
  gain: 0.1,
  additive: [],
  periodic: null,
  fftSize: 2048
};

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();        gain.gain.value = 0.0;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.1;

    shaper = ctx.createWaveShaper();
    setRect(state.rect);

    analyser = ctx.createAnalyser();     
    analyser.fftSize = state.fftSize;    
    analyser.smoothingTimeConstant = 0.6;

    analyserTD = ctx.createAnalyser();   
    analyserTD.fftSize = state.fftSize;

    shaper.connect(gain);
    gain.connect(comp);
    comp.connect(ctx.destination);
    gain.connect(analyser);
    gain.connect(analyserTD);
  }
}

function rebuildOsc() {
  if (osc) { try { osc.stop(); } catch{}; osc.disconnect(); osc = null; }
  osc = ctx.createOscillator();

  if (state.wave === 'additive' && state.additive.length) {
    const nH = Math.max(...state.additive.map(h => h.n));
    const real = new Float32Array(nH + 1);
    const imag = new Float32Array(nH + 1);
    state.additive.forEach(({n, amp}) => { if (n > 0) imag[n] = amp; });
    const periodic = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    state.periodic = periodic;
    osc.setPeriodicWave(periodic);
  } else {
    osc.type = state.wave;
  }

  osc.frequency.value = state.freq;
  osc.connect(shaper);
  if (running) osc.start();
}

export function setWave(w) {
  state.wave = w;
  ensureCtx();
  rebuildOsc();
}

export function setFFTSize(n) {
  const v = Number(n) | 0;
  const allowed = new Set([32,64,128,256,512,1024,2048,4096,8192,16384,32768]);
  if (!allowed.has(v)) return;
  state.fftSize = v;
  if (!ctx) return;
  if (analyser) analyser.fftSize = v;
  if (analyserTD) analyserTD.fftSize = v;
}

export function setRect(mode) {
  state.rect = mode;
  if (!shaper) ensureCtx();
  if (mode === 'none') { shaper.curve = null; return; }
  const N = 2048;
  const curve = new Float32Array(N);
  for (let i=0;i<N;i++){
    const x = (i / (N-1)) * 2 - 1;
    if (mode === 'half') { curve[i] = Math.max(0, x); } else { curve[i] = Math.abs(x); }
  }
  shaper.curve = curve;
}

export function setFreq(f) {
  state.freq = Math.max(50, Math.min(20000, f|0));
  if (!ctx) return;
  if (!osc) rebuildOsc();
  try {
    const now = ctx.currentTime;
    const g = gain.gain;
    g.cancelScheduledValues(now);
    const target = state.gain || 0;
    g.setTargetAtTime(target * 0.2, now, 0.01);
    osc.frequency.setTargetAtTime(state.freq, now, 0.01);
    g.setTargetAtTime(target, now + 0.02, 0.02);
  } catch {}
}

export function setGain(v) {
  state.gain = Math.max(0, Math.min(1, v));
  if (!ctx) return;
  gain.gain.setTargetAtTime(state.gain, ctx.currentTime, 0.01);
}

export function setAdditive(arr) {
  state.additive = (arr||[]).filter(h => h && h.n>=1 && h.amp>0);
  if (state.wave === 'additive') { ensureCtx(); rebuildOsc(); }
}

export async function start() {
  ensureCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  if (!osc) rebuildOsc();
  try { osc.start(); } catch {}
  running = true;
  gain.gain.cancelScheduledValues(0);
  gain.gain.setTargetAtTime(state.gain, ctx.currentTime, 0.02);
}

export function stop() {
  if (!ctx) return;
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  if (osc) { try { osc.stop(ctx.currentTime + 0.05); } catch{}; osc.disconnect(); osc = null; }
  running = false;
}

export function initViz({ osc, fft, showOsc, showFFT }) {
  // placeholder - original had viz logic; keep signature
  ensureCtx();
}

export function getState(){ return {...state, running}; }
