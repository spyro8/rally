/* SPYR side tabs — v52.24
   Two vertical tabs on the Home screen (SPYR GYM, VILLAGE). Each opens a full-screen
   same-origin iframe. The village saves per SPYR profile with a rolling backup and
   receives real habit completions read through SPYR's own KV store (./config.json). */
(() => {
  'use strict';
  const doc = document;
  const GYM_URL = './gym/index.html';
  const VILLAGE_URL = './village/index.html?embedded=1';
  const GYM_STORE = 'spyr:gym:completions';

  /* ---------- styles ---------- */
  const css = doc.createElement('style');
  css.textContent = `
  .spyr-side{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9000;display:flex;flex-direction:column;gap:10px;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .2s}
  .spyr-side[hidden]{display:none}
  .spyr-side.away{transform:translateY(-50%) translateX(110%);opacity:0;pointer-events:none}
  .spyr-side button{writing-mode:vertical-rl;text-orientation:mixed;display:inline-flex;align-items:center;gap:10px;
    padding:16px 10px 16px 11px;border-radius:12px 0 0 12px;border:1px solid rgba(243,236,225,.28);border-right:0;
    color:#F3ECE1;box-shadow:-4px 0 18px rgba(0,0,0,.22);cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;
    font:600 12px/1 'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.16em;text-transform:uppercase}
  .spyr-side button.gym{background:#2E6B3F}.spyr-side button.gym:active{background:#255834}
  .spyr-side button.village{background:#2A5445}.spyr-side button.village:active{background:#1F4033}
  .spyr-side .dot{width:6px;height:6px;border-radius:50%;background:#dcefa3;box-shadow:0 0 8px #dcefa3}
  .spyr-ov{position:fixed;inset:0;z-index:9500;display:none;background:#101b18}
  .spyr-ov.open{display:block}
  .spyr-ov iframe{width:100%;height:100%;border:0;display:block;background:inherit}
  @supports (height:100dvh){.spyr-ov{height:100dvh}}
  .spyr-ov .spyr-close{position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;z-index:2;appearance:none;border:1px solid rgba(243,236,225,.3);
    background:rgba(16,27,24,.82);color:#F3ECE1;font:700 12px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:.06em;padding:9px 12px;border-radius:99px;cursor:pointer;backdrop-filter:blur(6px)}
  .spyr-ov.gym .spyr-close{display:none}
  body.spyr-ov-open{overflow:hidden}
  `;
  doc.head.appendChild(css);

  /* ---------- side tabs ---------- */
  const side = doc.createElement('div');
  side.className = 'spyr-side';
  side.hidden = true;
  side.innerHTML =
    '<button type="button" class="gym" aria-label="Open SPYR GYM"><span class="dot"></span><span>SPYR GYM</span></button>';
  doc.body.append(side);

  /* ---------- overlays ---------- */
  function makeOverlay(kind, title) {
    const ov = doc.createElement('div');
    ov.className = 'spyr-ov ' + kind;
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-label', title);
    const close = doc.createElement('button');
    close.type = 'button'; close.className = 'spyr-close'; close.textContent = '← SPYR';
    const frame = doc.createElement('iframe');
    frame.title = title; frame.allow = 'fullscreen; autoplay';
    ov.append(close, frame);
    doc.body.append(ov);
    return { ov, frame, close };
  }
  const gym = makeOverlay('gym', 'SPYR GYM');
  const village = makeOverlay('village', 'Your village');

  let current = null;
  const meta = doc.querySelector('meta[name="theme-color"]');
  function openOverlay(o, url, theme) {
    if (current) return;
    current = o;
    if (o.frame.getAttribute('src') !== url) o.frame.src = url;
    o.ov.classList.add('open');
    doc.body.classList.add('spyr-ov-open');
    side.classList.add('away');
    if (meta) { meta.dataset.prev = meta.content; meta.content = theme; }
  }
  function closeOverlay(keepFrame) {
    if (!current) return;
    const o = current; current = null;
    o.ov.classList.remove('open');
    doc.body.classList.remove('spyr-ov-open');
    side.classList.remove('away');
    if (meta && meta.dataset.prev) meta.content = meta.dataset.prev;
    if (!keepFrame) o.frame.removeAttribute('src');
  }
  side.querySelector('.gym').addEventListener('click', () => openOverlay(gym, GYM_URL, '#101b18'));
  gym.close.addEventListener('click', () => closeOverlay(false));
  village.close.addEventListener('click', () => closeOverlay(true)); // village stays mounted; saves are cheap, reloads are not
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && current) closeOverlay(current === village); });

  /* ---------- show tabs only on Home ---------- */
  function onHome() {
    const on = doc.querySelector('nav.rnav button.on');
    return !!on && /home/i.test(on.textContent || '');
  }
  const mo = new MutationObserver(() => { side.hidden = !onHome(); });
  mo.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  side.hidden = !onHome();

  /* ---------- SPYR identity + KV (same path the app uses) ---------- */
  function profileId() {
    try { return (JSON.parse(localStorage.getItem('rt1:me') || 'null') || {}).id || null; } catch { return null; }
  }
  let cfg = null;
  async function kv() {
    if (cfg) return cfg;
    const c = await fetch('./config.json', { cache: 'no-store' }).then(r => r.json());
    if (!c.url || !c.key) throw new Error('config not set');
    cfg = {
      rest: `${c.url.replace(/\/+$/, '').replace(/\/rest\/v1$/, '')}/rest/v1/kv`,
      headers: { apikey: c.key, Authorization: `Bearer ${c.key}`, 'Content-Type': 'application/json' }
    };
    return cfg;
  }
  async function kvGet(key) {
    const k = await kv();
    const r = await fetch(`${k.rest}?select=value&key=eq.${encodeURIComponent(key)}`, { headers: k.headers });
    if (!r.ok) throw new Error('kv read failed');
    const rows = await r.json();
    return rows.length ? rows[0].value : null;
  }
  async function kvSet(key, value) {
    const k = await kv();
    const r = await fetch(k.rest, { method: 'POST', headers: { ...k.headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) });
    if (!r.ok) throw new Error('kv write failed');
  }

  /* ---------- village persistence (local first, KV mirror) ---------- */
  const vKey = pid => `spyr:village:${pid}`;
  const vBak = pid => `spyr:village:${pid}:backup`;
  function localLoad(pid) { try { return JSON.parse(localStorage.getItem(vKey(pid)) || 'null'); } catch { return null; } }
  function localSave(pid, snap) {
    try {
      const prev = localStorage.getItem(vKey(pid));
      if (prev) localStorage.setItem(vBak(pid), prev); // one-step rolling backup
      localStorage.setItem(vKey(pid), JSON.stringify(snap));
      return true;
    } catch { return false; }
  }
  async function villageLoad(pid) {
    const local = localLoad(pid);
    let remote = null;
    try { remote = await kvGet(vKey(pid)); } catch {}
    // Newest wins by the village's own event count, then by save time.
    const score = s => s ? [(s.events || []).length, Date.parse(s.savedAt || 0) || 0] : [-1, -1];
    const [a, b] = [score(local), score(remote)];
    return (b[0] > a[0] || (b[0] === a[0] && b[1] > a[1])) ? remote : local;
  }
  let saveChain = Promise.resolve();
  function villageSave(pid, snap) {
    snap.savedAt = new Date().toISOString();
    const ok = localSave(pid, snap);
    saveChain = saveChain.then(() => kvSet(vKey(pid), snap)).then(
      () => api()?.setSaveStatus?.('saved'),
      () => api()?.setSaveStatus?.(ok ? 'saved' : 'error')); // local save still counts; mirror retries next change
    return saveChain;
  }
  const api = () => village.frame.contentWindow && village.frame.contentWindow.SPYRVillage;

  /* ---------- habit bridge: completed habits → village ---------- */
  // A completion is a (profile, date, habit) that has a real log value. IDs are stable, so re-syncs never double count.
  const HABITS = ['steps', 'water', 'sleep', 'workout', 'meditation', 'reading', 'journal', 'fasting', 'focus', 'calories', 'meals'];
  function done(h, r) {
    if (!r) return false;
    switch (h) {
      case 'sleep': return (Number(r.sleep) || 0) >= 7;
      case 'journal': return !!r.journal;
      case 'fasting': return !!r.fasting;
      case 'meals': return Array.isArray(r.meals) && r.meals.length > 0;
      case 'workout': return (Number(r.workoutMin) || 0) > 0 || !!r.workout || (Array.isArray(r.workouts) && r.workouts.length > 0);
      default: return (Number(r[h]) || 0) > 0;
    }
  }
  const seenKey = pid => `spyr:village:${pid}:seen`;
  async function syncHabits(pid) {
    const a = api(); if (!a || !pid) return 0;
    let profile = null;
    try { profile = await kvGet(`rt1:p:${pid}`); } catch { return 0; }
    const logs = (profile && profile.logs) || {};
    let seen; try { seen = new Set(JSON.parse(localStorage.getItem(seenKey(pid)) || '[]')); } catch { seen = new Set(); }
    let added = 0;
    const dates = Object.keys(logs).sort().slice(-60); // last two months is plenty; the village dedups by id anyway
    for (const date of dates) for (const h of HABITS) {
      if (!done(h, logs[date])) continue;
      const id = `${pid}:${date}:${h}`;
      if (seen.has(id)) continue;
      try { a.recordHabitCompletion({ id, habit: h, date, at: `${date}T12:00:00.000Z` }); seen.add(id); added++; } catch {}
    }
    // Gym sessions completed inside SPYR GYM count as workouts too.
    try {
      for (const g of JSON.parse(localStorage.getItem(GYM_STORE) || '[]')) {
        const date = (g.date || '').slice(0, 10); const id = `${pid}:${date}:gym:${g.logId}`;
        if (!date || seen.has(id)) continue;
        a.recordHabitCompletion({ id, habit: 'workout', date, at: g.date }); seen.add(id); added++;
      }
    } catch {}
    try { localStorage.setItem(seenKey(pid), JSON.stringify([...seen].slice(-5000))); } catch {}
    return added;
  }

  /* ---------- village open ---------- */
  let villageReady = false, syncTimer = null;
  async function openVillage() {
    const pid = profileId();
    openOverlay(village, VILLAGE_URL, '#152f2b');
    if (villageReady) { syncHabits(pid); return; }
    await new Promise(res => { village.frame.addEventListener('load', res, { once: true }); });
    const a = api(); if (!a) return;
    const saved = await villageLoad(pid);
    if (saved) { try { a.loadState(saved); } catch {} }
    const w = village.frame.contentWindow;
    w.addEventListener('spyr:village-change', e => { if (pid) villageSave(pid, structuredClone(e.detail)); });
    w.addEventListener('spyr:village-retry', () => { if (pid) villageSave(pid, a.getState()); });
    villageReady = true;
    await syncHabits(pid);
    clearInterval(syncTimer);
    syncTimer = setInterval(() => { if (current === village) syncHabits(pid); }, 5 * 60 * 1000);
  }

  /* ---------- gym completion capture (unchanged contract) ---------- */
  window.addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    const d = e.data || {};
    if (e.source === gym.frame.contentWindow) {
      if (d.type === 'spyr:gym-exit') { closeOverlay(false); return; }
      if (d.type === 'spyr:gym-complete' && d.record) {
        try {
          const rec = d.record;
          const entry = { logId: rec.logId || (rec.date + ':' + (rec.title || 'session')), date: rec.date || new Date().toISOString(),
            title: rec.title || 'SPYR GYM session', trainer: rec.trainer ?? null, elapsed: Number(rec.elapsed) || 0,
            complete: !!rec.complete, stamp: rec.stamp ?? null, source: 'spyr-gym' };
          const list = JSON.parse(localStorage.getItem(GYM_STORE) || '[]');
          localStorage.setItem(GYM_STORE, JSON.stringify(list.filter(x => x.logId !== entry.logId).concat(entry).slice(-200)));
          window.dispatchEvent(new CustomEvent('spyr:gym-complete', { detail: entry }));
        } catch {}
      }
    }
  });

  window.SPYR_GYM = {
    open: () => openOverlay(gym, GYM_URL, '#101b18'), close: () => closeOverlay(false),
    completions: () => { try { return JSON.parse(localStorage.getItem(GYM_STORE) || '[]'); } catch { return []; } },
    clear: () => localStorage.removeItem(GYM_STORE)
  };
  window.SPYR_VILLAGE = { open: openVillage, close: () => closeOverlay(true), sync: () => syncHabits(profileId()), state: () => api()?.getState?.() };
})();
