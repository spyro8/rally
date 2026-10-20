/* SPYR Meditation Space (v52.55)
   The living garden (scene.js, from the Breathe handoff) on top; guided meditations, journeys,
   music and a sitting timer below. Opened from Breathe inside SPYR's room overlay.
   Minutes you actually listen or sit are sent to SPYR's Meditation habit. */
import { SanctuaryScene } from './scene.js?v=1';

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const embedded = window.parent !== window;
const audio = $('#audio'), bed = $('#bed');
const PREFS = 'spyr-sanctuary';
let prefs = {}; try { prefs = JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; } catch { prefs = {}; }
const savePrefs = () => { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch {} };

const ICON = {
  play: '<path d="M8 5v14l11-7z"/>', pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  rain: '<path d="M7 17a4 4 0 0 1-.6-8A6 6 0 0 1 18 9.5a3.5 3.5 0 0 1-.5 7"/><path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2"/>'
};
const svg = (k, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true"${fill ? ' style="fill:currentColor;stroke:none"' : ''}>${ICON[k]}</svg>`;

/* ---------- words for each track (titles come from the audio files) ---------- */
const BLURB = {
  'guided-notice': 'Your first practice. Notice, wander, return.',
  'guided-awareness-without-judgment': 'Let thoughts and feelings pass without grading them.',
  'guided-the-gentle-body-scan': 'Move slowly from head to feet, softening as you go.',
  'guided-the-practice-of-returning': 'Every time the mind drifts, come back. That is the practice.',
  'journeys-the-floating-city-above-the-clouds': 'Drift through a quiet city among the clouds.',
  'journeys-the-garden-of-forgotten-seasons': 'Walk a stone path through a garden outside of time.',
  'journeys-the-library-of-unwritten-days': 'Step in from the rain to a room of blank pages.',
  'journeys-the-observatory-beyond-time': 'Watch the sky from a place where time slows down.'
};
/* every track gets its own corner of the garden (pixel crops in art/c, day and night versions) */
const ART = {
  'guided-notice': 'monk', 'guided-awareness-without-judgment': 'rlantern', 'guided-the-gentle-body-scan': 'stones', 'guided-the-practice-of-returning': 'fountain',
  'journeys-the-floating-city-above-the-clouds': 'gate', 'journeys-the-garden-of-forgotten-seasons': 'cherry', 'journeys-the-library-of-unwritten-days': 'hlantern', 'journeys-the-observatory-beyond-time': 'gate:n'
};
const MUSIC_ART = ['pond', 'bamboo', 'slantern', 'cat', 'flantern', 'pine', 'cherry:n', 'fountain:n', 'hlantern:n', 'bamboo:n', 'stones:n', 'rlantern:n', 'slantern:n', 'cat:n', 'pond:n', 'pine:n', 'flantern:n'];
/* the garden matches what's playing: rain for rain tracks, night for the stars */
const MOOD = { 'music-where-the-rain-rests': { rain: true }, 'music-tropical-greenhouse-rain': { rain: true }, 'journeys-the-library-of-unwritten-days': { rain: true }, 'journeys-the-observatory-beyond-time': { night: true }, 'music-frozen-sky-calm': { night: true } };
const artOf = (t) => ART[t.id] || (t.cat === 'music' ? MUSIC_ART[Math.max(0, TRACKS.filter((x) => x.cat === 'music').indexOf(t)) % MUSIC_ART.length] : 'monk');
const pic = (name) => { const [n, f] = String(name).split(':'); return `art/c/${n}-${f === 'n' || night ? 'n' : 'd'}.webp`; };
const LANTERN = '<svg viewBox="0 0 20 28" aria-hidden="true"><path class="lt-hook" d="M10 0v2.5" fill="none" stroke-width="1.6"/><path class="lt-roof" d="M1 6.5L10 2l9 4.5z"/><rect class="lt-roof" x="2" y="5.5" width="16" height="2" rx="1"/><rect class="lt-body" x="4" y="7.5" width="12" height="15" rx="2"/><rect class="lt-glass" x="6.5" y="10" width="7" height="10" rx="1"/><rect class="lt-roof" x="5" y="22.5" width="10" height="3" rx="1"/></svg>';
const ORDER = ['guided-notice', 'guided-awareness-without-judgment', 'guided-the-gentle-body-scan', 'guided-the-practice-of-returning'];
const NOTE = {
  guided: 'A calm voice talks you through it, with quiet stretches to practise on your own.',
  journeys: 'Close your eyes and let a story carry you somewhere peaceful.',
  music: 'No words. Sit, breathe, or let it play while you rest.'
};
const KIND = { guided: ['Guided meditation', 'var(--lantern)'], journeys: ['Immersive journey', 'var(--blossom)'], music: ['Music', 'var(--pond)'], timer: ['Sitting', 'var(--paper)'] };

const mmss = (s) => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
const mins = (s) => `${Math.max(1, Math.round(s / 60))} min`;
const nums = (s) => esc(s).replace(/\d+/g, '<span class="num">$&</span>'); // IM Fell's old-style figures look like letters
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- you (read from SPYR on this phone; nothing leaves it) ---------- */
let me = null; try { const id = JSON.parse(localStorage.getItem('rt1:me') || 'null')?.id; if (id) me = JSON.parse(localStorage.getItem('rt1:meCache:' + id) || 'null'); } catch {}
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let todayMin = Number(me?.logs?.[localDay()]?.meditation) || 0;
const hour = new Date().getHours();
const greet = hour < 5 ? 'Still awake' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
const first = (me?.name || '').trim().split(/\s+/)[0];
$('#hello').textContent = 'Your quiet place.'; $('#lede').textContent = first ? `${greet}, ${first}. Set the world down for a while.` : 'Set the world down for a while.';
function paintToday() {
  const d0 = new Date(), dow = (d0.getDay() + 6) % 7, days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(d0); d.setDate(d0.getDate() - dow + i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const m = i === dow ? todayMin : Number(me?.logs?.[k]?.meditation) || 0; days.push({ l: 'MTWTFSS'[i], lit: m > 0, today: i === dow, future: i > dow }); }
  $('#week').innerHTML = days.map((x) => `<div class="wk${x.lit ? ' lit' : ''}${x.today ? ' today' : ''}">${LANTERN}<span>${x.l}</span></div>`).join('');
  const n = days.filter((x) => x.lit).length;
  $('#today').innerHTML = todayMin ? `<b>${todayMin} min</b> today${n > 1 ? `, and you've sat ${n} days this week` : ''}` : n ? `You've sat ${n} day${n > 1 ? 's' : ''} this week. Light today's lantern.` : 'Light a lantern for each day you sit.';
}
paintToday();

/* ---------- the garden ---------- */
const autoNight = hour >= 19 || hour < 6;
let night = prefs.night ?? autoNight, raining = !!prefs.raining;
let reduced = prefs.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new SanctuaryScene($('#scene'));
let sceneOk = false; scene.loaded.then(() => { sceneOk = true; draw(performance.now()); }).catch(() => {});
const draw = (t) => { if (sceneOk) scene.render(t, { night, raining, reduced }); };
let last = 0, raf = 0;
const frame = (t) => { raf = requestAnimationFrame(frame); if (document.hidden) return; if (t - last > 41) { last = t; draw(t); } };
raf = requestAnimationFrame(frame);
function paintWeather() {
  document.body.classList.toggle('night', night);
  $$('[data-art]').forEach((im) => { im.src = pic(im.dataset.art); });
  $('#dayBtn').innerHTML = night ? svg('moon') : svg('sun');
  $('#dayBtn').setAttribute('aria-label', night ? 'Night. Switch to sunset' : 'Sunset. Switch to night');
  $('#rainBtn').innerHTML = svg('rain'); $('#rainBtn').setAttribute('aria-pressed', String(raining));
  $('#nightSw').setAttribute('aria-checked', String(night)); $('#rainSw').setAttribute('aria-checked', String(raining)); $('#motionSw').setAttribute('aria-checked', String(!!reduced));
  document.querySelector('meta[name=theme-color]').content = night ? '#13201b' : '#f6efe2';
  draw(performance.now());
}
$('#dayBtn').onclick = $('#nightSw').onclick = () => { night = !night; prefs.night = night; savePrefs(); paintWeather(); renderList(); paintPlayer(); paintMini(); };
$('#rainSw').onclick = () => $('#rainBtn').click();
$('#motionSw').onclick = () => { reduced = !reduced; prefs.reduced = reduced; savePrefs(); paintWeather(); };
$('#rainBtn').onclick = () => { raining = !raining; prefs.raining = raining; savePrefs(); paintWeather();
  if (raining && !(+$('#vRain').value)) { $('#vRain').value = 35; prefs.vRain = 35; savePrefs(); }
  if (playing || timer) { garden(true); } mix(); };
paintWeather();

/* ---------- garden sounds (made on the phone, from the Breathe handoff) ---------- */
let ac = null, gWater, gRain;
function garden(on) {
  if (on && !ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate), d = buf.getChannelData(0); let p = 0;
      for (let i = 0; i < d.length; i++) { p = (p + Math.random() * .04 - .02) / 1.02; d[i] = p * 5; }
      [gWater, gRain] = [ac.createGain(), ac.createGain()];
      for (const [g, f] of [[gWater, 650], [gRain, 2200]]) { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; s.connect(fl).connect(g).connect(ac.destination); g.gain.value = 0; s.start(); }
    } catch { ac = null; }
  }
  if (ac) { if (on) ac.resume().catch(() => {}); mix(on); }
}
function mix(on = !!(playing || timer)) {
  if (!ac) return;
  const w = on ? (+$('#vWater').value / 100) * .2 : 0, r = on && raining ? (+$('#vRain').value / 100) * .3 : 0;
  gWater.gain.setTargetAtTime(w, ac.currentTime, .4); gRain.gain.setTargetAtTime(r, ac.currentTime, .4);
}
for (const id of ['vWater', 'vRain']) { if (prefs[id] != null) $('#' + id).value = prefs[id]; $('#' + id).oninput = () => { prefs[id] = +$('#' + id).value; savePrefs(); mix(); }; }
if (prefs.vWater == null) $('#vWater').value = 0; // quiet by default under voices and music; the timer turns water on
function bell(delay = 0) {
  garden(true); if (!ac) return; const t0 = ac.currentTime + delay;
  for (const [f, v] of [[196, .07], [392, .05], [588, .03], [784.5, .02]]) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + 7);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + 7.1);
  }
}

/* ---------- where the garden and the soundscape sit ---------- */
function mountGarden(slot) { const g = $('#garden'); if (g.parentElement !== slot) slot.prepend(g); }
function openScape() { $('#scapeSheet').append($('#soundscape')); $('#sheetWrap').hidden = false; $('#ambBtn').setAttribute('aria-expanded', 'true'); garden(true); }
function closeScape() { $('#sheetWrap').hidden = true; $('#ambBtn').setAttribute('aria-expanded', 'false'); placeScape(); }
function placeScape() { if (!$('#sheetWrap').hidden) return; if (mode === 'timer') $('#scapeHome').append($('#soundscape')); else document.body.append($('#soundscape')); }
$('#setBtn').onclick = openScape;
$('#sheetWrap').addEventListener('click', (e) => { if (e.target === $('#sheetWrap')) closeScape(); });
const fillSl = (el) => el.style.setProperty('--v', el.value + '%');
['vWater', 'vRain'].forEach((id) => { const el = $('#' + id); fillSl(el); el.addEventListener('input', () => fillSl(el)); });

/* ---------- library ---------- */
let TRACKS = [];
let mode = prefs.mode && KIND[prefs.mode] ? prefs.mode : 'guided';
const doneIds = new Set(prefs.done || []);
const SECT = { guided: 'A moment for you', journeys: 'Somewhere else for a while', music: 'Something to sit with', timer: 'Meditation timer' };
const CTA = { guided: 'Begin meditation', journeys: 'Begin journey', music: 'Play music' };
const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
function renderList() {
  $$('.seg button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
  if (!cur && !timer) document.documentElement.style.setProperty('--kind', KIND[mode][1]);
  $('#secTitle').textContent = SECT[mode];
  $('#timerPane').hidden = mode !== 'timer'; $('#list').hidden = $('#feature').hidden = mode === 'timer';
  $('#pathNote').textContent = NOTE[mode] || ''; $('#pathNote').hidden = mode === 'timer';
  placeScape();
  if (mode === 'timer') return;
  const items = TRACKS.filter((t) => t.cat === mode);
  if (mode === 'guided') items.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  if (!items.length) { $('#feature').innerHTML = ''; $('#list').innerHTML = ''; return; }
  const next = items.find((t) => !doneIds.has(t.id)) || items[(new Date().getDate()) % items.length];
  $('#list').innerHTML = items.map((t) => {
    const on = cur && cur.id === t.id;
    return `<li><button class="track${on && playing ? ' now' : ''}" data-id="${t.id}"${on ? ' aria-current="true"' : ''}>
      <span class="thumb"><img src="${pic(artOf(t))}" alt="" loading="lazy"><span class="eq"><i></i><i></i><i></i></span></span>
      <span><span class="t">${nums(t.title)}</span><span class="d">${doneIds.has(t.id) ? LANTERN.replace('<svg', '<svg class="seen" aria-label="Listened"') : ''}<b>${mins(t.dur)}</b>${BLURB[t.id] ? ` &nbsp;·&nbsp; ${esc(BLURB[t.id])}` : ''}</span></span>${CHEV}</button></li>`;
  }).join('');
  $('#feature').innerHTML = `<button class="cta feature" data-id="${next.id}">${cur && cur.id === next.id && playing ? 'Back to ' + esc(next.title) : (doneIds.has(next.id) || items.indexOf(next) ? `${CTA[mode]}: ${esc(next.title)}` : CTA[mode])}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`;
}
$('#feature').addEventListener('click', (e) => { const b = e.target.closest('.feature'); if (!b) return; const t = TRACKS.find((x) => x.id === b.dataset.id); if (!t) return; if (cur && cur.id === t.id) { showPlayer(); return; } start(t); });
$$('.seg button').forEach((b) => b.onclick = () => { mode = b.dataset.mode; prefs.mode = mode; savePrefs(); renderList(); });
$('#list').addEventListener('click', (e) => { const b = e.target.closest('.track'); if (!b) return; const t = TRACKS.find((x) => x.id === b.dataset.id); if (!t) return;
  if (cur && cur.id === t.id) { showPlayer(); return; } start(t); });

/* ---------- player ---------- */
let cur = null, playing = false, listened = 0, credited = 0, tickAt = 0, capsOn = prefs.caps !== false, lastCue = -2;
function showPlayer() { $('#library').hidden = true; $('#player').hidden = false; $('#mini').hidden = true; mountGarden($('#playerSlot')); scrollTo({ top: 0 }); paintPlayer(); }
function showLibrary() { $('#player').hidden = true; $('#library').hidden = false; $('#mini').hidden = !(cur || timer); mountGarden($('#gardenSlot')); renderList(); paintMini(); }
$('#back').onclick = showLibrary;
$('#mini').onclick = (e) => { if (e.target.closest('#miniPP')) { e.stopPropagation(); toggle(); return; } showPlayer(); };

let moodSaved = null;
function applyMood(m) {
  if (m && !moodSaved) moodSaved = { night, raining };
  if (m) { if (m.rain) raining = true; if (m.night) night = true; }
  else if (moodSaved) { night = moodSaved.night; raining = moodSaved.raining; moodSaved = null; }
  paintWeather(); mix();
}
function start(t) {
  stopAll(true);
  cur = t; listened = 0; credited = 0; lastCue = -2;
  applyMood(MOOD[t.id] || null);
  document.documentElement.style.setProperty('--kind', KIND[t.cat][1]);
  audio.src = t.src; audio.currentTime = 0;
  try { if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'SPYR Meditation Space', artwork: [{ src: 'art/monk.webp', sizes: '512x512', type: 'image/webp' }] }); } catch {}
  $('#done').hidden = true; $('.transport').hidden = false; $('.scrub').hidden = false; $('.extras').hidden = false; $('#bigTime').hidden = false;
  showPlayer(); play();
}
async function play() {
  if (!cur && !timer) return;
  if (timer) { timer.running = true; timer.at = performance.now(); if (timer.bed) bed.play().catch(() => {}); garden(true); setPlaying(true); return; }
  try { await audio.play(); } catch { $('#caption').textContent = 'Tap play to begin.'; }
}
function pause() {
  if (timer) { timer.running = false; timer.left -= (performance.now() - timer.at) / 1000; bed.pause(); setPlaying(false); mix(false); return; }
  audio.pause();
}
function toggle() { (playing ? pause : play)(); }
function setPlaying(p) { playing = p; document.body.classList.toggle('playing', p); paintPlayer(); paintMini(); renderListLight(); mix(); }
audio.onplay = () => { tickAt = performance.now(); garden(true); setPlaying(true); };
audio.onpause = () => { account(); setPlaying(false); };
audio.onended = () => { account(); finish(); };
audio.ontimeupdate = () => { account(); paintProgress(); paintCaption(); };
function account() { if (!playing || !cur) return; const n = performance.now(); listened += Math.min(5, (n - tickAt) / 1000); tickAt = n; }
$('#pp').onclick = toggle;
$('#rew').onclick = () => { if (timer) return; audio.currentTime = Math.max(0, audio.currentTime - 15); lastCue = -2; paintCaption(); };
$('#fwd').onclick = () => { if (timer) return; audio.currentTime = Math.min((audio.duration || cur.dur) - 1, audio.currentTime + 15); lastCue = -2; paintCaption(); };
$('#seek').oninput = () => { if (timer || !cur) return; const d = audio.duration || cur.dur; audio.currentTime = (+$('#seek').value / 1000) * d; lastCue = -2; paintProgress(); paintCaption(); };
$('#capBtn').onclick = () => { capsOn = !capsOn; prefs.caps = capsOn; savePrefs(); lastCue = -2; paintPlayer(); paintCaption(); };
$('#ambBtn').onclick = openScape;
$('#endBtn').onclick = () => finish(true);
$('#again').onclick = () => { stopAll(); showLibrary(); };

function paintPlayer() {
  const k = timer ? 'timer' : cur?.cat; if (!k) return;
  $('#npWhere').textContent = timer ? `Sitting in the garden${night ? ' at night' : ' at sunset'}` : `${mins(cur.dur)} · in the garden${night ? ' at night' : ' at sunset'}`;
  $('#npKind').textContent = KIND[k][0];
  $('#npTitle').innerHTML = timer ? `<span class="num">${Math.round(timer.total / 60)}</span> minutes of quiet` : nums(cur.title);
  $('#ppIcon').setAttribute('d', playing ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M8 5v14l11-7z');
  $('#pp').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  const voice = !timer && cur && cur.cues && cur.cues.length;
  $('#capBtn').hidden = !voice; $('#capBtn').textContent = capsOn ? 'Words on' : 'Words off'; $('#capBtn').setAttribute('aria-pressed', String(capsOn));
  $('#rew').hidden = $('#fwd').hidden = !!timer; $('#seek').disabled = !!timer;
  paintProgress(); paintCaption(true);
}
function pos() { if (timer) { const left = timer.running ? timer.left - (performance.now() - timer.at) / 1000 : timer.left; return [timer.total - left, timer.total]; } return [audio.currentTime || 0, audio.duration || cur?.dur || 0]; }
function paintProgress() {
  const [p, d] = pos(); const f = d ? Math.min(1, p / d) : 0;
  $('#seek').value = Math.round(f * 1000); $('#seek').style.setProperty('--p', (f * 100).toFixed(2) + '%');
  $('#tNow').textContent = mmss(p); $('#tLeft').textContent = mmss(d);
  $('#miniFill').style.width = (f * 100).toFixed(1) + '%';
  $('#bigTime').textContent = mmss(d - p);
}
function paintCaption(force) {
  const c = $('#caption');
  if (timer) { if (force || c.dataset.k !== 'timer') { c.dataset.k = 'timer'; c.className = 'caption'; c.textContent = playing ? 'Breathe as you are. Nothing to do but sit.' : 'Paused. Pick up whenever you like.'; } return; }
  if (!cur) return;
  if (!cur.cues || !cur.cues.length) { if (force || c.dataset.k !== 'music') { c.dataset.k = 'music'; c.className = 'caption quiet'; c.textContent = playing ? 'Let the music hold you. Your breath can be the only thing you follow.' : 'Ready when you are.'; } return; }
  if (!capsOn) { if (c.dataset.k !== 'off') { c.dataset.k = 'off'; c.className = 'caption quiet'; c.textContent = 'Words are hidden. Just listen.'; } return; }
  const t = audio.currentTime || 0; let i = -1;
  for (let k = 0; k < cur.cues.length; k++) { if (cur.cues[k][0] <= t + .15) i = k; else break; }
  const quiet = i < 0 || t > cur.cues[i][1] + 6; // long pauses in the recording show as silence
  const key = quiet ? 'q' + (i < 0 ? -1 : i) : 'c' + i;
  if (!force && key === c.dataset.k) return;
  c.dataset.k = key; lastCue = i;
  c.classList.add('fade');
  setTimeout(() => {
    c.classList.toggle('quiet', quiet);
    c.textContent = quiet ? (i < 0 ? (playing ? 'Settling in…' : 'Ready when you are.') : '…') : cur.cues[i][2];
    c.classList.remove('fade');
  }, force ? 0 : 280);
}
function paintMini() {
  const any = cur || timer;
  $('#mini').hidden = !any || !$('#player').hidden;
  if (!any) return;
  $('#miniT').innerHTML = timer ? `Sitting, <span class="num">${mmss(pos()[1] - pos()[0])}</span> left` : nums(cur.title);
  $('#miniArt').src = timer ? `art/c/slantern-${night ? 'n' : 'd'}.webp` : (cur.cat === 'guided' ? `art/c/ring-${night ? 'n' : 'd'}.webp` : pic(artOf(cur)));
  $('#miniPP').innerHTML = svg(playing ? 'pause' : 'play', 1); $('#miniPP').setAttribute('aria-label', playing ? 'Pause' : 'Play');
}
function renderListLight() { if (!$('#library').hidden && mode !== 'timer') renderList(); }

/* ---------- minutes for the Meditation habit ---------- */
function credit() {
  const sat = timer ? Math.max(0, pos()[0]) : listened;
  const m = Math.floor(sat / 60) - credited;
  if (m < 1) return 0;
  credited += m; todayMin += m; paintToday();
  try { if (embedded) window.parent.postMessage({ type: 'spyr:meditate-complete', min: m, title: timer ? 'Sitting' : cur.title, kind: timer ? 'timer' : cur.cat }, location.origin); } catch {}
  return m;
}
function finish(early) {
  const was = timer ? 'timer' : cur?.cat;
  if (timer) { timer.running = false; bed.pause(); if (!early) bell(); }
  else { account(); audio.pause(); }
  const m = credit();
  if (cur && !early) { doneIds.add(cur.id); prefs.done = [...doneIds]; savePrefs(); }
  setPlaying(false); mix(false);
  $('#player').hidden = false; $('#library').hidden = true; $('#mini').hidden = true;
  $('#done').hidden = false; $('.transport').hidden = true; $('.scrub').hidden = true; $('.extras').hidden = true; $('#bigTime').hidden = true;
  const total = credited;
  $('#doneMin').textContent = total ? `+${total} minute${total > 1 ? 's' : ''} added to Meditation` : 'Under a minute, so nothing was added this time.';
  $('#doneLanterns').innerHTML = Array.from({ length: Math.min(12, Math.max(1, total)) }, (_, i) => LANTERN.replace('<svg', `<svg style="animation-delay:${(i * .12).toFixed(2)}s"`)).join('');
  $('#doneLanterns').hidden = !total;
  $('#caption').className = 'caption'; $('#caption').dataset.k = 'done';
  $('#caption').textContent = early ? 'You stopped here. That still counts.' : (was === 'timer' ? 'The bell has rung.' : 'That is the end of this one.');
  $('.done-t').textContent = 'Sit for a moment before you move.';
}
function stopAll(silent) {
  if (cur || timer) { account(); credit(); }
  audio.pause(); audio.removeAttribute('src'); try { audio.load(); } catch {}
  bed.pause(); bed.removeAttribute('src');
  cur = null; timer = null; playing = false; document.body.classList.remove('playing'); mix(false);
  if (moodSaved) applyMood(null);
}

/* ---------- timer ---------- */
let timer = null, tMin = Math.min(180, Math.max(1, prefs.tMin || 10));
const PRESETS = [5, 10, 15, 20];
function paintTimer() { $('#tMins').textContent = tMin; $('#presets').innerHTML = PRESETS.map((m) => `<button data-m="${m}" aria-pressed="${m === tMin}">${m}</button>`).join(''); $('#tStart').firstChild.textContent = `Start ${tMin}-minute session`; }
$('#presets').onclick = (e) => { const b = e.target.closest('[data-m]'); if (!b) return; tMin = +b.dataset.m; prefs.tMin = tMin; savePrefs(); paintTimer(); };
$$('.nudge').forEach((b) => b.onclick = () => { tMin = Math.min(180, Math.max(1, tMin + +b.dataset.d - (tMin === 1 && +b.dataset.d > 0 ? 1 : 0))); prefs.tMin = tMin; savePrefs(); paintTimer(); });
$('#tStart').onclick = () => {
  stopAll(true);
  const pick = $('#tSound').value; prefs.tSound = pick; savePrefs();
  timer = { total: tMin * 60, left: tMin * 60, running: false, at: 0, bed: null };
  credited = 0;
  if (pick === 'water') { if (!(+$('#vWater').value)) $('#vWater').value = 35; }
  else if (pick === 'rain') { raining = true; paintWeather(); if (!(+$('#vRain').value)) $('#vRain').value = 40; if (!(+$('#vWater').value)) $('#vWater').value = 12; }
  else if (pick === 'none') { $('#vWater').value = 0; }
  else { const t = TRACKS.find((x) => x.id === pick); if (t) { bed.src = t.src; bed.volume = .7; timer.bed = t; } $('#vWater').value = 0; }
  document.documentElement.style.setProperty('--kind', KIND.timer[1]);
  $('#done').hidden = true; $('.transport').hidden = false; $('.scrub').hidden = false; $('.extras').hidden = false; $('#bigTime').hidden = false;
  bell(); showPlayer(); play();
};
setInterval(() => {
  if (timer && timer.running) { const [p, d] = pos(); if (p >= d) { timer.left = 0; finish(false); } else { paintProgress(); paintMini(); if (Math.floor(p) % 60 === 0 && p > 59) credit(); } }
  else if (cur && playing) { paintMini(); if (listened - credited * 60 >= 60) credit(); }
}, 500);

/* ---------- the ribbons ---------- */
const wv = $('#waves'), wctx = wv.getContext('2d');
let wAmp = .25, wPhase = 0, wLast = 0;
const WCOL_DAY = { guided: ['31,77,58', '227,164,71', '79,154,142'], journeys: ['217,127,134', '227,164,71', '31,77,58'], music: ['79,154,142', '31,77,58', '227,164,71'], timer: ['31,77,58', '227,164,71', '79,154,142'] };
const WCOL = { guided: ['244,182,96', '255,213,140', '140,196,186'], journeys: ['237,168,171', '244,182,96', '160,150,220'], music: ['140,196,186', '120,170,210', '244,182,96'], timer: ['243,232,210', '244,182,96', '140,196,186'] };
function waves(t) {
  requestAnimationFrame(waves);
  if (document.hidden || $('#player').hidden) return;
  const dt = Math.min(.05, (t - wLast) / 1000 || 0); wLast = t;
  const W = wv.clientWidth, H = wv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (wv.width !== Math.round(W * dpr)) { wv.width = Math.round(W * dpr); wv.height = Math.round(H * dpr); }
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0); wctx.clearRect(0, 0, W, H);
  const target = reduced ? .3 : playing ? 1 : .22; wAmp += (target - wAmp) * Math.min(1, dt * 1.6);
  if (!reduced) wPhase += dt * (playing ? .9 : .25);
  const breath = .78 + .22 * Math.sin((t / 1000) * (2 * Math.PI / 8)); // the monk's 8-second breath
  const cols = (night ? WCOL : WCOL_DAY)[timer ? 'timer' : cur?.cat || 'guided'];
  for (let k = 0; k < 9; k++) {
    const c = cols[k % 3], amp = H * .38 * wAmp * breath * (.45 + .55 * Math.sin(k * 1.7 + 1)), f = .9 + k * .23, ph = wPhase * (1 + k * .17) + k * 1.3;
    wctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const u = x / W, env = Math.sin(Math.PI * u) ** 1.6;
      const y = H / 2 + env * amp * Math.sin(u * Math.PI * 2 * f + ph) + env * amp * .35 * Math.sin(u * Math.PI * 5 * f - ph * 1.4);
      x ? wctx.lineTo(x, y) : wctx.moveTo(x, y);
    }
    wctx.strokeStyle = `rgba(${c},${(.10 + .32 * (1 - k / 9)) * (.55 + .45 * wAmp)})`; wctx.lineWidth = k < 3 ? 2 : 1.2;
    wctx.shadowColor = `rgba(${c},.6)`; wctx.shadowBlur = k < 2 ? 8 : 0; wctx.stroke();
  }
}
requestAnimationFrame(waves);

/* ---------- leave / lifecycle ---------- */
$('#exit').onclick = () => {
  stopAll(); cancelAnimationFrame(raf); try { ac && ac.close(); } catch {}
  if (embedded) { try { window.parent.postMessage({ type: 'spyr:gym-exit' }, location.origin); return; } catch {} }
  history.length > 1 ? history.back() : (location.href = '../index.html');
};
addEventListener('pagehide', () => { account(); credit(); });
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => play());
  navigator.mediaSession.setActionHandler('pause', () => pause());
}

/* ---------- load ---------- */
fetch('tracks.json?v=1').then((r) => r.json()).then((list) => {
  TRACKS = Array.isArray(list) ? list : [];
  $('#tSound').innerHTML = `<option value="water">Garden water</option><option value="rain">Rain in the garden</option><option value="none">Silence</option><optgroup label="Music">${TRACKS.filter((t) => t.cat === 'music').map((t) => `<option value="${t.id}">${esc(t.title)}</option>`).join('')}</optgroup>`;
  $('#tSound').value = prefs.tSound && [...$('#tSound').options].some((o) => o.value === prefs.tSound) ? prefs.tSound : 'water';
  renderList();
}).catch(() => { $('#list').innerHTML = '<li class="note">The meditations need a connection the first time. Check your signal and reopen the Meditation Space.</li>'; });
mountGarden($('#gardenSlot')); paintTimer(); renderList();
