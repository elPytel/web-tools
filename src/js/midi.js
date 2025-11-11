export function midiToFreq(n) {
  // Standardní převod MIDI note -> frekvence (A4 = MIDI 69 = 440 Hz)
  return 440 * Math.pow(2, (n - 69) / 12);
}

export function midiNoteName(n) {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const name = names[n % 12];
  const oct = Math.floor(n / 12) - 1;
  return name + oct;
}

export function pctToDb(p){
  const v = Math.max(0.001, p/100);
  return 20 * Math.log10(v);
}

export class MidiPlayer {
  constructor(){
    this.midi = null;
    this.part = null;
    this.synth = null;
    this.master = null;
    this.events = [];
    this.songLengthSec = 0;
    this._pendingVol = null;
  }

  async ensureAudio(volPct = 80){
    await Tone.start();
    if (!this.master){
      this.master = new Tone.Volume(pctToDb(volPct)).toDestination();
    }
    if (!this.synth){
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0.2, release: 0.3 }
      }).connect(this.master);
    }
    if (this._pendingVol != null){
      this.setVolume(this._pendingVol);
      this._pendingVol = null;
    }
  }

  setVolume(pct){
    if (this.master) this.master.volume.value = pctToDb(pct);
    else this._pendingVol = pct;
  }

  async loadArrayBuffer(buf){
    // robustní parse (ArrayBuffer -> Uint8Array fallback)
    try {
      try { this.midi = new Midi(buf); } catch { this.midi = new Midi(new Uint8Array(buf)); }
    } catch (e){
      throw new Error('parse-failed');
    }

    // tempo (vezmeme první, pokud existuje)
    const tempoEv = this.midi.header.tempos?.[0];
    if (tempoEv?.bpm) Tone.Transport.bpm.value = tempoEv.bpm;

    // vyrob playlist událostí napříč všemi stopami (jen noty)
    const events = [];
    this.midi.tracks.forEach((t, ti)=>{
      (t.notes || []).forEach(n=>{
        events.push({ time: n.time, duration: n.duration, midi: n.midi, vel: n.velocity ?? 0.8, track: ti });
      });
    });
    events.sort((a,b)=>a.time - b.time);
    this.events = events;
    this.songLengthSec = events.length ? Math.max(0, ...events.map(e => e.time + e.duration)) : 0;

    // připrav Part (nezahajovat)
    this.preparePart();

    // naplánovat stop na konci skladby (zrušíme staré)
    Tone.Transport.cancel();
    if (this.songLengthSec > 0) {
      Tone.Transport.scheduleOnce(()=>{
        Tone.Transport.stop();
      }, this.songLengthSec + 0.05);
    }

    return {
      tempo: tempoEv?.bpm ?? null,
      tracks: this.midi.tracks.length,
      trackInfo: this.midi.tracks.filter(t=>t.notes && t.notes.length).map((t,i)=>`${i+1}. ${t.name||'Track'} (not: ${t.notes.length})`).join(' | '),
      lengthSec: this.songLengthSec
    };
  }

  preparePart(){
    if (this.part){ this.part.dispose(); this.part = null; }
    if (!this.events || !this.events.length) return;
    this.part = new Tone.Part((time, ev)=>{
      try {
        if (!this.synth) {
          console.warn('[MidiPlayer] synth not ready, skipping note', ev);
          return;
        }
        const freq = midiToFreq(ev.midi);
        this.synth.triggerAttackRelease(freq, ev.duration, time, ev.vel);
      } catch (err) {
        console.error('[MidiPlayer] Part callback error', err);
      }
    }, this.events.map(e => [e.time, e]));
    // do not start part here
  }

  start(){
    if (!this.part) return;
    try { this.part.start(0); } catch(e){ /* ignore double-start */ }
    Tone.Transport.position = 0;
    Tone.Transport.start();
  }

  stop(){
    try { Tone.Transport.stop(); } catch(e){ }
    try { if (this.part) this.part.stop(); } catch(e) {}
  }
}