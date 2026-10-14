/* SPYR recorded music — looped tracks with soft fades, shared by the rooms.
   Same shape as SPYRMusic (start/stop/set/setMuted/suspend/resume/playing/level/state),
   so a room can swap it in without changing its controls. `pick(opts)` names the track
   for the current scene; when it returns null the optional `fallback` (generated music)
   plays instead. Fades use Web Audio gain so they also work on iPhone, where an
   <audio> element's volume can't be changed. Tracks download only when first needed.
   One room at a time: a player goes quiet whenever its room is closed (its frame is
   hidden), the app is in the background, or another room's music has taken over. */
(function (G) {
  'use strict';
  /* shared across every frame of the app (all rooms are same-origin) */
  function registry() {
    try { const T = G.top; T.__spyrAudio = T.__spyrAudio || { owner: null, list: [] }; return T.__spyrAudio; }
    catch { G.__spyrAudio = G.__spyrAudio || { owner: null, list: [] }; return G.__spyrAudio; }
  }
  function frameShown() {
    try {
      let w = G;
      while (w !== w.parent) {
        const fe = w.frameElement; if (!fe) break;
        if (!fe.getClientRects().length) return false;
        const cs = w.parent.getComputedStyle(fe); if (cs.visibility === 'hidden' || cs.display === 'none') return false;
        w = w.parent;
      }
      return !G.top.document.hidden;
    } catch { return !G.document.hidden; }
  }
  let seq = 0;
  function create(cfg) {
    const tracks = cfg.tracks || {}, pick = cfg.pick || (() => Object.keys(tracks)[0] || null);
    const VOL = cfg.volume == null ? 0.6 : cfg.volume, FADE = cfg.fade || 1.2, fb = cfg.fallback || null;
    let ctx = null, master = null, playing = false, muted = false, held = false, opts = {}, cur = null, usingFb = false;
    const els = {};
    function ensure() {
      if (ctx) return true;
      try {
        const AC = G.AudioContext || G.webkitAudioContext; if (!AC) return false;
        ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
        return true;
      } catch { ctx = null; return false; }
    }
    function node(key) {
      if (els[key]) return els[key];
      const a = new Audio(); a.src = tracks[key]; a.loop = true; a.preload = 'auto'; a.crossOrigin = 'anonymous'; a.setAttribute('playsinline', '');
      let g = null;
      if (ensure()) { try { const s = ctx.createMediaElementSource(a); g = ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(master); } catch { g = null; } }
      els[key] = { a, g };
      return els[key];
    }
    function ramp(e, v, t) {
      if (e.g && ctx) { const now = ctx.currentTime, p = e.g.gain; p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); p.linearRampToValueAtTime(v, now + t); }
      else e.a.volume = Math.max(0, Math.min(1, v));
    }
    function fadeOut(key, t = FADE) {
      const e = els[key]; if (!e) return;
      ramp(e, 0, t); clearTimeout(e.stopT);
      e.stopT = setTimeout(() => { if (cur !== key || !audible()) e.a.pause(); }, t * 1000 + 80);
    }
    const id = ++seq + ':' + Math.random().toString(36).slice(2, 7);
    let away = false;
    const audible = () => playing && !muted && !held && !away;
    const reg = registry();
    const self = { id, wants: () => playing && !muted && !held, shown: frameShown };
    reg.list = reg.list.filter((x) => { try { return x.shown && x.id; } catch { return false; } });
    reg.list.push(self);
    function ownerElsewhere() {
      if (!reg.owner || reg.owner === id) return false;
      const o = reg.list.find((x) => { try { return x.id === reg.owner; } catch { return false; } });
      try { return !!o && o.wants() && o.shown(); } catch { return false; }
    }
    function check() {
      const nowAway = !frameShown() || ownerElsewhere();
      if (nowAway !== away) { away = nowAway; if (playing) apply(); }
    }
    setInterval(check, 500);
    try { G.top.document.addEventListener('visibilitychange', check); } catch { }
    G.document.addEventListener('visibilitychange', check);
    function apply() {
      if (!audible()) { for (const k in els) fadeOut(k, 0.35); if (fb) { try { fb.setMuted(true); } catch { } } return; }
      reg.owner = id;
      const want = pick(opts);
      if (want && tracks[want]) {
        if (usingFb && fb) { try { fb.stop(); } catch { } usingFb = false; }
        if (cur && cur !== want) fadeOut(cur);
        const e = node(want); clearTimeout(e.stopT);
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => { });
        const p = e.a.play(); if (p && p.catch) p.catch(() => { });
        ramp(e, VOL, cur === want ? 0.4 : FADE); cur = want;
      } else {
        if (cur) { fadeOut(cur); cur = null; }
        if (fb) { usingFb = true; try { fb.set(opts); fb.setMuted(false); fb.start(); } catch { } }
      }
    }
    return {
      get playing() { return playing; },
      get state() { return ctx ? ctx.state : 'idle'; },
      level() { return audible() ? VOL : 0; },
      start() { playing = true; held = false; ensure(); away = !frameShown(); if (!away) reg.owner = id; apply(); },
      stop() { playing = false; for (const k in els) fadeOut(k, 0.3); if (fb) { try { fb.stop(); } catch { } } usingFb = false; },
      set(o) { Object.assign(opts, o || {}); if (usingFb && fb) { try { fb.set(o); } catch { } } if (playing) apply(); },
      setMuted(m) { muted = !!m; if (playing) apply(); if (m && fb) { try { fb.setMuted(true); } catch { } } },
      suspend() { if (held) return; held = true; for (const k in els) { const e = els[k]; ramp(e, 0, 0.2); clearTimeout(e.stopT); e.stopT = setTimeout(() => e.a.pause(), 260); } if (fb) { try { fb.suspend(); } catch { } } },
      resume() { if (!held) return; held = false; if (usingFb && fb) { try { fb.resume(); } catch { } } if (playing) apply(); },
      track() { return usingFb ? 'generated' : cur; },
      debug() { const o = {}; for (const k in els) { const e = els[k]; o[k] = { t: +e.a.currentTime.toFixed(2), paused: e.a.paused, gain: e.g ? +e.g.gain.value.toFixed(2) : e.a.volume }; } return o; }
    };
  }
  G.SPYRTracks = { create };
})(typeof window !== 'undefined' ? window : globalThis);
