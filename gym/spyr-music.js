/* SPYR placeholder music: generated live with Web Audio, no recordings, no licences.
   Scenes: 'trail' (Pixel Journey, day or night, with weather and campfire), 'calm' (yoga, pilates),
   'drive' (strength and HIIT), 'cardio' (running, cycling). Swap in real tracks later. */
(function (G) {
  'use strict';
  const PENTA = [0, 2, 4, 7, 9];                                   // major pentatonic
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const PROG = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]];   // D, Bm, G, A

  function create() {
    let ctx = null, master, musicBus, natureBus, echo, analyser, noiseBuf, timer = null, nature = {}, on = false, muted = false;
    const scene = { mode: 'trail', night: false, weather: 'clear', camp: false, intensity: 1 };
    let nextBeat = 0, beat = 0, bar = 0;

    function init() {
      if (ctx) return;
      ctx = new (G.AudioContext || G.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
      analyser = ctx.createAnalyser(); analyser.fftSize = 512;
      master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = .8; musicBus.connect(master);
      natureBus = ctx.createGain(); natureBus.gain.value = .9; natureBus.connect(master);
      echo = ctx.createDelay(1.2); echo.delayTime.value = .42; const fb = ctx.createGain(); fb.gain.value = .32; const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 2400;
      echo.connect(ef); ef.connect(fb); fb.connect(echo); ef.connect(musicBus);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const noise = () => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; };

    /* ---- instruments ---- */
    function pad(notes, t, dur, vol) {
      for (const n of notes) for (const det of [-6, 5]) {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = midi(n - 12); o.detune.value = det;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .35); g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + .1);
      }
    }
    function pluck(n, t, vol, wet = true) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = midi(n);
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = midi(n) * 2;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + 1.6);
      const g2 = ctx.createGain(); g2.gain.value = .25;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(musicBus); if (wet) g.connect(echo);
      o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7);
    }
    function bass(n, t, dur, vol) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = midi(n - 24);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + .05);
    }
    function kick(t, vol) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .22);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + .32);
    }
    function hit(t, vol, freq, q, dur) {
      const s = noise(); const f = ctx.createBiquadFilter(); f.type = freq > 5000 ? 'highpass' : 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(f); f.connect(g); g.connect(musicBus); s.start(t, Math.random()); s.stop(t + dur + .02);
    }

    /* ---- nature ---- */
    function bed(name, freq, type, vol, q = .7) {
      if (nature[name]) return nature[name];
      const s = noise(); const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(natureBus); s.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = rnd(.05, .12); const lg = ctx.createGain(); lg.gain.value = freq * .25; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      return (nature[name] = { g, vol });
    }
    function level(name, v) { const b = nature[name]; if (b) b.g.gain.setTargetAtTime(v, ctx.currentTime, 1.2); }
    function chirp(t) {
      const reps = Math.floor(rnd(2, 5)), base = rnd(2600, 3800);
      for (let i = 0; i < reps; i++) {
        const o = ctx.createOscillator(); o.type = 'sine'; const s = t + i * rnd(.09, .16);
        o.frequency.setValueAtTime(base, s); o.frequency.exponentialRampToValueAtTime(base * rnd(1.2, 1.5), s + .07);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.05, s + .015); g.gain.exponentialRampToValueAtTime(.001, s + .09);
        const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p) p.pan.value = rnd(-.8, .8);
        o.connect(g); (p ? (g.connect(p), p) : g).connect(natureBus); o.start(s); o.stop(s + .1);
      }
    }
    function cricket(t) {
      for (let i = 0; i < 3; i++) { const s = t + i * .06; const o = ctx.createOscillator(); o.frequency.value = 4600; const g = ctx.createGain(); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.018, s + .01); g.gain.linearRampToValueAtTime(0, s + .04); o.connect(g); g.connect(natureBus); o.start(s); o.stop(s + .05); }
    }
    function crackle(t) { hit(t, rnd(.05, .14), rnd(1800, 3500), 1.2, rnd(.01, .03)); }

    /* ---- scheduler ---- */
    const TEMPO = { trail: 66, calm: 56, drive: 104, cardio: 122 };
    let nextBird = 0, nextCricket = 0, nextCrackle = 0;
    function tick() {
      if (!ctx || !on) return;
      const now = ctx.currentTime, spb = 60 / TEMPO[scene.mode] / 2;      // eighth notes
      while (nextBeat < now + .3) {
        const t = nextBeat, chord = PROG[bar % 4], step = beat % 8, m = scene.mode, calmish = m === 'trail' || m === 'calm';
        if (step === 0) pad(chord, t, spb * 8.2, calmish ? (scene.night ? .05 : .065) : .018);
        if (calmish) {
          const p = m === 'calm' ? .38 : scene.night ? .22 : .34;
          if (Math.random() < p && step % 2 === 0) { const oct = pick([12, 12, 24]); pluck(chord[0] - 2 + PENTA[Math.floor(Math.random() * 5)] + oct - 12, t + rnd(0, .02), m === 'calm' ? .11 : .13); }
        } else {
          const drive = m === 'drive', v = scene.intensity;
          if (step === 0 || step === 4 || (!drive && step % 2 === 0)) kick(t, .5 * v);
          if (step === 2 || step === 6) hit(t, .16 * v, 1700, .9, .16);
          hit(t, (step % 2 ? .05 : .08) * v, 8000, .5, .045);
          if (step % 2 === 0) bass(chord[0], t, spb * 1.8, .22 * v);
          if (!drive && step % 2 === 1) pluck(chord[step % 3] + 12, t, .035 * v, false);
          if (drive && step === 7 && Math.random() < .5) pluck(chord[2] + 12, t, .04 * v);
        }
        beat++; if (beat % 8 === 0) bar++; nextBeat += spb;
      }
      if (scene.mode === 'trail') {
        const wet = scene.weather === 'rain' || scene.weather === 'storm';
        if (!scene.night && !wet && now > nextBird) { chirp(now + .05); nextBird = now + rnd(3, 9); }
        if (scene.night && !wet && now > nextCricket) { cricket(now + .05); nextCricket = now + rnd(.4, 1.4); }
        if (scene.camp && now > nextCrackle) { crackle(now + .02); nextCrackle = now + rnd(.08, .6); }
      }
    }
    function applyNature() {
      if (!ctx) return;
      const trail = scene.mode === 'trail', w = scene.weather;
      bed('wind', 520, 'bandpass', 0); bed('rain', 2600, 'lowpass', 0); bed('fire', 900, 'lowpass', 0);
      level('wind', trail ? (w === 'storm' ? .2 : w === 'snow' ? .14 : .1) : 0);
      level('rain', trail && (w === 'rain' || w === 'storm') ? (w === 'storm' ? .2 : .13) : 0);
      level('fire', trail && scene.camp ? .025 : 0);
    }

    return {
      start() {
        init(); if (ctx.state === 'suspended') ctx.resume(); if (on) return; on = true;
        nextBeat = ctx.currentTime + .1; applyNature();
        master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(muted ? 0 : .5, ctx.currentTime, .8);
        timer = setInterval(tick, 60);
      },
      stop(fade = .6) {
        if (!ctx || !on) return; on = false; clearInterval(timer);
        master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
        for (const k of Object.keys(nature)) level(k, 0);
      },
      suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
      resume() { if (ctx && on && ctx.state === 'suspended') ctx.resume(); },
      set(opts) { Object.assign(scene, opts); if (on) applyNature(); if (ctx && on) musicBus.gain.setTargetAtTime(scene.intensity >= 1 ? .8 : .5, ctx.currentTime, .6); },
      setMuted(m) { muted = !!m; if (ctx && on) master.gain.setTargetAtTime(muted ? 0 : .5, ctx.currentTime, .3); },
      get muted() { return muted; }, get state() { return ctx ? ctx.state : 'none'; }, get playing() { return on; },
      level() { if (!analyser) return 0; const a = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(a); let s = 0; for (const v of a) s += v * v; return Math.sqrt(s / a.length); },
    };
  }
  G.SPYRMusic = { create };
})(typeof window !== 'undefined' ? window : globalThis);
