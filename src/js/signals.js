/**
 * Module for simple WebAudio signal generation and visualization (MVP).
 * Exports setters to configure oscillator, envelope and visualization,
 * plus start/stop controls and a getState helper.
 */

let ctx, osc, gain, shaper, comp, analyser, analyserTD;
let running = false;

const state = {
  wave: 'sine',
  rect: 'none',      // none | half | full
  freq: 440,
  gain: 0.1,
  additive: [],      // [{n, amp}]
  periodic: null,
  fftSize: 2048
};

/**
 * Ensure AudioContext and basic nodes exist.
 * (Internal helper)
 */
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
  analyser.fftSize = state.fftSize;    // fft bins = fftSize/2
    analyser.smoothingTimeConstant = 0.6;

    analyserTD = ctx.createAnalyser();   // time-domain
  analyserTD.fftSize = state.fftSize;

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

/**
 * Rebuild oscillator node according to current state (internal).
 */
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

/**
 * Set oscillator waveform or use additive harmonics.
 * @param {string} w - 'sine'|'square'|'triangle'|'sawtooth'|'additive'
 */
export function setWave(w) {
  state.wave = w;
  ensureCtx();
  rebuildOsc();
}

/**
 * Set FFT size for analyser nodes. Must be power of two 32..32768.
 * @param {number} n - FFT size.
 */
export function setFFTSize(n) {
  const v = Number(n) | 0;
  const allowed = new Set([32,64,128,256,512,1024,2048,4096,8192,16384,32768]);
  if (!allowed.has(v)) return;
  state.fftSize = v;
  if (!ctx) return;
  if (analyser) analyser.fftSize = v;
  if (analyserTD) analyserTD.fftSize = v;
}

/**
 * Set rectification mode applied via WaveShaper.
 * @param {'none'|'half'|'full'} mode - Rectification mode.
 */
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

/**
 * Set oscillator frequency (clamped to audible range) with a short fade.
 * @param {number} f - Frequency in Hz.
 */
export function setFreq(f) {
  state.freq = Math.max(50, Math.min(20000, f|0));
  if (!ctx) return;
  if (!osc) rebuildOsc();
  try {
    // krátký fade, aby neklapl
    const now = ctx.currentTime;
    const g = gain.gain;
    // Use the desired steady-state gain (state.gain) instead of reading g.value
    // Reading g.value while there are scheduled ramps can return an intermediate
    // value; if setFreq is called repeatedly this caused multiplicative
    // attenuation. Cancel pending scheduled values and schedule a short dip
    // to avoid clicks, then restore the steady-state gain.
    g.cancelScheduledValues(now);
    const target = state.gain || 0;
    g.setTargetAtTime(target * 0.2, now, 0.01); // jemný útlum
    osc.frequency.setTargetAtTime(state.freq, now, 0.01);
    g.setTargetAtTime(target, now + 0.02, 0.02);
  } catch {}
}

/**
 * Set output gain (0..1).
 * @param {number} v - Linear gain value.
 */
export function setGain(v) {
  state.gain = Math.max(0, Math.min(1, v));
  if (!ctx) return;
  // -6 dBFS soft limit (necháme kompresor dělat bezpečnost)
  gain.gain.setTargetAtTime(state.gain, ctx.currentTime, 0.01);
}

/**
 * Define additive harmonics for PeriodicWave.
 * @param {Array<{n:number,amp:number}>} arr - Harmonic descriptors.
 */
export function setAdditive(arr) {
  state.additive = (arr||[]).filter(h => h && h.n>=1 && h.amp>0);
  if (state.wave === 'additive') {
    ensureCtx();
    rebuildOsc();
  }
}

/**
 * Start audio generation (resumes context and fades in).
 * @returns {Promise<void>}
 */
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

/**
 * Stop audio generation (fade out and stop oscillator).
 */
export function stop() {
  if (!ctx) return;
  // fade out a stop
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  if (osc) { try { osc.stop(ctx.currentTime + 0.05); } catch{}; osc.disconnect(); osc = null; }
  running = false;
}

/**
 * Initialize visualization canvases and start RAF loop.
 * @param {{osc:HTMLCanvasElement|null, fft:HTMLCanvasElement|null, showOsc:HTMLElement|null, showFFT:HTMLElement|null}} opts
 */
export function initViz({ osc, fft, showOsc, showFFT }) {
  viz.osc = osc; viz.fft = fft; viz.showOscEl = showOsc; viz.showFFTEl = showFFT;
  ensureCtx();
  const loop = () => {
    viz.raf = requestAnimationFrame(loop);
    draw();
  };
  loop();
}

/**
 * Get current public state snapshot.
 * @returns {Object} Shallow copy of internal state with running flag.
 */
export function getState(){ return {...state, running}; }
