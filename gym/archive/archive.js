/* SPYR Iron Archive — decks, logging, PR foil. v1
   Storage: spyr-archive:v1 (logs, claimed, foil) · spyr-archive:active (resumable session)
   Host: posts {type:'spyr:gym-complete', record} to the SPYR shell when a deck is saved. */
(() => {
'use strict';
/* v52.53: follow the app's own Light/Dark setting (same origin), not just the phone's */
try { const th = localStorage.getItem('rt1:theme'); if (th === 'dark' || th === 'light') document.documentElement.dataset.theme = th; } catch {}
const CARDS = window.ARCHIVE_CARDS, DECKS = window.ARCHIVE_DECKS;
const byN = Object.fromEntries(CARDS.map(c => [c.n, c]));
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
/* card art versions: bump a card's number here when its picture is replaced, so phones fetch the new one
   (the offline cache keeps pictures forever by address) */
const IMGV = {};
const img = (n, thumb) => { const c = byN[n]; if (c && c.art) return thumb ? c.thumb : c.art; return `cards/${n}${thumb ? '-t' : ''}.webp${IMGV[n] ? '?v=' + IMGV[n] : ''}`; };
const ICONS = window.ARCHIVE_ICONS || {}; // e.g. {push:'icons/push-v2.png'} once real icons exist
const iconImg = name => ICONS[name] ? `<img src="${ICONS[name]}" alt="">` : '';
/* v52.52: progress is kept per SPYR account and mirrored to the account's cloud row
   (spyr:archive:<pid>) through the SPYR shell, so it follows the player to any phone. */
const PID = (() => { try { return (JSON.parse(localStorage.getItem('rt1:me') || 'null') || {}).id || null; } catch { return null; } })();
const KEY = PID ? 'spyr-archive:v1:' + PID : 'spyr-archive:v1', ACTIVE = PID ? 'spyr-archive:active:' + PID : 'spyr-archive:active';
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const embedded = window.parent !== window;
const inGym = /\/gym\/archive\//.test(location.pathname);
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // local calendar day
const today = () => ymd(new Date());
const prettyDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

// one-time move of progress saved before v52.52 (device-wide key) into the first account that opens the Archive
if (PID && !localStorage.getItem(KEY) && localStorage.getItem('spyr-archive:v1')) {
  try { localStorage.setItem(KEY, localStorage.getItem('spyr-archive:v1')); localStorage.removeItem('spyr-archive:v1');
    const a = localStorage.getItem('spyr-archive:active'); if (a) { localStorage.setItem(ACTIVE, a); localStorage.removeItem('spyr-archive:active'); } } catch {}
}
// v52.53: never leave device-wide progress lying around for the next account on a shared phone
if (PID) { try { localStorage.removeItem('spyr-archive:v1'); localStorage.removeItem('spyr-archive:active'); } catch {} }
/* ---------- v52.54: new card sets without an app update ----------
   Sets after the Founder's Set live in the database row `spyr:sets` (published by SPYR, read-only for players),
   with their pictures hosted online. The last copy is kept on the phone so they work offline.
   Shape: {sets:[{id, name, from:'YYYY-MM-DD', cards:[{n:'066', t, ex, m, sets, reps, rest, acc, mode, side, each,
   cues:[3], safety, art:'https://…', thumb:'https://…', base, mus}], decks:[{id, name, icon, note, cards:[…]}]}]} */
const SETS_CACHE = 'spyr-archive:sets';
const okUrl = u => typeof u === 'string' && /^https:\/\/[\w.-]+(:\d+)?\/[\w./%~+-]*\.(webp|png|jpe?g)(\?[\w=&.-]*)?$/i.test(u) && u.length < 400;
const txt = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
let setsSig = '';
function addSets(data) {
  const sets = data && Array.isArray(data.sets) ? data.sets : [];
  let added = 0;
  for (const st of sets) {
    if (!st || !/^[\w-]{1,32}$/.test(st.id || '') || (st.from && (typeof st.from !== 'string' || st.from > today()))) continue;
    for (const c of Array.isArray(st.cards) ? st.cards : []) {
      if (!c || !/^\d{3}$/.test(c.n) || byN[c.n] || !okUrl(c.art)) continue;
      const card = {n: c.n, t: txt(c.t, 40), ex: txt(c.ex, 60), m: txt(c.m, 80), sets: Math.min(10, Math.max(1, +c.sets || 3)), reps: txt(String(c.reps ?? '8'), 12),
        rest: Math.min(600, Math.max(15, +c.rest || 90)), acc: /^#[0-9a-f]{6}$/i.test(c.acc || '') ? c.acc : '#1f5a3c',
        mode: ['weight', 'added', 'bw', 'time', 'distance'].includes(c.mode) ? c.mode : 'weight', side: !!c.side, each: !!c.each,
        cues: (Array.isArray(c.cues) ? c.cues : []).slice(0, 3).map(q => txt(q, 120)), safety: txt(c.safety, 120) || undefined,
        art: c.art, thumb: okUrl(c.thumb) ? c.thumb : c.art, set: st.id};
      if (!card.t || !card.ex) continue;
      CARDS.push(card); byN[card.n] = card; added++;
      const WO = window.SPYR_CARD_WORKOUT || (window.SPYR_CARD_WORKOUT = {});
      if (typeof c.base === 'string') WO[card.n] = c.base.slice(0, 40); else if (Array.isArray(c.mus)) WO[card.n] = c.mus.slice(0, 2).map(x => txt(x, 30));
    }
    for (const d of Array.isArray(st.decks) ? st.decks : []) {
      if (!d || !/^[\w-]{1,40}$/.test(d.id || '') || DECKS.some(x => x.id === d.id)) continue;
      const cards = (Array.isArray(d.cards) ? d.cards : []).filter(n => byN[n]).slice(0, 8);
      if (cards.length < 2) continue;
      DECKS.push({id: d.id, name: txt(d.name, 30) || 'New deck', icon: ['push', 'pull', 'legs', 'core', 'power', 'arms', 'strongman'].includes(d.icon) ? d.icon : 'power', note: txt(d.note, 80), cards});
    }
  }
  return added;
}
try { const cached = JSON.parse(localStorage.getItem(SETS_CACHE) || 'null'); if (cached) { addSets(cached); setsSig = JSON.stringify(cached); } } catch {}

/* v52.53: everything read from this phone or the cloud is checked before use — numbers stay numbers, ids and dates
   match their patterns, names are plain short text — so a tampered save can't inject anything into the page */
const VALID_N = {has: n => typeof n === 'string' && /^\d{3}$/.test(n)}; // any well-formed card number: progress on a set this phone hasn't loaded yet is kept
const isDate = d => typeof d === 'string' && /^\d{4}-\d\d-\d\d$/.test(d);
const isId = x => typeof x === 'string' && /^[\w-]{1,48}$/.test(x);
const num = v => { const x = +v; return Number.isFinite(x) ? Math.min(1e5, Math.max(0, x)) : 0; };
function clean(x) {
  x = x && typeof x === 'object' ? x : {};
  const o = {logs: {}, claimed: {}, foil: {}, decks: {}, days: {}, swaps: {}, mine: []};
  for (const [n, list] of Object.entries(x.logs || {})) { if (!VALID_N.has(n) || !Array.isArray(list)) continue;
    const l = list.filter(e => e && isDate(e.d) && Array.isArray(e.sets)).map(e => ({d: e.d, sets: e.sets.filter(Array.isArray).map(([w, r]) => [num(w), num(r)]),
      ...(e.id != null ? {id: String(e.id).slice(0, 64)} : {}), ...(e.at != null ? {at: num(e.at) && +e.at} : {})}));
    if (l.length) o.logs[n] = l; }
  for (const k of ['claimed', 'foil']) for (const n of Object.keys(x[k] || {})) if (VALID_N.has(n) && x[k][n]) o[k][n] = true;
  for (const [id, d] of Object.entries(x.decks || {})) if (isId(id) && isDate(d)) o.decks[id] = d;
  for (const [d, ids] of Object.entries(x.days || {})) if (isDate(d) && Array.isArray(ids)) o.days[d] = ids.filter(isId);
  for (const [id, m] of Object.entries(x.swaps || {})) if (isId(id) && m && typeof m === 'object') { const t = {}; for (const [i, n] of Object.entries(m)) if (/^\d{1,2}$/.test(i) && VALID_N.has(n)) t[i] = n; o.swaps[id] = t; }
  for (const m of Array.isArray(x.mine) ? x.mine : []) if (m && isId(m.id) && Array.isArray(m.cards)) { const cards = m.cards.filter(n => VALID_N.has(n)).slice(0, 12); if (cards.length) o.mine.push({id: m.id, name: String(m.name || 'My deck').slice(0, 40), cards}); }
  const pr = x.prefs && typeof x.prefs === 'object' ? x.prefs : {};
  o.prefs = {unit: pr.unit === 'kg' ? 'kg' : 'lb', sound: pr.sound !== false, haptic: pr.haptic !== false};
  if (+x.resetAt > 0) o.resetAt = +x.resetAt; if (+x.editedAt > 0) o.editedAt = +x.editedAt;
  const dl = x.daily; if (dl && typeof dl === 'object' && isDate(dl.date) && isId(String(dl.focus)) && Array.isArray(dl.cards)) o.daily = {v: +dl.v || 0, date: dl.date, salt: String(dl.salt || '').slice(0, 32), focus: String(dl.focus), cards: dl.cards.filter(n => byN[n]).slice(0, 8)};
  return o;
}
let db = clean(read(KEY, null));
/* ---------- cloud mirror ----------
   Merge rules (two phones can both be used offline):
   · card logs: union, one copy per entry (entries carry an id; older ones are keyed by date + sets)
   · claimed / foil: kept if either side has them
   · deck dates: latest; days: union
   · settings, swaps and your own decks: the side edited most recently
   · "Reset all progress" starts a new epoch; anything logged before the newest reset is dropped on every phone */
const STORE = (() => { try { return embedded && window.parent.SPYR_ARCHIVE_STORE || null; } catch { return null; } })();
const entryKey = e => e.id || (e.d + '|' + JSON.stringify(e.sets));
function merge(a, b) {
  a = a || {}; b = b || {};
  const ra = a.resetAt || 0, rb = b.resetAt || 0, reset = Math.max(ra, rb);
  const keep = (side, rs) => e => rs >= reset || (e.at || 0) > reset; // drop pre-reset entries from a side that hasn't seen the reset
  const out = {logs: {}, claimed: {}, foil: {}, decks: {}, days: {}, resetAt: reset || undefined};
  for (const [side, rs] of [[a, ra], [b, rb]]) {
    for (const [n, list] of Object.entries(side.logs || {})) {
      const m = out.logs[n] ||= [];
      for (const e of list || []) if (keep(side, rs)(e) && !m.some(x => entryKey(x) === entryKey(e))) m.push(e);
    }
    if (rs >= reset) {
      for (const n of Object.keys(side.foil || {})) if (side.foil[n]) out.foil[n] = true;
      for (const [id, d] of Object.entries(side.decks || {})) if (!out.decks[id] || d > out.decks[id]) out.decks[id] = d;
      for (const [d, ids] of Object.entries(side.days || {})) out.days[d] = [...new Set([...(out.days[d] || []), ...(ids || [])])];
    }
  }
  for (const n of Object.keys(out.logs)) { out.logs[n].sort((x, y) => x.d < y.d ? -1 : x.d > y.d ? 1 : (x.at || 0) - (y.at || 0)); if (!out.logs[n].length) delete out.logs[n]; else out.claimed[n] = true; }
  for (const n of Object.keys(out.foil)) if (!out.claimed[n]) delete out.foil[n];
  const w = (b.editedAt || 0) > (a.editedAt || 0) ? b : a;
  out.prefs = w.prefs || a.prefs || b.prefs; out.swaps = w.swaps || {}; out.mine = w.mine || []; out.editedAt = Math.max(a.editedAt || 0, b.editedAt || 0) || undefined;
  out.daily = a.daily; // today's pick stays per phone
  return clean(out);
}
const sig = x => JSON.stringify([x.logs, x.foil, x.decks, x.days, x.prefs, x.swaps, x.mine, x.resetAt]);
let pushT = null, pushing = Promise.resolve(), cloudOk = !!STORE;
function push() {
  if (!STORE || !PID) return;
  clearTimeout(pushT);
  pushT = setTimeout(() => { pushing = pushing.then(async () => {
    try { const remote0 = await STORE.load(PID); const remote = remote0 && clean(remote0); const m = merge(db, remote);
      if (!remote || sig(m) !== sig(remote)) await STORE.save(PID, {...m, daily: undefined, savedAt: Date.now()});
      cloudOk = true; } catch { cloudOk = false; }
  }); }, 600);
}
function save(edited) { if (edited) db.editedAt = Date.now(); write(KEY, db); push(); }
async function pull(rerender) {
  if (!STORE || !PID) return;
  try { const r0 = await STORE.load(PID); if (!r0) { push(); return; } const remote = clean(r0);
    const m = merge(db, remote); const changed = sig(m) !== sig(db);
    db = Object.assign(db, m); write(KEY, db); applyDecks();
    if (sig(m) !== sig(remote)) push();
    if (changed && rerender) rerender();
  } catch { cloudOk = false; }
}
db.decks ||= {}; // deckId -> last date done
db.days ||= {};   // date -> [deckIds]
db.swaps ||= {};  // deckId -> {slot: cardNo}
db.mine ||= [];   // custom decks [{id,name,cards}]
db.prefs = Object.assign({unit: 'lb', sound: true, haptic: true}, db.prefs || {});
const KG = () => db.prefs.unit === 'kg';
const U = () => db.prefs.unit;
// weights are stored in lb; shown and entered in the chosen unit
const toU = lb => KG() ? Math.round(lb * 0.45359237 * 2) / 2 : Math.round(lb * 10) / 10;
const fromU = v => KG() ? v / 0.45359237 : v;
const stepU = () => KG() ? 2.5 : 5;
const BASE = Object.fromEntries(DECKS.map(d => [d.id, d.cards.slice()]));
let applyDecks = function () {
  DECKS.forEach(d => { if (!BASE[d.id]) return; const sw = db.swaps[d.id] || {};
    d.cards = BASE[d.id].map((n, i) => sw[i] && byN[sw[i]] ? sw[i] : n);
    // v52.54: extra cards you added to a deck (slots after the original ones)
    Object.keys(sw).map(Number).filter(i => i >= BASE[d.id].length).sort((a, b) => a - b).forEach(i => { if (byN[sw[i]] && !d.cards.includes(sw[i])) d.cards.push(sw[i]); }); });
  for (let i = DECKS.length - 1; i >= 0; i--) if (DECKS[i].mine) DECKS.splice(i, 1);
  db.mine.forEach(m => { const cards = m.cards.filter(n => byN[n]); if (cards.length) DECKS.push({...m, cards, icon: 'mine', mine: true, note: cards.map(n => byN[n].ex.split(' ').slice(-1)[0]).join(', ')}); });
};
// muscle group for filters / swaps
const GROUPS = [['chest', 'Chest', /chest|pec/i], ['back', 'Back', /lats|back|traps|rhomboid|rear delt/i], ['shoulders', 'Shoulders', /shoulder|delt/i],
  ['arms', 'Arms', /biceps|triceps|forearm|brachial/i], ['legs', 'Legs', /quads|glute|hamstring|calves|adductor/i], ['core', 'Core', /core|abs|oblique|hip flexor/i]];
const groupsOf = c => GROUPS.filter(([, , re]) => re.test(c.m)).map(([k]) => k);
const primary = c => { const first = c.m.split(' · ')[0]; const g = GROUPS.find(([, , re]) => re.test(first)); return g ? g[0] : groupsOf(c)[0]; };
// barbell plate math (45 lb bar)
const isBarbell = c => /barbell|bench press|deadlift|front squat|zercher squat|split jerk|close-grip|shrug/i.test(c.ex) && !/dumbbell|db |trap-bar|single-leg/i.test(c.ex);
function plates(lb) { const total = toU(lb), bar = KG() ? 20 : 45; let side = (total - bar) / 2; if (side <= 0) return total === bar ? 'Empty bar' : '';
  const out = []; for (const p of KG() ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5]) while (side >= p - 1e-9) { out.push(p); side -= p; }
  return side > 0.01 ? '' : `Bar + ${out.join(' · ')} a side`; }
const weekKey = () => { const d = new Date(); return [...Array(7)].map((_, i) => { const x = new Date(d); x.setDate(d.getDate() - 6 + i); return ymd(x); }); };
const streak = () => { let n = 0; const d = new Date(); for (;;) { const k = ymd(d); if (db.days[k]) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && k === today()) { d.setDate(d.getDate() - 1); } else break; } return n; };
// ---------- Daily Deck: built each day from the muscles you've rested longest
const daysSince = date => Math.round((new Date(today() + 'T12:00:00') - new Date(date + 'T12:00:00')) / 864e5);
function lastTrained() { const last = {}; for (const [n, logs] of Object.entries(db.logs)) { const c = byN[n]; if (!c || !logs.length) continue; const d = logs.at(-1).d;
  for (const g of groupsOf(c)) if (!last[g] || d > last[g]) last[g] = d; } return last; }
const restOf = (last, g) => last[g] ? daysSince(last[g]) : 9;
const clusterOf = c => { const p = primary(c); if (/snatch|jerk|swing|get-up|carry|sled/i.test(c.ex)) return 'power';
  if (p === 'legs') return 'legs'; if (p === 'core') return 'core';
  if (p === 'back' || /curl|row|pull|shrug|face pull|reverse fly/i.test(c.ex)) return 'pull';
  if (p === 'chest' || p === 'shoulders' || /press|dip|push-up|triceps|crusher|extension|fly/i.test(c.ex)) return 'push';
  return p === 'arms' ? 'pull' : 'power'; };
const CLUSTER = {push: {name: 'Push', groups: ['chest', 'shoulders']}, pull: {name: 'Pull', groups: ['back']}, legs: {name: 'Legs', groups: ['legs']}};
let rnd = 1; const seed = str => { rnd = [...str].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7); };
const rand = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
function buildDaily(salt = '') {
  const last = lastTrained(); seed(today() + salt);
  const rest = Object.fromEntries(Object.entries(CLUSTER).map(([k, v]) => [k, Math.min(...v.groups.map(g => restOf(last, g)))]));
  const focus = Object.keys(rest).sort((a, b) => rest[b] - rest[a] || rand() - .5)[0];
  const lastLogged = n => (db.logs[n] || []).at(-1)?.d || '';
  const pool = CARDS.filter(c => clusterOf(c) === focus).map(c => ({c, k: lastLogged(c.n) + rand().toFixed(3)})).sort((a, b) => a.k < b.k ? -1 : 1).map(x => x.c);
  const lead = pool.find(c => c.sets >= 4) || pool[0];
  const picks = [lead, ...pool.filter(c => c !== lead && !(clusterOf(c) === focus && c.ex === lead.ex))].slice(0, 3);
  const coreOk = restOf(last, 'core') >= 1;
  const corePool = CARDS.filter(c => clusterOf(c) === 'core').sort(() => rand() - .5);
  const fourth = coreOk && corePool.length ? corePool[0] : pool.find(c => !picks.includes(c));
  if (!db.daily || db.daily.v !== 2) {} 
  db.daily = {v: 2, date: today(), salt, focus, cards: [...picks, fourth].filter(Boolean).map(c => c.n)}; save();
}
function dailyDeck() { if (!db.daily || db.daily.date !== today() || db.daily.v !== 2 || !CLUSTER[db.daily.focus]) buildDaily(); const f = CLUSTER[db.daily.focus];
  return {id: 'daily', name: "Today's deck", icon: 'daily', daily: true, cards: db.daily.cards, note: `${f.name} focus · picked for what's rested`}; }
const _apply = applyDecks;
applyDecks = function () { _apply(); const i = DECKS.findIndex(d => d.daily); if (i >= 0) DECKS.splice(i, 1); DECKS.push(dailyDeck()); };
applyDecks();
let filter = 'all', deckFilter = 'all', muscle = 'all', building = null; // building: Set of card numbers while making a deck
let active = (a => { // {deck, idx, start, sets:{n:[{w,r,done,pr}]}, claimedNow:[], prNow:[]} — checked like the save
  if (!a || typeof a !== 'object' || !isId(String(a.deck)) || !a.sets || typeof a.sets !== 'object') return null;
  const sets = {}; for (const [n, l] of Object.entries(a.sets)) if (VALID_N.has(n) && Array.isArray(l)) sets[n] = l.map(x => ({w: num(x && x.w), r: num(x && x.r), done: !!(x && x.done), pr: !!(x && x.pr)}));
  return {deck: String(a.deck), idx: Math.max(0, Math.floor(num(a.idx))), start: +a.start || Date.now(), lastAt: +a.lastAt || undefined, sets,
    claimedNow: (a.claimedNow || []).filter(n => VALID_N.has(n)), prNow: (a.prNow || []).filter(n => VALID_N.has(n))};
})(read(ACTIVE, null));
const root = $('#app');

/* ---------- scoring ---------- */
// estimated strength: weight × (1 + reps/30), plus a sliver for reps so bodyweight-only sets still count
const noW = c => c.mode === 'bw' || c.mode === 'time';
const score = (c, w, r) => noW(c) ? r : c.mode === 'distance' ? (r >= (c.target || 0) ? w : 0) : w * (1 + r / 30) + r * 0.01;
const best = n => { const c = byN[n]; let b = 0; for (const s of db.logs[n] || []) for (const [w, r] of s.sets) b = Math.max(b, score(c, w, r)); return b; };
const lastLog = n => (db.logs[n] || []).at(-1);
const unitOf = c => c.mode === 'added' ? '+' + U() : c.each ? U() + ' each' : U();
const repWord = c => c.mode === 'distance' ? 'm' : c.mode === 'time' ? (c.side ? 'sec / side' : 'sec') : c.side ? 'reps / side' : 'reps';
// one set as text: '135×6', '12 reps', '30 s'
const setTxt = (c, w, r) => c.mode === 'bw' ? `${r} reps` : c.mode === 'time' ? `${r} s` : c.mode === 'distance' ? `${toU(w)}×${r} m` : `${toU(w)}×${r}`;
const deckSets = d => d.cards.reduce((a, n) => a + byN[n].sets, 0);
const deckMins = d => Math.round(d.cards.reduce((a, n) => { const c = byN[n]; return a + c.sets * (c.rest + 45); }, 0) / 60 / 5) * 5;
const daysAgo = date => { const t = Math.round((new Date(today() + 'T12:00:00') - new Date(date + 'T12:00:00')) / 864e5); return t <= 0 ? 'today' : t === 1 ? 'yesterday' : `${t} days ago`; };
// rotate through the decks: the one you haven't done for the longest (never-done first, in list order)
const upNext = () => DECKS.slice().sort((a, b) => (db.decks[a.id] || '') < (db.decks[b.id] || '') ? -1 : (db.decks[a.id] || '') > (db.decks[b.id] || '') ? 1 : 0)[0];
const rx = c => `${c.sets} × ${c.reps}${c.side && c.mode !== 'distance' ? ' / side' : ''}`;

/* ---------- audio + wake lock (same feel as the Gym player) ---------- */
let ac = null;
function chime() { if (!db.prefs.sound) return; try { ac ??= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime; [659.25, 523.25].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(0, t + i * .16); g.gain.linearRampToValueAtTime(.18, t + i * .16 + .02); g.gain.exponentialRampToValueAtTime(.001, t + i * .16 + .5);
  o.connect(g).connect(ac.destination); o.start(t + i * .16); o.stop(t + i * .16 + .55); }); } catch {} }
let lock = null;
async function awake(on) { try { if (on && !lock && navigator.wakeLock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => lock = null); } else if (!on && lock) { await lock.release(); lock = null; } } catch { lock = null; } }

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = p => { if (!db.prefs.haptic) return; try { navigator.vibrate && navigator.vibrate(p); } catch {} };
// pointer tilt + glare (Wallet / TCG-style). Sets --rx --ry --mx --my on the element.
function tilt(node, max = 10) {
  if (calm) return;
  const on = e => { const r = node.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    node.style.setProperty('--ry', ((x - .5) * max * 2).toFixed(2) + 'deg'); node.style.setProperty('--rx', ((.5 - y) * max * 2).toFixed(2) + 'deg');
    node.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); node.style.setProperty('--my', (y * 100).toFixed(1) + '%'); node.classList.add('lit'); };
  const off = () => { node.style.setProperty('--rx', '0deg'); node.style.setProperty('--ry', '0deg'); node.classList.remove('lit'); };
  node.addEventListener('pointermove', on); node.addEventListener('pointerdown', on); node.addEventListener('pointerleave', off); node.addEventListener('pointerup', off); node.addEventListener('pointercancel', off);
}
// count a number up from 0 (summary)
function countUp(node, to, ms = 700) { if (calm || !to) { node.textContent = to.toLocaleString(); return; } const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / ms), v = Math.round(to * (1 - Math.pow(1 - k, 3))); node.textContent = v.toLocaleString(); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
// big moment: a card claimed or turned foil
function reveal(n, kind, line) {
  const c = byN[n]; document.querySelector('.reveal')?.remove();
  const o = el('div', 'reveal ' + kind);
  o.innerHTML = `<div class="rays"></div><div class="rv-card${kind === 'pr' ? ' foil' : ''}"><img loading="lazy" decoding="async" src="${img(n)}" alt=""><span class="foil-fx"></span><span class="glare"></span></div>
    <div class="rv-txt"><span class="lbl">${kind === 'pr' ? 'New best · foil unlocked' : 'Card claimed'}</span><b>${esc(c.t)}</b><span>${esc(line)}</span></div><span class="rv-tap">Tap to keep going</span>`;
  document.body.append(o); tilt(o.querySelector('.rv-card'), 14);
  buzz(kind === 'pr' ? [30, 40, 30, 40, 80] : [25, 40, 60]);
  const close = () => { o.classList.add('out'); setTimeout(() => o.remove(), 260); };
  o.onclick = close; setTimeout(close, kind === 'pr' ? 2600 : 1900);
}

function toast(msg, pr) { const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (pr ? ' pr' : ''); requestAnimationFrame(() => t.classList.add('show')); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }
const backSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const chevSvg = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const tickSvg = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const playSvg = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
const xSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/* ---------- routing ---------- */
function go(h) { location.hash = h; }
function route() {
  const p = new URLSearchParams(location.hash.slice(1));
  stopTick(); awake(false); if (!/^#?$/.test(location.hash) && !location.hash.startsWith('#deck')) building = null; if (location.hash.startsWith('#deck')) { building = null; document.querySelector('#buildbar')?.remove(); }
  if (p.get('play') && active) return renderPlay();
  if (p.get('card') && byN[p.get('card')]) { renderHome(); setTimeout(() => openViewer(byN[p.get('card')]), 50); return; }
  const d = DECKS.find(x => x.id === p.get('deck'));
  if (d) return renderDeck(d);
  renderHome();
}
window.addEventListener('hashchange', route);

/* ---------- home ---------- */
function topBar(title, back) {
  const h = el('header', 'head');
  if (back) { const b = el('button', 'round tap', backSvg); b.setAttribute('aria-label', 'Back'); b.onclick = back; h.append(b); }
  else if (inGym) { const a = el('a', 'round tap', backSvg); a.href = '../index.html'; a.setAttribute('aria-label', 'Back to Gym'); h.append(a); }
  h.append(el('h1', '', esc(title)));
  return h;
}
function sec(title, right) { const d = el('div', 'sec'); d.innerHTML = `<span class="rh">${esc(title)}</span><span>${right ? esc(right) : ''}</span>`; return d; }

function deckRow(d, resume) {
  const b = el('button', 'deck rp tap' + (resume ? ' resume' : ''));
  const done = resume ? Object.values(active.sets).flat().filter(s => s.done).length : 0;
  const total = resume ? Object.values(active.sets).flat().length : 0;
  const stack = `<span class="stack lead">${d.cards.slice(0, 3).map(n => `<img loading="lazy" decoding="async" src="${img(n, 1)}" alt="">`).join('')}</span>`;
  const ago = db.decks[d.id] ? daysAgo(db.decks[d.id]) : null; const when = !ago ? 'New' : ago === 'today' ? 'Today' : ago === 'yesterday' ? 'Yesterday' : ago.replace(' days ago', 'd ago');
  b.innerHTML = `${ICONS[d.icon] ? `<span class="ico">${iconImg(d.icon)}</span>` : stack}
    <span class="body"><span class="nm">${resume ? 'Continue ' : ''}${esc(d.name)}</span>
    <span class="mt">${resume ? `${done} of ${total} sets · ${fmt((Date.now() - active.start) / 1000)} in` : `${deckSets(d)} sets · ~${deckMins(d)} min`}</span></span>
    ${resume ? '' : `<span class="when${db.decks[d.id] ? '' : ' new'}">${when}</span>`}${chevSvg}`;
  b.onclick = () => resume ? go('play=1') : go('deck=' + d.id);
  return b;
}

function renderHome() {
  document.body.dataset.view = 'home';
  root.innerHTML = '';
  const w = el('div', 'wrap');
  const head = topBar('Iron Archive');
  const wl = el('button', 'round tap', logSvg); wl.setAttribute('aria-label', 'Open Workout log'); wl.title = 'Workout log'; wl.onclick = () => openWorkout(); head.append(wl);
  const gear = el('button', 'round tap', gearSvg); gear.setAttribute('aria-label', 'Settings'); gear.onclick = openSettings; head.append(gear);
  w.append(head);
  const claimed = CARDS.filter(c => db.claimed[c.n]).length, foils = CARDS.filter(c => db.foil[c.n]).length;
  const sessions = Object.values(db.logs).reduce((a, l) => a + l.length, 0);
  const hero = el('div', 'hero');
  hero.innerHTML = `<div class="hero-top"><div><div class="lbl">Your collection</div>
      <div class="count"><b>${claimed}</b><span>/ ${CARDS.length} claimed</span></div></div>
      <div class="fan">${['014', '012', '019'].map(n => `<img loading="lazy" decoding="async" src="${img(n, 1)}" alt="">`).join('')}</div></div>
    <div class="track"><i style="width:${claimed / CARDS.length * 100}%"></i></div>
    ${sessions ? `<div class="week">${weekKey().map(k => { const done = db.days[k], d = new Date(k + 'T12:00:00');
      return `<span class="day${done ? ' on' : ''}${k === today() ? ' today' : ''}"><i>${done ? tickSvg : ''}</i><em>${'SMTWTFS'[d.getDay()]}</em></span>`; }).join('')}</div>
    <div class="stats"><span><b>${streak()}</b> day streak</span><span><b>${foils}</b> foil${foils === 1 ? '' : 's'}</span><span><b>${sessions}</b> card log${sessions === 1 ? '' : 's'}</span></div>`
    : `<div class="first"><b>Start any deck.</b> The first set you log on a card claims it. Beat your best on it later and it turns foil.</div>`}`;
  w.append(hero);
  if (active) { const d = DECKS.find(x => x.id === active.deck); if (d) w.append(deckRow(d, true)); }
  else {
    const d = DECKS.find(x => x.daily), last = lastTrained();
    const nx = el('div', 'next daily rp');
    const rec = GROUPS.map(([k, t]) => { const r = restOf(last, k), pct = Math.min(1, r / 3); const st = r >= 3 ? 'fresh' : r >= 2 ? 'ready' : 'tired';
      return `<span class="rec ${st}" title="${t}"><i style="--p:${pct}"></i><b>${t}</b><em>${r >= 9 ? 'Fresh' : r === 0 ? 'Today' : r + 'd'}</em></span>`; }).join('');
    nx.innerHTML = `<div class="next-top"><div><div class="lbl">Today's deck · ${esc(CLUSTER[db.daily.focus].name)} focus</div><div class="rh nm">Built for today</div>
      <div class="mt">${deckSets(d)} sets · ~${deckMins(d)} min · picked from the muscles you've rested longest</div></div></div>
      <div class="fan4" aria-hidden="true">${d.cards.map((n, k) => `<span class="f" style="--k:${k - (d.cards.length - 1) / 2}"><img loading="lazy" decoding="async" src="${img(n, 1)}" alt=""><span class="glare"></span></span>`).join('')}</div>
      ${sessions ? `<div class="recov"><span class="lbl">Recovery</span><div class="recs">${rec}</div></div>` : ''}`;
    const go1 = el('button', 'rbtn', 'Start today\'s deck'); go1.onclick = () => { begin(d); go('play=1'); };
    const peek = el('button', 'rghost', 'See cards'); peek.onclick = () => go('deck=daily');
    const shuf = el('button', 'round tap shuffle', shuffleSvg); shuf.setAttribute('aria-label', 'Shuffle today\'s deck');
    shuf.onclick = () => { buildDaily(String(Date.now())); applyDecks(); buzz(10); renderHome(); };
    const r = el('div', 'next-acts three'); r.append(go1, peek, shuf); nx.append(r);
    w.append(nx); tilt(nx.querySelector('.fan4'), 6);
    if (Object.keys(db.decks).length) { const un = upNext(); if (un) { w.append(sec('Up next', '')); w.append(deckRow(un)); } }
  }
  const LIST = DECKS.filter(d => !d.daily);
  w.append(sec('Decks', `${LIST.length} decks`));
  const groups = [['all', 'All'], ...(db.mine.length ? [['mine', 'Mine']] : []), ['push', 'Push'], ['pull', 'Pull'], ['legs', 'Legs'], ['more', 'Core & more']];
  const inGroup = (d, g) => g === 'all' || (g === 'more' ? !['push', 'pull', 'legs', 'mine'].includes(d.icon) : d.icon === g);
  const dchips = el('div', 'chips');
  groups.forEach(([k, t]) => { const b = el('button', 'rchip tap' + (deckFilter === k ? ' on' : ''), `${t} <em>${LIST.filter(d => inGroup(d, k)).length}</em>`);
    b.setAttribute('aria-pressed', deckFilter === k); b.onclick = () => { deckFilter = k; renderHome(); document.querySelectorAll('.chips')[0]?.scrollIntoView({block: 'start'}); }; dchips.append(b); });
  w.append(dchips);
  const list = el('div', 'stack-list');
  LIST.filter(d => inGroup(d, deckFilter)).forEach(d => list.append(deckRow(d)));
  const mk = el('button', 'deck build rp tap', `<span class="plus">+</span><span class="body"><span class="nm">Build your own deck</span><span class="mt">Pick 2–6 cards from your collection</span></span>${chevSvg}`);
  mk.onclick = () => { building = new Set(); filter = 'all'; renderHome(); document.querySelector('.collect')?.scrollIntoView({behavior: calm ? 'auto' : 'smooth', block: 'start'}); };
  list.append(mk);
  w.append(list);
  const cs = sec(building ? 'Pick your cards' : 'Collection', building ? `${building.size} / 6 picked` : `${claimed}/${CARDS.length} claimed`); cs.classList.add('collect'); w.append(cs);
  const mchips = el('div', 'chips');
  [['all', 'All muscles'], ...GROUPS.map(([k, t]) => [k, t])].forEach(([k, t]) => { const b = el('button', 'rchip tap' + (muscle === k ? ' on' : ''), t);
    b.setAttribute('aria-pressed', muscle === k); b.onclick = () => { muscle = k; renderHome(); document.querySelector('.collect')?.scrollIntoView({block: 'start'}); }; mchips.append(b); });
  w.append(mchips);
  const chips = el('div', 'chips');
  const counts = {all: CARDS.length, claimed, foil: foils, todo: CARDS.length - claimed};
  [['all', 'All'], ['todo', 'Not claimed'], ['claimed', 'Claimed'], ['foil', 'Foil']].forEach(([k, t]) => {
    const b = el('button', 'rchip tap' + (filter === k ? ' on' : ''), `${t} <em>${counts[k]}</em>`);
    b.setAttribute('aria-pressed', filter === k); b.onclick = () => { filter = k; renderHome(); document.querySelector('.chips')?.scrollIntoView({block: 'start'}); };
    chips.append(b);
  });
  if (!building) w.append(chips);
  const shown = CARDS.filter(c => muscle === 'all' || groupsOf(c).includes(muscle)).filter(c => building || filter === 'all' || (filter === 'claimed' && db.claimed[c.n]) || (filter === 'foil' && db.foil[c.n]) || (filter === 'todo' && !db.claimed[c.n]));
  const g = el('div', 'grid');
  shown.forEach(c => {
    const t = el('button', 'tile tap' + (db.claimed[c.n] ? ' claimed' : ' unclaimed') + (db.foil[c.n] ? ' foil' : '') + (building ? ' pick' : '') + (building && building.has(c.n) ? ' picked' : ''));
    t.setAttribute('aria-label', `${c.t}, ${c.ex}`);
    t.innerHTML = `<img loading="lazy" decoding="async" src="${img(c.n, 1)}" alt="" loading="lazy"><span class="foil-fx"></span><span class="glare"></span><span class="order">${building && building.has(c.n) ? [...building].indexOf(c.n) + 1 : ''}</span><span class="stamp">${db.foil[c.n] ? 'Foil' : db.claimed[c.n] ? '✓ ' + c.n : c.n}</span>`;
    t.onclick = () => { if (!building) return openViewer(c);
      if (building.has(c.n)) building.delete(c.n); else if (building.size < 6) building.add(c.n); else return toast('Six cards max');
      buzz(10); t.classList.toggle('picked', building.has(c.n)); t.querySelector('.order').textContent = building.has(c.n) ? [...building].indexOf(c.n) + 1 : '';
      document.querySelectorAll('.tile.picked .order').forEach(o => { const n = o.closest('.tile').dataset.n; o.textContent = [...building].indexOf(n) + 1; });
      paintBuildBar(); };
    t.dataset.n = c.n; tilt(t, 8);
    g.append(t);
  });
  w.append(g);
  [...w.children].forEach((ch, k) => { ch.classList.add('rise'); ch.style.setProperty('--i', Math.min(k, 8)); });
  if (!shown.length) w.append(el('div', 'empty rp', filter === 'foil' ? 'No foils yet. Beat a best on any claimed card to turn it foil.' : 'Nothing claimed yet. Log one set on any card to claim it.'));
  root.append(w);
  if (building) { const bar = el('div', 'buildbar rp'); bar.id = 'buildbar'; document.body.querySelector('#buildbar')?.remove(); document.body.append(bar); paintBuildBar(); }
  else document.querySelector('#buildbar')?.remove();
}
function paintBuildBar() {
  const bar = $('#buildbar'); if (!bar) return;
  const n = building.size;
  bar.innerHTML = `<div class="bb-cards">${[...building].map(x => `<img loading="lazy" decoding="async" src="${img(x, 1)}" alt="">`).join('') || '<span class="bb-hint">Tap cards to add them</span>'}</div>
    <div class="bb-acts"><button class="rbtn2" id="bbCancel">Cancel</button><button class="rbtn" id="bbSave" ${n < 2 ? 'disabled' : ''}>Save deck · ${n}</button></div>`;
  $('#bbCancel').onclick = () => { building = null; renderHome(); };
  $('#bbSave').onclick = () => { const id = 'mine-' + Date.now(), name = `My deck ${db.mine.length + 1}`;
    db.mine.push({id, name, cards: [...building]}); save(true); applyDecks(); building = null; deckFilter = 'mine'; go('deck=' + id); toast(`${name} saved`); };
}

/* ---------- settings ---------- */
function openSettings() {
  const m = el('div', 'sheet-wrap'); let armed = false;
  const paintS = () => { m.innerHTML = `<div class="sheet2 rp set-sheet"><div class="grab"></div><div class="rh sw-t">Settings</div>
    <div class="srow2"><span><b>Weight unit</b><em>Your history converts automatically</em></span><div class="seg" role="group" aria-label="Weight unit">${['lb', 'kg'].map(u => `<button class="${db.prefs.unit === u ? 'on' : ''}" data-u="${u}" aria-pressed="${db.prefs.unit === u}">${u}</button>`).join('')}</div></div>
    <div class="srow2"><span><b>Rest chime</b><em>Plays when rest is over</em></span><button class="tog${db.prefs.sound ? ' on' : ''}" data-t="sound" role="switch" aria-checked="${db.prefs.sound}"><i></i></button></div>
    <div class="srow2"><span><b>Vibration</b><em>On sets, claims and PRs</em></span><button class="tog${db.prefs.haptic ? ' on' : ''}" data-t="haptic" role="switch" aria-checked="${db.prefs.haptic}"><i></i></button></div>
    <button class="rghost danger" data-x="reset">${armed ? 'Tap again to erase every log, claim and foil' : 'Reset all progress'}</button></div>`; };
  paintS();
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 220); renderHome(); };
  m.addEventListener('click', e => { const u = e.target.closest('[data-u]'), t = e.target.closest('[data-t]'), x = e.target.closest('[data-x]');
    if (u) { db.prefs.unit = u.dataset.u; save(true); buzz(8); paintS(); return; }
    if (t) { db.prefs[t.dataset.t] = !db.prefs[t.dataset.t]; save(true); buzz(8); paintS(); return; }
    if (x) { if (!armed) { armed = true; paintS(); return; } const prefs = db.prefs; db = {logs: {}, claimed: {}, foil: {}, decks: {}, days: {}, swaps: {}, mine: [], prefs, resetAt: Date.now()}; save(true); active = null; write(ACTIVE, null); applyDecks(); close(); toast('Progress reset'); return; }
    if (e.target === m) close(); });
  document.body.append(m);
}

/* ---------- collection viewer ---------- */
function openViewer(c) {
  const hist = db.logs[c.n] || [];
  const tops = hist.map(h => h.sets.reduce((a, x) => Math.max(a, score(c, ...x)), 0)).slice(-8);
  const topSet = hist.flatMap(h => h.sets).reduce((a, s) => !a || score(c, ...s) > score(c, ...a) ? s : a, null);
  const max = Math.max(...tops, 1);
  const m = el('div', 'inspect');
  m.innerHTML = `<button class="round tap ins-x" aria-label="Close">${xSvg}</button>
    <div class="ins-card${db.foil[c.n] ? ' foil' : ''}"><img loading="lazy" decoding="async" src="${img(c.n)}" alt="${esc(c.t)}"><span class="foil-fx"></span><span class="glare"></span></div>
    <div class="ins-sheet rp">
      <div class="ins-top"><span class="num" style="background:${c.acc}">${c.n}</span><span class="tag${db.foil[c.n] ? ' pr' : ''}">${db.foil[c.n] ? 'Foil' : db.claimed[c.n] ? 'Claimed' : 'Not claimed'}</span></div>
      <div class="rh ins-t">${esc(c.t)}</div><div class="ins-ex">${esc(c.ex)} · ${rx(c)} · rest ${fmt(c.rest)}</div>
      <div class="ins-stats"><div><b>${topSet ? setTxt(c, ...topSet) : '—'}</b><span>Best set</span></div><div><b>${hist.length}</b><span>Sessions</span></div><div><b>${hist.length ? prettyDate(hist.at(-1).d) : '—'}</b><span>Last</span></div></div>
      ${tops.length > 1 ? `<div class="spark" aria-label="Best set per session">${tops.map((v, k) => `<i style="height:${Math.max(10, v / max * 100)}%"${k === tops.length - 1 ? ' class="now"' : ''}></i>`).join('')}</div>` : `<p class="ins-hint">${db.claimed[c.n] ? 'Log it again to start a trend line.' : 'Log one set in any deck to claim this card.'}</p>`}
    </div>`;
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 240); };
  const lw = el('button', 'rghost ins-wo', `Log ${esc(c.ex)} in Workout instead`); lw.onclick = () => { close(); openWorkout(c.ex); };
  m.querySelector('.ins-sheet').append(lw);
  m.querySelector('.ins-x').onclick = close; m.addEventListener('click', e => { if (e.target === m) close(); });
  document.body.append(m); tilt(m.querySelector('.ins-card'), 12);
}

/* ---------- deck intro ---------- */
function renderDeck(d) {
  document.body.dataset.view = 'deck';
  root.innerHTML = '';
  const w = el('div', 'wrap');
  w.append(topBar(d.name, () => go('')));
  const sets = d.cards.reduce((a, n) => a + byN[n].sets, 0);
  const muscles = [...new Set(d.cards.flatMap(n => byN[n].m.split(' · ').slice(0, 2)))].slice(0, 6);
  w.append(el('div', 'deckmeta', `<span class="rchip on">${sets} sets</span><span class="rchip">~${deckMins(d)} min</span><span class="dm-mus">${esc(muscles.slice(0, 4).join(' · '))}</span>`));
  const sp = el('div', 'spread');
  sp.innerHTML = d.cards.map((n, k) => `<button class="deal tap" style="--i:${k}" data-n="${n}"><img loading="lazy" decoding="async" src="${img(n)}" alt="${esc(byN[n].t)}"><span class="glare"></span></button>`).join('');
  sp.querySelectorAll('.deal').forEach(b => { tilt(b, 8); b.onclick = () => openViewer(byN[b.dataset.n]); });
  w.append(sp);
  const plan = el('div', 'plan rp');
  plan.innerHTML = '<ul>' + d.cards.map(n => { const c = byN[n], l = lastLog(n);
    const top = l ? l.sets.reduce((a, x) => !a || score(c, ...x) > score(c, ...a) ? x : a, null) : null;
    return `<li><img loading="lazy" decoding="async" src="${img(n, 1)}" alt=""><span class="pl-body"><span class="nm">${esc(c.ex)}</span><span class="sub">${esc(c.t)}${top ? ` · last ${setTxt(c, top[0], top[1])}` : db.claimed[n] ? '' : ' · not claimed'}</span></span><span class="rx">${rx(c)}</span><button class="swap tap" data-slot="${d.cards.indexOf(n)}" aria-label="Swap ${esc(c.ex)}">${swapSvg}</button></li>`; }).join('') + '</ul>';
  plan.addEventListener('click', e => { const b = e.target.closest('.swap'); if (b) openSwap(d, +b.dataset.slot); });
  w.append(plan);
  if (d.cards.length < 6) { const add = el('button', 'rchip tap addcard', `+ Add a ${['', '', '', '', '5th', '6th'][d.cards.length] || ''} card`.replace('  ', ' '));
    add.onclick = () => openAdd(d); w.append(add); }
  const start = el('button', 'rbtn', active && active.deck === d.id ? 'Continue deck' : 'Start deck');
  start.onclick = () => {
    if (active && active.deck !== d.id) { confirmReplace(d); return; }
    if (!active) begin(d);
    go('play=1');
  };
  w.append(start);
  if (d.mine) { const del = el('button', 'rghost', 'Delete this deck'); del.style.color = '#B0685A';
    del.onclick = () => { db.mine = db.mine.filter(m => m.id !== d.id); save(true); applyDecks(); if (!db.mine.length) deckFilter = 'all'; go(''); toast('Deck deleted'); }; w.append(del); }
  else if (db.swaps[d.id] && Object.keys(db.swaps[d.id]).length) { const rs = el('button', 'rghost', 'Reset to the original cards');
    rs.onclick = () => { delete db.swaps[d.id]; save(true); applyDecks(); renderDeck(d); }; w.append(rs); }
  w.querySelectorAll('.plan li').forEach((li, k) => { li.classList.add('rise'); li.style.setProperty('--i', k); });
  root.append(w);
}
const shuffleSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>';
const gearSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
const logSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>';
// Opens SPYR's own Workout sheet. The two logs stay separate: nothing is copied either way.
function openWorkout(exercise) {
  if (embedded) { try { window.parent.postMessage({type: 'spyr:open-workout', exercise: exercise || null}, location.origin); return; } catch {} }
  toast('Opens SPYR’s Workout sheet inside the app');
}
const swapSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4L3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8"/></svg>';
function openSwap(d, slot) {
  const cur = byN[d.cards[slot]], g = primary(cur);
  const alts = CARDS.filter(c => c.n !== cur.n && !d.cards.includes(c.n) && (primary(c) === g || groupsOf(c).includes(g)))
    .sort((a, b) => (primary(b) === g) - (primary(a) === g) || (!!db.claimed[b.n]) - (!!db.claimed[a.n]));
  const m = el('div', 'sheet-wrap');
  m.innerHTML = `<div class="sheet2 rp"><div class="grab"></div><div class="lbl">Swap out</div><div class="rh sw-t">${esc(cur.ex)}</div>
    <div class="sw-sub">${alts.length} other ${GROUPS.find(x => x[0] === g)?.[1].toLowerCase() || ''} cards</div>
    <div class="sw-list">${alts.map(c => `<button class="sw-row tap" data-n="${c.n}"><img loading="lazy" decoding="async" src="${img(c.n, 1)}" alt=""><span><b>${esc(c.ex)}</b><em>${esc(c.t)} · ${rx(c)}</em></span>${db.foil[c.n] ? '<span class="tag pr">Foil</span>' : db.claimed[c.n] ? '<span class="tag">Claimed</span>' : ''}</button>`).join('')}</div></div>`;
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 220); };
  m.addEventListener('click', e => { const r = e.target.closest('.sw-row');
    if (r) { if (d.mine) { const mm = db.mine.find(x => x.id === d.id); mm.cards[slot] = r.dataset.n; } else if (d.daily) db.daily.cards[slot] = r.dataset.n; else (db.swaps[d.id] ||= {})[slot] = r.dataset.n;
      save(true); applyDecks(); close(); buzz(12); renderDeck(DECKS.find(x => x.id === d.id)); toast(`Swapped in ${byN[r.dataset.n].ex}`); return; }
    if (e.target === m) close(); });
  document.body.append(m);
}
// v52.54: add an extra card to a deck (a 5th or 6th exercise), muscles closest to the deck first
function openAdd(d) {
  const gs = new Set(d.cards.flatMap(n => groupsOf(byN[n])));
  const alts = CARDS.filter(c => !d.cards.includes(c.n)).map(c => ({c, k: groupsOf(c).filter(g => gs.has(g)).length}))
    .sort((a, b) => b.k - a.k || (!!db.claimed[b.c.n]) - (!!db.claimed[a.c.n])).map(x => x.c);
  const m = el('div', 'sheet-wrap');
  m.innerHTML = `<div class="sheet2 rp"><div class="grab"></div><div class="lbl">Add to ${esc(d.name)}</div><div class="rh sw-t">Pick a card</div>
    <div class="sw-sub">Best matches for this deck first</div>
    <div class="sw-list">${alts.map(c => `<button class="sw-row tap" data-n="${c.n}"><img loading="lazy" decoding="async" src="${img(c.n, 1)}" alt=""><span><b>${esc(c.ex)}</b><em>${esc(c.t)} · ${rx(c)}</em></span>${db.foil[c.n] ? '<span class="tag pr">Foil</span>' : db.claimed[c.n] ? '<span class="tag">Claimed</span>' : ''}</button>`).join('')}</div></div>`;
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 220); };
  m.addEventListener('click', e => { const r = e.target.closest('.sw-row');
    if (r) { const n = r.dataset.n;
      if (d.mine) db.mine.find(x => x.id === d.id).cards.push(n); else if (d.daily) db.daily.cards.push(n);
      else { const sw = (db.swaps[d.id] ||= {}); let i = BASE[d.id].length; while (sw[i]) i++; sw[i] = n; }
      save(true); applyDecks(); close(); buzz(12); renderDeck(DECKS.find(x => x.id === d.id)); toast(`Added ${byN[n].ex}`); return; }
    if (e.target === m) close(); });
  document.body.append(m);
}
function confirmReplace(d) {
  const m = el('div', 'modal'); const box = el('div', 'box rp');
  box.innerHTML = `<h2>Start a new deck?</h2><p>Your ${esc(DECKS.find(x => x.id === active.deck)?.name || '')} session is still open. Starting this one ends it without saving.</p>`;
  const cta = el('div', 'btn-row'); const keep = el('button', 'rbtn2', 'Keep it'); const yes = el('button', 'rbtn', 'Start new');
  keep.onclick = () => m.remove(); yes.onclick = () => { m.remove(); begin(d); go('play=1'); };
  cta.append(keep, yes); box.append(cta); m.append(box); document.body.append(m);
}
const freshSets = n => { const c = byN[n], l = lastLog(n);
  return Array.from({length: c.sets}, (_, i) => { const p = l && l.sets[Math.min(i, l.sets.length - 1)];
    return {w: p ? p[0] : 0, r: p ? p[1] : (c.target || parseInt(c.reps) || 8), done: false, pr: false}; }); };
function begin(d) {
  const sets = {};
  d.cards.forEach(n => { sets[n] = freshSets(n); });
  active = {deck: d.id, idx: 0, start: Date.now(), sets, claimedNow: [], prNow: []};
  write(ACTIVE, active);
}
// a card added (or swapped in) while this deck's session is open gets its sets too
function fitSets(d) { if (!active) return; d.cards.forEach(n => { if (!active.sets[n] && byN[n]) active.sets[n] = freshSets(n); }); if (active.idx >= d.cards.length) active.idx = d.cards.length - 1; }

/* ---------- play ---------- */
let flipped = false, timer = null, tick = 0, hold = null;
/* v52.53: sane limits on what can be typed (weights are stored in lb) and a guard so a double tap logs one set */
const clampW = v => Math.min(1500, Math.max(0, +v || 0));
const clampR = (c, v) => Math.min(c.mode === 'time' ? 600 : c.mode === 'distance' ? 1000 : 100, Math.max(0, Math.round(+v || 0)));
let lastTap = 0; const once = () => { const t = Date.now(); if (t - lastTap < 450) return false; lastTap = t; return true; };
const persist = () => write(ACTIVE, active);
function stopTick() { clearInterval(tick); tick = 0; hold = null; }

function renderPlay() {
  const d = DECKS.find(x => x.id === active.deck); if (!d) { write(ACTIVE, null); active = null; return go(''); }
  fitSets(d);
  document.body.dataset.view = 'play';
  awake(true);
  root.innerHTML = `<div class="play">
    <div class="play-top"><button class="round tap" id="close" aria-label="Leave deck">${xSvg}</button><div class="pips" id="pips"></div><span class="clock" id="clock">0:00</span></div>
    <div class="stage" id="stage"><div class="peek" id="peek"><img id="peekImg" alt=""></div><div class="card" id="card"><div class="card-in">
      <div class="hold" id="hold" hidden><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="h-bg"/><circle cx="60" cy="60" r="52" class="h-fg" id="holdArc"/></svg><div class="h-txt"><b id="holdT">0</b><span id="holdL">Get set</span></div><button class="rbtn2 h-stop" id="holdStop">Stop and log</button></div>
      <div class="face front"><img id="art" alt=""><span class="foil-fx"></span><span class="glare"></span><span class="foil-tag">PR FOIL</span></div>
      <div class="face rear" id="sheet"></div></div>
      <div class="rest-ov" id="restOv" hidden><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="r-bg"/><circle cx="60" cy="60" r="54" class="r-fg" id="restArc"/></svg>
        <div class="r-txt"><span class="lbl">Rest</span><b id="restBig">0:00</b><span class="r-next" id="restNext"></span></div>
        <div class="r-acts"><button class="tap" id="add15b">+15s</button><button class="tap" id="skipb">Skip</button></div></div></div></div>
    <div class="dock rp">
      <div class="restbar" id="rest" hidden><div class="rb-fill" id="restFill"></div><span class="l">Rest</span><span class="t" id="restT">0:00</span><button id="add15">+15s</button><button id="skip">Skip</button></div>
      <div class="quick" id="quick"></div>
      <div class="acts"><button class="rbtn2" id="prev" aria-label="Previous card">‹</button><button class="rbtn2 flipb" id="flip">Edit sets</button><button class="rbtn2" id="next">Next ›</button></div>
    </div></div>`;
  $('#close').onclick = leave;
  $('#flip').onclick = () => { flipped = !flipped; paint(); };
  $('#prev').onclick = () => once() && move(-1);
  $('#next').onclick = () => once() && move(1);
  $('#add15').onclick = () => { if (timer) { timer.end += 15000; timer.total += 15000; } };
  $('#skip').onclick = () => { timer = null; paintRest(); };
  $('#add15b').onclick = () => { if (timer) { timer.end += 15000; timer.total += 15000; } paintRest(); };
  $('#skipb').onclick = () => { timer = null; paintRest(); };
  $('.front').onclick = () => { if (!swipe.moved) { flipped = true; paint(); } };
  bindSheet(); bindSwipe();
  $('#quick').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b) return;
    const d = DECKS.find(x => x.id === active.deck), n = d.cards[active.idx];
    if (b.dataset.q === 'next') return once() && move(1);
    if (/^[wr][+-]$/.test(b.dataset.q)) { const c = byN[n], s = active.sets[n], i = s.findIndex(x => !x.done); if (i < 0) return;
      const stepR = c.mode === 'distance' || c.mode === 'time' ? 5 : 1, p0 = s[i].w;
      if (b.dataset.q === 'w-') s[i].w = clampW(fromU(Math.max(0, toU(s[i].w) - stepU()))); if (b.dataset.q === 'w+') s[i].w = clampW(fromU(toU(s[i].w) + stepU()));
      if (b.dataset.q === 'r-') s[i].r = clampR(c, s[i].r - stepR); if (b.dataset.q === 'r+') s[i].r = clampR(c, s[i].r + stepR);
      if (b.dataset.q[0] === 'w') fill(s, i, p0); buzz(6); persist(); paint(); return; }
    if (b.dataset.q === 'hold') { if (hold) return; const i = active.sets[n].findIndex(x => !x.done); timer = null; paintRest(); hold = {n, i, target: active.sets[n][i].r, t0: Date.now() + 3000, beeped: 0}; $('#hold').hidden = false; buzz(15); return; }
    if (b.dataset.q === 'edit') { flipped = true; paint(); setTimeout(() => { const f = document.querySelector('.set:not(.done) input[data-f=w]'); f && f.focus({preventScroll: true}); f && f.select(); }, 560); return; }
    if (!once()) return; const i = active.sets[n].findIndex(x => !x.done); if (i >= 0) { markDone(n, i); persist(); paint(); } });
  $('#quick').addEventListener('change', e => { const inp = e.target.closest('input[data-qf]'); if (!inp) return;
    const d = DECKS.find(x => x.id === active.deck), n = d.cards[active.idx], s = active.sets[n], i = s.findIndex(x => !x.done); if (i < 0) return;
    const v = Math.max(0, parseFloat(inp.value) || 0), p0 = s[i].w;
    const c = byN[n]; if (inp.dataset.qf === 'w') { s[i].w = clampW(fromU(v)); fill(s, i, p0); } else s[i].r = clampR(c, v);
    persist(); paint(); });
  $('#quick').addEventListener('focusin', e => { const inp = e.target.closest('input[data-qf]'); if (inp) setTimeout(() => inp.select(), 0); });
  $('#holdStop').onclick = () => finishHold(true);
  tick = setInterval(() => { $('#clock') && ($('#clock').textContent = fmt((Date.now() - active.start) / 1000)); paintRest(); paintHold(); }, 100);
  paint();
}

function paint(dir) {
  const d = DECKS.find(x => x.id === active.deck), n = d.cards[active.idx], c = byN[n];
  document.documentElement.style.setProperty('--accent', c.acc);
  $('#pips').innerHTML = d.cards.map((m, i) => `<i class="${i === active.idx ? 'on' : active.sets[m].every(s => s.done) ? 'done' : ''}"></i>`).join('');
  $('#art').src = img(n); $('#art').alt = `${c.n} ${c.t}`;
  const nxt = d.cards[active.idx + 1]; $('#peek').hidden = !nxt; if (nxt) $('#peekImg').src = img(nxt);
  const card = $('#card');
  card.classList.toggle('flipped', flipped);
  card.classList.toggle('foil', !!db.foil[n]);
  if (dir && !calm) { card.classList.remove('slide-l', 'slide-r', 'arrive'); void card.offsetWidth; card.classList.add(dir < 0 ? 'slide-l' : 'arrive'); }
  const s = active.sets[n];
  const i = s.findIndex(x => !x.done), last = active.idx === d.cards.length - 1;
  const head = i >= 0 ? `<div class="c-head"><span class="lbl">Set ${i + 1} of ${s.length}</span>${qHint(c, n, i, s[i])}</div>` : '';
  const stepper = (k, val, unit, label) => `<div class="c-step"><button class="tap" data-q="${k}-" aria-label="Less ${label}">−</button>
      <label class="c-val${String(val).length > 4 ? ' long' : ''}"><input data-qf="${k}" type="number" inputmode="${k === 'w' ? 'decimal' : 'numeric'}" step="any" value="${val}" aria-label="${label}"><em>${unit}</em></label>
      <button class="tap" data-q="${k}+" aria-label="More ${label}">+</button></div>`;
  const noWeight = !noW(c) && c.mode !== 'added' && i >= 0 && s[i].w === 0, noReps = i >= 0 && c.mode !== 'time' && !(s[i].r > 0);
  $('#quick').innerHTML = i >= 0 && c.mode === 'time'
    ? `${head}<div class="c-row">${stepper('r', s[i].r, c.side ? 'sec/side' : 'sec', 'Seconds')}<button class="rbtn c-go" data-q="hold">${playSvg}<span>Start</span></button></div>`
    : i >= 0
    ? `${head}<div class="c-row">${noW(c) ? '' : stepper('w', toU(s[i].w), unitOf(c), 'Weight')}${stepper('r', s[i].r, c.mode === 'distance' ? 'm' : c.side ? 'reps/side' : 'reps', c.mode === 'distance' ? 'Metres' : 'Reps')}
        <button class="rbtn c-go" data-q="done" ${noWeight || noReps ? 'disabled' : ''} aria-label="Set ${i + 1} done">${tickSvg}</button></div>${noWeight ? `<div class="c-tip">${(db.logs[n] || []).length ? 'Set the weight, then tap ✓' : 'First time: pick a weight you can lift with good form, then tap ✓'}</div>` : ''}`
    : `<div class="c-row done"><div class="c-ok"><span class="lbl">${esc(c.ex)}</span><b>All ${s.length} sets done</b></div><button class="rbtn c-next" data-q="next"><span>${last ? 'Finish deck' : 'Next card'}</span></button></div>`;
  $('#flip').textContent = flipped ? 'Show card' : 'Edit sets';
  $('#prev').disabled = active.idx === 0;
  $('#next').textContent = active.idx === d.cards.length - 1 ? 'Finish' : 'Next ›';
  paintSheet(n); paintRest();
}

function qHint(c, n, i, x) {
  const l = lastLog(n), prev = l && l.sets[Math.min(i, l.sets.length - 1)];
  const bits = [];
  if (prev) bits.push(`Last ${setTxt(c, ...prev)}`);
  if (isBarbell(c) && toU(x.w) >= (KG() ? 20 : 45)) { const p = plates(x.w); if (p) bits.push(p); }
  return bits.length ? `<span class="q-hint">${bits.map(esc).join(' · ')}</span>` : '';
}

function paintSheet(n) {
  const c = byN[n], s = active.sets[n], l = lastLog(n);
  const lastTxt = l ? `<span class="lbl">Last time · ${prettyDate(l.d)}</span>${l.sets.map(([w, r]) => `<b>${setTxt(c, w, r)}</b>`).join('')}` : `<span class="lbl">First time</span>${noW(c) ? 'Log what you can do with good form.' : 'Pick a weight you can do with good form.'} Your first set claims this card.`;
  $('#sheet').innerHTML = `<div class="sh-head"><span class="num">${c.n}</span><span class="sh-title">${esc(c.t)}</span></div>
   <div class="sh-body">
    <div class="ex">${esc(c.ex)}<small>${rx(c)} · rest ${fmt(c.rest)} · ${esc(c.m)}</small></div>
    <div class="last">${lastTxt}</div>
    <details class="cuebox"${l ? '' : ' open'}><summary>Form cues</summary><div class="cues">${c.cues.map((q, i) => `<div><i>${i + 1}</i><span>${esc(q)}</span></div>`).join('')}</div>
    ${c.safety ? `<div class="safety">${esc(c.safety)}</div>` : ''}</details>
    <div class="sets${noW(c) ? ' one' : ''}"><div class="sets-hd"><span></span>${noW(c) ? '' : `<span>${unitOf(c)}</span>`}<span>${repWord(c)}</span><span></span></div>
    ${s.map((x, i) => `<div class="set${x.done ? ' done' : ''}${x.pr ? ' pr' : ''}" data-i="${i}"><span class="n">${x.pr ? '★' : i + 1}</span>
      ${noW(c) ? '' : `<div class="step"><button data-a="w-" aria-label="Less weight">−</button><input id="w-${n}-${i}" data-f="w" type="number" inputmode="decimal" step="any" value="${toU(x.w)}" aria-label="Set ${i + 1} weight"><button data-a="w+" aria-label="More weight">+</button></div>`}
      <div class="step"><button data-a="r-" aria-label="Fewer">−</button><input id="r-${n}-${i}" data-f="r" type="number" inputmode="numeric" value="${x.r}" aria-label="Set ${i + 1} ${repWord(c)}"><button data-a="r+" aria-label="More">+</button></div>
      <button class="chk" data-a="done" aria-label="Mark set ${i + 1} done">${tickSvg}</button></div>`).join('')}</div>
    <div class="set-acts"><button class="rchip tap" data-a="add">+ Add set</button><button class="rchip tap" data-a="del">− Remove set</button></div>
   </div>`;
}

// copy a set's weight into later sets that are still empty
const fill = (s, i, prev) => s.forEach((x, j) => { if (j > i && !x.done && (x.w === 0 || x.w === prev)) x.w = s[i].w; });

function markDone(n, i) {
  const c = byN[n], s = active.sets[n];
  s[i].done = true; s[i].pr = false; active.lastAt = Date.now();
  const hadHistory = (db.logs[n] || []).length > 0;
  const prior = Math.max(best(n), ...s.filter((x, j) => j !== i && x.pr).map(x => score(c, x.w, x.r)));
  if (hadHistory && score(c, s[i].w, s[i].r) > prior + 1e-6 && (s[i].w > 0 || s[i].r > 0)) {
    s[i].pr = true; if (!active.prNow.includes(n)) active.prNow.push(n);
    reveal(n, 'pr', `${setTxt(c, s[i].w, s[i].r)} · beat your best`);
  } else if (!db.claimed[n] && !active.claimedNow.includes(n)) {
    active.claimedNow.push(n); reveal(n, 'claim', `${c.ex} · added to your collection`);
  }
  // carry the numbers forward to the next open set when it still has the defaults
  const nx = s.find((x, j) => j > i && !x.done); if (nx && hadHistory === false && nx.w === 0) nx.w = s[i].w;
  timer = {end: Date.now() + c.rest * 1000, total: c.rest * 1000, rung: false};
  if (!s[i].pr && !(active.claimedNow.at(-1) === n && !db.claimed[n] && s.filter(x => x.done).length === 1)) buzz(18);
}

function bindSheet() {
  const sh = $('#sheet');
  sh.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const d = DECKS.find(x => x.id === active.deck), n = d.cards[active.idx], c = byN[n], s = active.sets[n];
    const row = b.closest('.set'), i = row ? +row.dataset.i : -1;
    const stepW = 5, stepR = c.mode === 'distance' || c.mode === 'time' ? 5 : 1;
    switch (b.dataset.a) {
      case 'w-': { const p0 = s[i].w; s[i].w = clampW(fromU(Math.max(0, toU(s[i].w) - stepU()))); fill(s, i, p0); break; }
      case 'w+': { const p0 = s[i].w; s[i].w = clampW(fromU(toU(s[i].w) + stepU())); fill(s, i, p0); break; }
      case 'r-': s[i].r = clampR(c, s[i].r - stepR); break;
      case 'r+': s[i].r = clampR(c, s[i].r + stepR); break;
      case 'add': { const l = s.at(-1) || {w: 0, r: 8}; s.push({w: l.w, r: l.r, done: false, pr: false}); break; }
      case 'del': if (s.length > 1) s.pop(); break;
      case 'done': {
        if (s[i].done) { s[i].done = false; s[i].pr = false; } else { if (!once()) return; markDone(n, i); }
        break; }
    }
    persist(); paint();
  });
  sh.addEventListener('change', e => {
    const inp = e.target.closest('input[data-f]'); if (!inp) return;
    const d = DECKS.find(x => x.id === active.deck), n = d.cards[active.idx];
    const i = +inp.closest('.set').dataset.i, p0 = active.sets[n][i].w, v = Math.max(0, parseFloat(inp.value) || 0); active.sets[n][i][inp.dataset.f] = inp.dataset.f === 'w' ? clampW(fromU(v)) : clampR(byN[n], v);
    if (inp.dataset.f === 'w') fill(active.sets[n], i, p0); persist(); paint();
  });
}

function paintHold() {
  const h = $('#hold'); if (!h || !hold) return;
  const now = Date.now(), lead = (hold.t0 - now) / 1000, el2 = (now - hold.t0) / 1000;
  if (lead > 0) { $('#holdT').textContent = Math.ceil(lead); $('#holdL').textContent = 'Get set'; $('#holdArc').style.strokeDashoffset = 327;
    if (hold.beeped !== Math.ceil(lead)) { hold.beeped = Math.ceil(lead); buzz(10); } return; }
  const left = Math.max(0, hold.target - el2);
  $('#holdT').textContent = Math.ceil(left); $('#holdL').textContent = 'Hold';
  $('#holdArc').style.strokeDashoffset = 327 * (left / hold.target);
  if (left <= 0) finishHold(false);
}
function finishHold(early) {
  if (!hold) return; const {n, i, target, t0} = hold; const done = Math.max(0, Math.round((Date.now() - t0) / 1000));
  hold = null; $('#hold').hidden = true;
  if (early && done < 1) return;
  active.sets[n][i].r = early ? Math.min(done, target) : target; chime(); markDone(n, i); persist(); paint();
}

function paintRest() {
  const r = $('#rest'); if (!r) return;
  const ov = $('#restOv');
  if (!timer) { r.hidden = true; if (ov && !ov.hidden) { ov.hidden = true; $('#card').classList.remove('resting'); } return; }
  r.hidden = !flipped;
  if (ov && flipped) { if (!ov.hidden) { ov.hidden = true; $('#card').classList.remove('resting'); } }
  else if (ov) { const left0 = (timer.end - Date.now()) / 1000; ov.hidden = false; $('#card').classList.add('resting');
    $('#restBig').textContent = left0 > 0 ? fmt(Math.ceil(left0)) : 'Go';
    $('#restArc').style.strokeDashoffset = 339.3 * Math.min(1, Math.max(0, 1 - left0 * 1000 / timer.total));
    ov.classList.toggle('over', left0 <= 0);
    const d = DECKS.find(x => x.id === active.deck), n = d.cards[active.idx], c = byN[n], s = active.sets[n], i = s.findIndex(x => !x.done);
    $('#restNext').textContent = i >= 0 ? `Next · set ${i + 1}: ${setTxt(c, s[i].w, s[i].r)}` : (active.idx < d.cards.length - 1 ? 'Card done · next card →' : 'Deck done · tap Finish'); }
  const left = Math.ceil((timer.end - Date.now()) / 1000);
  r.classList.toggle('over', left <= 0);
  $('#restT').textContent = left > 0 ? fmt(left) : 'Go';
  $('#restFill').style.width = Math.min(100, Math.max(0, 100 * (1 - (timer.end - Date.now()) / timer.total))) + '%';
  if (left <= 0 && !timer.rung) { timer.rung = true; chime(); buzz([120, 60, 120]); }
  if (left < -20) { timer = null; r.hidden = true; }
}

function move(dir) {
  const d = DECKS.find(x => x.id === active.deck);
  if (active.idx + dir >= d.cards.length) return openSummary();
  if (active.idx + dir < 0) return;
  active.idx += dir; flipped = false; persist(); paint(dir);
}

const swipe = {x: 0, y: 0, on: false, moved: false, dx: 0};
function bindSwipe() {
  const st = $('#stage');
  tilt($('.front'), 7);
  st.addEventListener('pointerdown', e => { if (e.target.closest('input,button,summary') || flipped) return; swipe.on = true; swipe.moved = false; swipe.dx = 0; swipe.x = e.clientX; swipe.y = e.clientY; });
  st.addEventListener('pointermove', e => { if (!swipe.on) return; const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    if (!swipe.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { swipe.moved = true; $('#card').classList.add('dragging'); try { st.setPointerCapture(e.pointerId); } catch {} }
    if (swipe.moved) { swipe.dx = dx; $('#card').style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; $('#peek').style.setProperty('--p', Math.min(1, Math.abs(dx) / 160)); } });
  const end = () => { if (!swipe.on) return; swipe.on = false; const card = $('#card'), dx = swipe.dx;
    card.classList.remove('dragging'); $('#peek').style.setProperty('--p', 0);
    if (swipe.moved && Math.abs(dx) > 90) {
      const dir = dx < 0 ? 1 : -1, d = DECKS.find(x => x.id === active.deck);
      if ((dir < 0 && active.idx === 0)) { card.style.transform = ''; }
      else if (dir > 0 && active.idx === d.cards.length - 1) { card.style.transform = ''; openSummary(); }
      else { card.classList.add('fly'); card.style.transform = `translateX(${dx < 0 ? -130 : 130}vw) rotate(${dx < 0 ? -24 : 24}deg)`;
        setTimeout(() => { card.classList.remove('fly'); card.style.transform = ''; move(dir); }, calm ? 0 : 230); }
    } else card.style.transform = '';
    setTimeout(() => swipe.moved = false, 0); };
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
}

function leave() {
  const m = el('div', 'modal'); const box = el('div', 'box rp');
  box.innerHTML = `<h2>Leave this deck?</h2><p>Your sets are kept. Pick it up from the Archive any time.</p>`;
  const cta = el('div', 'btn-row'); const stay = el('button', 'rbtn2', 'Stay'); const go2 = el('button', 'rbtn', 'Leave for now');
  stay.onclick = () => m.remove(); go2.onclick = () => { m.remove(); go(''); };
  const end = el('button', 'rghost', 'End deck without saving'); end.style.color = '#B0685A';
  end.onclick = () => { m.remove(); active = null; write(ACTIVE, null); timer = null; go(''); };
  cta.append(stay, go2); box.append(cta, end); m.append(box); document.body.append(m);
}

/* ---------- summary + save ---------- */
function openSummary() {
  const d = DECKS.find(x => x.id === active.deck);
  let sets = 0, vol = 0;
  let skipped = 0;
  const rows = d.cards.map(n => { const c = byN[n], s = active.sets[n].filter(x => x.done); sets += s.length; if (!s.length) { skipped++; return ''; }
    s.forEach(x => { if (c.mode === 'weight' || c.mode === 'added') vol += x.w * x.r * (c.each ? 2 : 1); });
    const top = s.reduce((a, x) => !a || score(c, x.w, x.r) > score(c, a.w, a.r) ? x : a, null);
    const tag = active.prNow.includes(n) ? '<span class="tag pr">PR</span>' : active.claimedNow.includes(n) ? '<span class="tag">Claimed</span>' : '';
    return `<div class="srow"><img loading="lazy" decoding="async" src="${img(n, 1)}" alt=""><div><div class="nm">${esc(c.t)}</div><div class="dt">${s.length ? `${s.length} set${s.length === 1 ? '' : 's'} · top ${setTxt(c, top.w, top.r)}` : 'Not logged'}</div></div>${tag}</div>`; }).join('');
  const m = el('div', 'modal'); const box = el('div', 'box rp');
  box.innerHTML = `<div class="lbl">Deck complete</div><h2>${esc(d.name)}</h2><div class="lbl" style="letter-spacing:.04em;text-transform:none">${fmt((Date.now() - active.start) / 1000)} · ${prettyDate(today())}</div>
    <div class="totals"><div><b data-to="${sets}">0</b><span>Sets</span></div><div><b data-to="${Math.round(toU(vol))}">0</b><span>${U()} moved</span></div><div><b data-to="${active.prNow.length}">0</b><span>PRs</span></div></div>
    ${active.claimedNow.length + active.prNow.length ? `<div class="earned"><span class="lbl">Earned this deck</span><div class="earned-row">${[...new Set([...active.prNow, ...active.claimedNow])].map((n, k) => `<span class="e${active.prNow.includes(n) ? ' foil' : ''}" style="--i:${k}"><img loading="lazy" decoding="async" src="${img(n, 1)}" alt="${esc(byN[n].t)}"><span class="foil-fx"></span></span>`).join('')}</div></div>` : ''}${rows}${skipped ? `<div class="srow skip"><span class="sk-n">${skipped}</span><div><div class="nm">${skipped} card${skipped > 1 ? 's' : ''} skipped</div><div class="dt">Not logged this time · they stay in the deck</div></div></div>` : ''}`;
  const cta = el('div', 'btn-row'); const back = el('button', 'rbtn2', 'Keep logging'); const ok = el('button', 'rbtn', sets ? 'Save deck' : 'End deck');
  back.onclick = () => m.remove();
  /* v52.53: a deck with no sets ticked saves nothing (no minutes, no streak day) */
  ok.onclick = () => { m.remove(); if (!sets) { active = null; write(ACTIVE, null); timer = null; go(''); setTimeout(() => toast('Nothing logged · deck ended'), 50); return; } commit(d, sets); };
  cta.append(back, ok); box.append(cta); m.append(box); document.body.append(m);
  box.querySelectorAll('[data-to]').forEach(b => countUp(b, +b.dataset.to));
}

function commit(d, sets) {
  if (!d.cards.some(n => active.sets[n].some(x => x.done))) return;
  /* a deck left open counts until 10 minutes after the last ticked set, never longer than 4 hours (same rule as Workout) */
  const now = Date.now(), stop = Math.min(now, (active.lastAt || now) + 10 * 60000);
  const date = today(), elapsed = Math.max(60, Math.min(4 * 3600, Math.round((stop - active.start) / 1000))), records = [];
  const WO = window.SPYR_CARD_WORKOUT || {};
  d.cards.forEach(n => { const s = active.sets[n].filter(x => x.done); if (!s.length) return;
    (db.logs[n] ||= []).push({d: date, sets: s.map(x => [x.w, x.r]), id: active.start + ':' + n, at: now});
    db.claimed[n] = true; if (active.prNow.includes(n)) db.foil[n] = true;
    const c = byN[n];
    const spec = WO[n], k = c.mode === 'bw' || c.mode === 'added' ? 'bw' : c.mode === 'time' ? 's' : 'w';
    records.push({card: n, exercise: c.ex, name: c.ex.charAt(0).toUpperCase() + c.ex.slice(1), base: typeof spec === 'string' ? spec : null,
      mus: Array.isArray(spec) ? spec : null, k, mode: c.mode || 'weight', sets: s.map(x => [x.w, x.r]), pr: active.prNow.includes(n)}); });
  db.decks[d.id] = date; (db.days[date] ||= []).includes(d.id) || db.days[date].push(d.id); save();
  const record = {logId: 'archive-' + active.start, date, start: active.start, title: `Iron Archive · ${d.name}`, deck: d.name, trainer: 'archive', trainerName: 'Iron Archive', elapsed, complete: true, stamp: now, records, pid: PID || null};
  try { if (embedded) window.parent.postMessage({type: 'spyr:gym-complete', record}, location.origin); } catch {}
  try { const k = 'spyr:gym:completions'; const list = read(k, []); if (!list.some(r => r.logId === record.logId)) { list.push(record); write(k, list.slice(-200)); } } catch {}
  const prs = active.prNow.length, claimed = active.claimedNow.length;
  active = null; write(ACTIVE, null); timer = null;
  go('');
  setTimeout(() => toast(prs ? `Saved · ${prs} new foil card${prs > 1 ? 's' : ''}` : claimed ? `Saved · ${claimed} card${claimed > 1 ? 's' : ''} claimed` : `Saved · ${sets} set${sets === 1 ? "" : "s"}`, prs > 0), 50);
}

document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') return; if (document.body.dataset.view === 'play') awake(true); else pull(rerender); });
const rerender = () => { if (document.body.dataset.view !== 'play' && !document.querySelector('.modal,.inspect,.sheet-wrap')) route(); };
route();
pull(rerender); // bring in progress from your other phones
/* v52.54: check for new card sets (quietly; offline keeps the last copy) */
(async () => {
  try { if (!STORE || !STORE.sets) return; const data = await STORE.sets(); if (!data) return; const sig2 = JSON.stringify(data); if (sig2 === setsSig) return;
    setsSig = sig2; try { localStorage.setItem(SETS_CACHE, sig2); } catch {}
    const n = addSets(data); DECKS.forEach(d => { if (!d.mine && !d.daily && !BASE[d.id]) BASE[d.id] = d.cards.slice(); });
    if (n) { applyDecks(); rerender(); toast(`${n} new card${n > 1 ? 's' : ''} in the Archive`); }
  } catch {}
})();
})();
