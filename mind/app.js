import * as World from './world.js';

/* ============================== utils ============================== */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = () => dkey(new Date());
const fromKey = k => { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate()+n); return dkey(d); };
const diffDays = (a, b) => Math.round((fromKey(a) - fromKey(b))/864e5);
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], DOWL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(k, long){ const d = diffDays(k, today()); if (d===0) return 'Today'; if (d===1) return 'Tomorrow'; if (d===-1) return 'Yesterday';
  const dt = fromKey(k); if (d>1 && d<7) return long ? DOWL[dt.getDay()] : DOW[dt.getDay()];
  return `${long ? DOWL[dt.getDay()]+', ' : ''}${MON[dt.getMonth()]} ${dt.getDate()}${dt.getFullYear()!==new Date().getFullYear() ? ', '+dt.getFullYear() : ''}`; }
const fmtTime = t => { const [h,m] = t.split(':').map(Number); const hh = h%12||12; return `${hh}${m?':'+pad(m):''}${h>=12?'pm':'am'}`; };
const ago = ts => { const m = Math.round((Date.now()-ts)/6e4); if (m<1) return 'just now'; if (m<60) return m+'m ago'; const h = Math.round(m/60); if (h<24) return h+'h ago'; const d = Math.round(h/24); return d+'d ago'; };
const ICON = {
  inbox:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/></svg>',
  today:'<svg class="ico" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1L3.2 9.3l6.1-.9z"/></svg>',
  upcoming:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  someday:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  logbook:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
  search:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
  dots:'<svg class="ico" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  group:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  sort:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h9M4 6h13M4 18h5M17 10v9M14 16l3 3 3-3"/></svg>',
  rep:'↻', note:'≡', close:'×',
};

/* ============================== constants ============================== */
const COLORS = ['#3E63DD','#E5734F','#2F9E6B','#E59A0B','#8E4EC6','#D6409F','#0EA5B7','#E5484D','#65A30D','#6B7280'];
const OLDCOL = {'#79a7ff':'#3E63DD','#ff9c86':'#E5734F','#7ee0a0':'#2F9E6B','#ffd56b':'#E59A0B','#c6a8ff':'#8E4EC6','#ff9ccd':'#D6409F','#5fd3e6':'#0EA5B7','#ff8f5a':'#E5484D','#b6e36b':'#65A30D','#e6e9ff':'#6B7280'};
const EMOJI = ['💼','📚','💪','🏠','💰','✨','🛒','✈️','🎯','🧠','🎨','🌱','🧾','📞','🐾','🎵','🍳','🧘','🛠️','❤️'];
const BUILDINGS = [{k:'work',n:'Office'},{k:'school',n:'Library'},{k:'gym',n:'Gym'},{k:'home',n:'Cottage'},{k:'money',n:'Bank'},{k:'ideas',n:'Studio'}];
const THEMES = [{k:'meadow',n:'Meadow',g:'linear-gradient(135deg,#8fd27a,#6fb3e6)'},{k:'autumn',n:'Autumn',g:'linear-gradient(135deg,#e9a24a,#c8613e)'},{k:'frost',n:'Frost',g:'linear-gradient(135deg,#dfeaf7,#8fb3d9)'},{k:'blossom',n:'Blossom',g:'linear-gradient(135deg,#ffc4dc,#c6a8ff)'}];
const TEMPLATES = {
  life:[['Work','#3E63DD','💼','work'],['Study','#E5734F','📚','school'],['Body','#2F9E6B','💪','gym'],['Home','#E59A0B','🏠','home'],['Money','#8E4EC6','💰','money'],['Self','#D6409F','✨','ideas']],
  work:[['Projects','#3E63DD','🎯','work'],['Meetings','#E59A0B','📞','money'],['Admin','#8E4EC6','🧾','school'],['Learning','#E5734F','🧠','ideas']],
  blank:[['Next','#3E63DD','🎯','work'],['Later','#E59A0B','🌱','home']],
};
const KEYWORDS = {
  work:/project|proposal|email|meeting|deadline|client|report|drawing|follow|office|call|boss|slack|ticket|estimate|bid|submittal|invoice client|presentation|review/i,
  study:/study|exam|\bread\b|reading|course|class|learn|homework|\bpe\b|lesson|textbook|chapter|cert|license|practice/i,
  body:/leg|workout|gym|lift|run|stretch|yoga|walk|train|cardio|swim|hike|squat|bench|mobility|doctor|dentist|sleep/i,
  home:/clean|kitchen|laundry|dish|bedroom|grocer|fix|chore|vacuum|sweep|trash|garage|lawn|repair|cook|dinner|milk|eggs/i,
  money:/pay|bill|bank|budget|tax|rent|electric|insurance|card|transfer|save|invest|mortgage|loan|refund/i,
  self:/mom|dad|friend|birthday|trip|journal|meditat|hobby|gift|flight|travel|vacation|passport|tokyo|hotel/i,
};
/* Inside SPYR (?embedded=1) MIND is a room: it saves per SPYR profile under spyr:mind:<pid>, the same key SPYR's
   room host mirrors to the account, and tells the host about every save. */
const EMB = new URLSearchParams(location.search).has('embedded');
const PID = (() => { try { return (JSON.parse(localStorage.getItem('rt1:me') || 'null') || {}).id || null; } catch { return null; } })();
const KEY = EMB ? `spyr:mind:${PID || 'guest'}` : 'spyr-mind:v6';

/* ============================== state ============================== */
let S = load(); if (!S){ EMB ? starter() : seed(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
S.lists.forEach(l => { if (OLDCOL[l.color]) l.color = OLDCOL[l.color]; });
if (S.settings && !S.settings.cloudsV1){ S.settings.villagers = 'cloud'; S.settings.cloudsV1 = true; }
S.settings = Object.assign({appearance:'auto', density:'comfy', labels:'all', villagers:'cloud', reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches}, S.settings);
queueMicrotask(() => { lastBody = bodyJSON(); });
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v===6 && Array.isArray(s.tasks) && Array.isArray(s.lists) && Array.isArray(s.worlds)) return s; } catch {} return null; }
/* savedAt only moves when the content really changed, so a fresh device's starter town can never look newer than
   the town SPYR is about to load from the account. */
const bodyJSON = () => { const {savedAt, ...rest} = S; return JSON.stringify(rest); };
let lastBody = null;
let saveT; function save(){ clearTimeout(saveT); saveT = setTimeout(() => { const b = bodyJSON(); const changed = b !== lastBody; lastBody = b;
  if (changed) S.savedAt = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
  if (EMB && changed) try { window.dispatchEvent(new CustomEvent('spyr:mind-change', {detail: S})); } catch {} }, 120); }
function mkTask(o){ return Object.assign({id:uid(), worldId:S.worldId, listId:null, title:'', notes:'', due:null, time:null, repeat:null, pri:0, tags:[], subs:[], focus:null, someday:false, done:false, doneAt:null, created:Date.now(), order:Date.now()}, o); }
function seed(){
  S = {v:6, worlds:[], lists:[], tasks:[], worldId:null, settings:{time:'auto', snd:1, showDone:false, group:{}, closed:{}}, view:'today'};
  const w = addWorld('Life', 'meadow', 'life', true); S.worldId = w.id;
  const L = n => S.lists.find(l => l.worldId===w.id && l.name===n).id, t0 = today(), now = Date.now();
  const T = (title, o={}) => S.tasks.push(mkTask({title, ...o, order:now - S.tasks.length*1000}));
  T('Finish the proposal', {listId:L('Work'), due:t0, time:'15:00', pri:3, focus:now-3, notes:'Send to Min before the 4pm call. Pricing section still needs numbers.', subs:[{id:uid(),text:'Draft pricing',done:true},{id:uid(),text:'Pull numbers from estimate',done:false},{id:uid(),text:'Proofread',done:false}]});
  T('Leg day', {listId:L('Body'), due:t0, pri:2, focus:now-2, repeat:{type:'dow', dow:new Date().getDay()}, tags:['gym']});
  T('Pay electric bill', {listId:L('Money'), due:addDays(t0,-1), pri:2});
  T('Study for PE exam', {listId:L('Study'), due:addDays(t0,3), pri:2, subs:[{id:uid(),text:'Chapter 4 · load calcs',done:false},{id:uid(),text:'Practice problems',done:false}]});
  T('Read 20 pages', {listId:L('Study'), due:t0, repeat:{type:'daily', every:1}});
  T('Clean the kitchen', {listId:L('Home'), due:addDays(t0,1)});
  T('Groceries', {listId:L('Home'), due:t0, subs:['Milk','Eggs','Bread','Coffee'].map(text => ({id:uid(), text, done:false}))});
  T('Send the estimate', {listId:L('Work'), due:addDays(t0,2), tags:['client']});
  T('Plan Japan trip', {listId:L('Self'), due:addDays(t0,6), notes:'Tokyo · Kyoto · Osaka', subs:[{id:uid(),text:'Book flights',done:false},{id:uid(),text:'Rail pass',done:false}]});
  T('Renew car insurance', {listId:L('Money'), due:addDays(t0,9)});
  T('Learn Japanese basics', {listId:L('Self'), someday:true});
  T('Reply to Min'); T('Call the dentist'); T('Fix the garage door'); T('Idea: SPYR Instagram reel');
  T('Morning run', {listId:L('Body'), done:true, doneAt:now-36e5*3}); T('Laundry', {listId:L('Home'), done:true, doneAt:now-36e5*20}); T('Weekly review', {listId:L('Work'), done:true, doneAt:now-36e5*30});
  return S;
}
/* A small town for someone opening MIND for the first time inside SPYR: each task teaches one thing. */
function starter(){
  S = {v:6, worlds:[], lists:[], tasks:[], worldId:null, settings:{time:'auto', snd:1, showDone:false, group:{}, closed:{}}, view:'inbox'};
  const w = addWorld('Life', 'meadow', 'life', true); S.worldId = w.id;
  const L = n => S.lists.find(l => l.worldId===w.id && l.name===n).id, t0 = today(), now = Date.now();
  const T = (title, o={}) => S.tasks.push(mkTask({title, ...o, order:now + S.tasks.length*1000}));
  T('Tap me to see what I hold', {notes:'Every thought you add lands on the Ideas island. Give it a list, a date or steps here.'});
  T('Give me a list and I float into town');
  T('Anything on your mind? Add it below');
  T('Starred tasks stand on the stage', {listId:L('Self'), focus:now});
  T('Groceries', {listId:L('Home'), due:t0, subs:['Milk','Eggs','Bread'].map(text => ({id:uid(), text, done:false}))});
  T('Opened MIND', {listId:L('Self'), done:true, doneAt:now - 6e4});
  return S;
}
function addWorld(name, theme, template, silent){ const w = {id:uid(), name, theme}; S.worlds.push(w);
  (TEMPLATES[template]||TEMPLATES.blank).forEach(([n,c,i,b], k) => S.lists.push({id:uid(), worldId:w.id, name:n, color:c, icon:i, bld:b, order:k}));
  if (!silent) save(); return w; }
const W = () => S.worlds.find(w => w.id===S.worldId) || S.worlds[0];
const wLists = () => S.lists.filter(l => l.worldId===S.worldId).sort((a,b) => a.order-b.order);
const wTasks = () => S.tasks.filter(t => t.worldId===S.worldId);
const listOf = t => S.lists.find(l => l.id===t.listId);
const getT = id => S.tasks.find(t => t.id===id);
const isOpen = t => !t.done;
const isLate = t => !t.done && t.due && t.due < today();

/* ============================== undo ============================== */
let undoSnap = null;
const snap = () => { undoSnap = JSON.stringify(S.tasks); };
function undo(){ if (!undoSnap) return; S.tasks = JSON.parse(undoSnap); undoSnap = null; save(); renderAll(); toast('Undone'); }

/* ============================== smart parsing ============================== */
const DAYRE = '(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)';
const dowIdx = s => ['sun','mon','tue','wed','thu','fri','sat'].indexOf(s.slice(0,3).toLowerCase());
const monIdx = s => ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(s.slice(0,3).toLowerCase());
const nextDow = (dow, strictlyNext) => { const t0 = today(); let add = (dow - fromKey(t0).getDay() + 7) % 7; if (strictlyNext && add===0) add = 7; return addDays(t0, add); };
function matchList(name){ const n = name.toLowerCase().replace(/[^a-z0-9]/g,''); return wLists().find(l => l.name.toLowerCase().replace(/[^a-z0-9]/g,'').startsWith(n)); }
function parse(raw){
  const o = {title:'', due:null, time:null, repeat:null, pri:0, tags:[], listId:undefined, someday:false, focus:false, subs:[], unknownList:null};
  let s = ' ' + raw.replace(/\s+/g,' ').trim() + ' ';
  const take = (re, fn) => { s = s.replace(re, (...m) => fn(...m) === false ? m[0] : ' '); };
  const ci = s.indexOf(':'); if (ci > 2 && !/\d$/.test(s.slice(0,ci).trim()) && s.slice(ci+1).trim()){ o.subs = s.slice(ci+1).split(/,|;|\band\b/i).map(x=>x.trim()).filter(Boolean).map(text => ({id:uid(), text:text[0].toUpperCase()+text.slice(1), done:false})); s = s.slice(0,ci)+' '; }
  take(/\s(!{1,3})(?=\s)/, (m,b) => { o.pri = b.length; });
  take(/\sp([123])(?=\s)/i, (m,n) => { o.pri = 4-Number(n); });
  take(/\s\*(?=\s)/, () => { o.focus = true; });
  take(/\s@([\p{L}\p{N}_-]+)/gu, (m,t) => { o.tags.push(t.toLowerCase()); });
  take(/\s#([\p{L}\p{N}_-]+)/u, (m,name) => { if (/^someday$/i.test(name)){ o.someday = true; return; } const L = matchList(name); if (L) o.listId = L.id; else o.unknownList = name; });
  take(new RegExp(`\\severy\\s+(other\\s+)?(day|weekday|week|month|year|${DAYRE})s?(?=\\s)`, 'i'), (m, other, u) => { const e = other ? 2 : 1; u = u.toLowerCase();
    if (u==='day') o.repeat = {type:'daily', every:e}; else if (u==='weekday') o.repeat = {type:'weekdays'}; else if (u==='week') o.repeat = {type:'weekly', every:e};
    else if (u==='month') o.repeat = {type:'monthly', every:e}; else if (u==='year') o.repeat = {type:'yearly', every:1}; else o.repeat = {type:'dow', dow:dowIdx(u)}; });
  take(/\s(daily|weekly|monthly|yearly|weekdays)(?=\s)/i, (m,u) => { u = u.toLowerCase(); o.repeat = u==='weekdays' ? {type:'weekdays'} : {type:{daily:'daily',weekly:'weekly',monthly:'monthly',yearly:'yearly'}[u], every:1}; });
  take(/\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?=\s)/i, (m,h,mi,ap) => { h = Number(h)%12 + (ap.toLowerCase()==='pm'?12:0); o.time = `${pad(h)}:${pad(mi||0)}`; });
  take(/\sat\s+(\d{1,2})(?::(\d{2}))?(?=\s)/i, (m,h,mi) => { h = Number(h); if (h>23) return false; if (h<8) h += 12; o.time = `${pad(h)}:${pad(mi||0)}`; });
  take(/\s(\d{1,2}):(\d{2})(?=\s)/, (m,h,mi) => { if (Number(h)>23) return false; o.time = `${pad(h)}:${mi}`; });
  take(/\s(today|tod)(?=\s)/i, () => { o.due = today(); });
  take(/\stonight(?=\s)/i, () => { o.due = today(); if (!o.time) o.time = '20:00'; });
  take(/\s(tomorrow|tmrw|tmr)(?=\s)/i, () => { o.due = addDays(today(),1); });
  take(/\snext\s+week(?=\s)/i, () => { o.due = nextDow(1, true); });
  take(/\s(?:this\s+)?weekend(?=\s)/i, () => { o.due = nextDow(6, false); });
  take(/\sin\s+(\d+)\s+(day|week|month)s?(?=\s)/i, (m,n,u) => { n = Number(n); u = u.toLowerCase(); if (u==='month'){ const d = new Date(); d.setMonth(d.getMonth()+n); o.due = dkey(d); } else o.due = addDays(today(), u==='week' ? n*7 : n); });
  take(new RegExp(`\\s(next\\s+|this\\s+|on\\s+)?${DAYRE}(?=\\s)`, 'i'), (m,pre,d) => { o.due = nextDow(dowIdx(d), !!(pre && /next/i.test(pre))); });
  const setMD = (mo, d) => { const y = new Date().getFullYear(); let k = dkey(new Date(y, mo, d)); if (k < today()) k = dkey(new Date(y+1, mo, d)); o.due = k; };
  take(/\s(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?=\s)/i, (m,mo,d) => setMD(monIdx(mo), Number(d)));
  take(/\s(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?=\s)/i, (m,d,mo) => setMD(monIdx(mo), Number(d)));
  take(/\s(\d{1,2})\/(\d{1,2})(?=\s)/, (m,mo,d) => { if (Number(mo)>12 || Number(d)>31) return false; setMD(Number(mo)-1, Number(d)); });
  take(/\ssomeday(?=\s)/i, () => { o.someday = true; });
  if (o.repeat && !o.due) o.due = o.repeat.type==='dow' ? nextDow(o.repeat.dow, false) : today();
  o.title = s.replace(/\s+/g,' ').replace(/[:\s]+$/,'').trim(); if (o.title) o.title = o.title[0].toUpperCase() + o.title.slice(1);
  return o;
}
function chipsFor(o){ const c = []; if (o.due) c.push(['date', '📅 ' + fmtDate(o.due) + (o.time ? ' ' + fmtTime(o.time) : '')]); else if (o.time) c.push(['date','⏰ '+fmtTime(o.time)]);
  if (o.repeat) c.push(['rep', '↻ ' + repLabel(o.repeat)]); if (o.listId) { const L = S.lists.find(l=>l.id===o.listId); c.push(['list', L.icon+' '+L.name]); } if (o.unknownList) c.push(['sub', `#${o.unknownList}? no such list`]);
  if (o.someday) c.push(['list','☾ Someday']); if (o.pri) c.push(['pri', ['','Low','Medium','High'][o.pri]+' priority']); o.tags.forEach(t => c.push(['tag','@'+t])); if (o.focus) c.push(['foc','★ Focus']);
  if (o.subs.length) c.push(['sub', `${o.subs.length} steps`]); return c; }
function repLabel(r){ if (!r) return ''; const e = r.every||1;
  return {daily: e>1 ? `Every ${e} days` : 'Every day', weekdays:'Weekdays', weekly: e>1 ? `Every ${e} weeks` : 'Every week', monthly: e>1 ? `Every ${e} months` : 'Every month', yearly:'Every year', dow:`Every ${DOWL[r.dow]}`}[r.type]; }
function nextDue(t){ const r = t.repeat, t0 = today(); let k = t.due || t0;
  const step = k => { switch (r.type){ case 'daily': return addDays(k, r.every||1); case 'weekdays': { let n = addDays(k,1); while ([0,6].includes(fromKey(n).getDay())) n = addDays(n,1); return n; }
    case 'weekly': return addDays(k, 7*(r.every||1)); case 'monthly': { const d = fromKey(k); d.setMonth(d.getMonth()+(r.every||1)); return dkey(d); }
    case 'yearly': { const d = fromKey(k); d.setFullYear(d.getFullYear()+1); return dkey(d); } case 'dow': { let n = addDays(k,1); while (fromKey(n).getDay()!==r.dow) n = addDays(n,1); return n; } } return addDays(k,1); };
  k = step(k); let guard = 0; while (k <= t0 && guard++ < 400) k = step(k); return k; }
function suggestList(title){ const ls = wLists(); const low = title.toLowerCase();
  const byName = ls.find(l => low.includes(l.name.toLowerCase())); if (byName) return byName;
  for (const l of ls){ const k = l.name.toLowerCase(); if (KEYWORDS[k] && KEYWORDS[k].test(title)) return l; }
  const map = {work:'work', school:'study', gym:'body', home:'home', money:'money', ideas:'self'};
  for (const l of ls){ const re = KEYWORDS[map[l.bld]]; if (re && re.test(title)) return l; } return null; }

/* ============================== task ops ============================== */
const fresh = new Set();
function addTask(raw, ctxView = S.view, extra = {}){
  const p = parse(raw); if (!p.title) return null;
  const t = mkTask({title:p.title, due:p.due, time:p.time, repeat:p.repeat, pri:p.pri, tags:p.tags, subs:p.subs, someday:p.someday, ...extra});
  if (p.listId !== undefined) t.listId = p.listId;
  else if (ctxView.startsWith('list:')) t.listId = ctxView.slice(5);
  if (!p.due && !p.someday && ctxView==='today' && !extra.inbox) t.due = today();
  if (!p.someday && ctxView==='someday') t.someday = true;
  if (extra.inbox){ delete t.inbox; }
  S.tasks.push(t); fresh.add(t.id);
  if (p.focus) setFocus(t, true, true);
  return t;
}
function complete(t, on = true){
  if (!on){ t.done = false; t.doneAt = null; return; }
  if (t.repeat){ const copy = {...JSON.parse(JSON.stringify(t)), id:uid(), done:true, doneAt:Date.now(), repeat:null, focus:null}; S.tasks.push(copy);
    t.due = nextDue(t); t.subs.forEach(s => s.done = false); t.focus = null; return {next:t.due}; }
  t.done = true; t.doneAt = Date.now(); t.focus = null; return {};
}
function setFocus(t, on, quiet){
  if (!on){ t.focus = null; return; }
  const cur = wTasks().filter(x => x.focus && !x.done && x!==t).sort((a,b) => a.focus-b.focus);
  if (cur.length >= 3){ cur[0].focus = null; if (!quiet) toast(`“${cur[0].title}” left the stage to make room`); }
  t.focus = Date.now(); if (t.someday) t.someday = false;
}
function delTask(t){ S.tasks = S.tasks.filter(x => x!==t); if (detailId===t.id) closeDetail(); }

/* ============================== views ============================== */
const SMART = [
  {k:'inbox', n:'Inbox', ic:ICON.inbox, col:'var(--blue)'},
  {k:'today', n:'Today', ic:ICON.today, col:'var(--gold)'},
  {k:'upcoming', n:'Upcoming', ic:ICON.upcoming, col:'var(--red)'},
  {k:'someday', n:'Someday', ic:ICON.someday, col:'var(--violet)'},
  {k:'logbook', n:'Logbook', ic:ICON.logbook, col:'var(--green)'},
];
const counts = () => { const ts = wTasks().filter(isOpen), t0 = today();
  return { inbox: ts.filter(t => !t.listId && !t.someday).length, today: ts.filter(t => !t.someday && ((t.due && t.due <= t0) || t.focus)).length, late: ts.filter(t => !t.someday && t.due && t.due < t0).length,
    upcoming: ts.filter(t => !t.someday && t.due && t.due > t0 && diffDays(t.due, t0) <= 14).length, someday: ts.filter(t => t.someday).length, logbook: 0 }; };
const sortSmart = (a,b) => (a.due||'9999') < (b.due||'9999') ? -1 : (a.due||'9999') > (b.due||'9999') ? 1 : (a.time||'99') < (b.time||'99') ? -1 : (a.time||'99') > (b.time||'99') ? 1 : b.pri-a.pri || a.order-b.order;
const sortManual = (a,b) => a.order-b.order;
let search = '';
function sectionsFor(view){
  const t0 = today(), ts = wTasks(); const open = ts.filter(isOpen);
  if (search){ const q = search.toLowerCase(); const hit = t => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) || t.tags.some(g => ('@'+g).includes(q.replace('#','@')) || g.includes(q)) || t.subs.some(s => s.text.toLowerCase().includes(q));
    const r = ts.filter(hit); return [{k:'s-open', n:'Results', items:r.filter(isOpen).sort(sortSmart)}, {k:'s-done', n:'Completed', items:r.filter(t=>t.done).sort((a,b)=>b.doneAt-a.doneAt), closedDefault:true}]; }
  if (view==='inbox') return [{k:'inbox', n:null, items:open.filter(t => !t.listId && !t.someday).sort(sortManual), reorder:true}];
  if (view==='today'){ const foc = open.filter(t => t.focus).sort((a,b) => a.focus-b.focus);
    const late = open.filter(t => !t.focus && !t.someday && t.due && t.due < t0).sort(sortSmart);
    const tod = open.filter(t => !t.focus && !t.someday && t.due===t0).sort(sortSmart);
    const doneToday = ts.filter(t => t.done && t.doneAt && dkey(new Date(t.doneAt))===t0).sort((a,b)=>b.doneAt-a.doneAt);
    return [{k:'focus', n:'★ Focus', cls:'gold', items:foc, hint:foc.length<3 ? 'Star up to three. They stand on the stage.' : ''}, {k:'late', n:'Overdue', cls:'red', items:late}, {k:'today', n:'Today', items:tod}, {k:'tdone', n:'Done today', items:doneToday, closedDefault:true, done:true}]; }
  if (view==='upcoming'){ const out = []; for (let i=1;i<=14;i++){ const k = addDays(t0,i); out.push({k:'u'+k, n:fmtDate(k, true), date:k, items:open.filter(t => !t.someday && t.due===k).sort(sortSmart), compact:true}); }
    out.push({k:'later', n:'Later', items:open.filter(t => !t.someday && t.due && diffDays(t.due,t0) > 14).sort(sortSmart)}); return out; }
  if (view==='someday') return [{k:'someday', n:null, items:open.filter(t => t.someday).sort(sortManual), reorder:true}];
  if (view==='logbook'){ const done = ts.filter(t => t.done).sort((a,b) => b.doneAt-a.doneAt); const g = new Map();
    for (const t of done){ const k = dkey(new Date(t.doneAt)); if (!g.has(k)) g.set(k, []); g.get(k).push(t); }
    return [...g].map(([k, items]) => ({k:'l'+k, n:fmtDate(k, true), items, done:true})); }
  if (view.startsWith('list:')){ const id = view.slice(5); const lt = open.filter(t => t.listId===id); const act = lt.filter(t => !t.someday), sd = lt.filter(t => t.someday);
    const grp = S.settings.group[id] || 'date'; let secs;
    if (grp==='none') secs = [{k:'all', n:null, items:act.sort(sortManual), reorder:true}];
    else if (grp==='priority') secs = [3,2,1,0].map(p => ({k:'p'+p, n:['No priority','Low','Medium','High'][p], items:act.filter(t=>t.pri===p).sort(sortSmart)}));
    else if (grp==='tag'){ const tags = [...new Set(act.flatMap(t => t.tags))].sort(); secs = tags.map(g => ({k:'t'+g, n:'@'+g, items:act.filter(t=>t.tags.includes(g)).sort(sortSmart)})); secs.push({k:'tnone', n:'No tag', items:act.filter(t=>!t.tags.length).sort(sortSmart)}); }
    else { const b = t => !t.due ? 5 : t.due < t0 ? 0 : t.due===t0 ? 1 : t.due===addDays(t0,1) ? 2 : diffDays(t.due,t0) <= 7 ? 3 : 4;
      secs = [['Overdue','red'],['Today'],['Tomorrow'],['This week'],['Later'],['No date']].map(([n,cls],i) => ({k:'d'+i, n, cls, items:act.filter(t=>b(t)===i).sort(sortSmart)})); }
    if (sd.length) secs.push({k:'sd', n:'Someday', items:sd.sort(sortManual), closedDefault:true});
    const doneL = ts.filter(t => t.done && t.listId===id).sort((a,b)=>b.doneAt-a.doneAt).slice(0,30); secs.push({k:'ldone', n:'Completed', items:doneL, closedDefault:true, done:true});
    return secs; }
  return [];
}

/* ============================== rendering ============================== */
let detailId = null, selId = null; const expanded = new Set();
const listEl = $('#list');
function rowHTML(t, view){
  const open0 = expanded.has(t.id);
  const L = listOf(t), t0 = today(); const meta = [];
  if (t.due && !t.done){ const d = diffDays(t.due, t0); const cls = d<0 ? 'late' : d===0 ? 'tdy' : d===1 ? 'tmr' : ''; if (!(view==='upcoming' && d>1) && !(view==='today' && d===0 && !t.time)) meta.push(`<span class="${cls}">${d<0 ? '⚑ ' : ''}${fmtDate(t.due)}${t.time ? ' · '+fmtTime(t.time) : ''}</span>`); else if (t.time) meta.push(`<span>${fmtTime(t.time)}</span>`); }
  if (t.done && t.doneAt && view!=='logbook') meta.push(`<span>Done ${ago(t.doneAt)}</span>`);
  if (t.repeat) meta.push(`<span>↻ ${repLabel(t.repeat)}</span>`);
  if (t.subs.length){ const d = t.subs.filter(s=>s.done).length; meta.push(`<span class="stp" data-steps="1"><i></i>${d}/${t.subs.length}</span>`); }
  else if (!t.done && (open0 || t.id===selId)) meta.push(`<span class="stp add" data-steps="1">+ steps</span>`);
  if (t.notes) meta.push(`<span>≡</span>`);
  t.tags.forEach(g => meta.push(`<span class="tag">@${esc(g)}</span>`));
  if (!view.startsWith('list:')){ if (L) meta.push(`<span><i class="ld" style="background:${L.color}"></i>${esc(L.name)}</span>`); else if (view!=='inbox' && !t.someday) meta.push(`<span style="color:var(--inbox)">Inbox</span>`); }
  if (t.someday && view!=='someday') meta.push('<span>☾ Someday</span>');
  const open = expanded.has(t.id);
  return `<div class="row p${t.pri}${t.done?' done':''}${t.id===selId?' sel':''}${open?' open':''}" data-id="${t.id}"><span class="grip">⋮⋮</span>
    <button class="ck" aria-label="Complete">${ICON.check}</button>
    <div class="bd"><div class="ti">${esc(t.title)}</div>${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}${open ? `<div class="steps">${t.subs.map(s => `<div class="sp${s.done?' done':''}" data-sid="${s.id}"><b>${ICON.check}</b><span>${esc(s.text)}</span></div>`).join('')}<form class="sadd"><span>+</span><input enterkeyhint="done" autocomplete="off" placeholder="Add a step"></form></div>` : ''}</div>
    ${t.done ? '' : `<button class="fx${t.focus?' on':''}" title="Focus">★</button>`}</div>`;
}
function renderMain(){
  const v = S.view; const L = v.startsWith('list:') ? S.lists.find(l => l.id===v.slice(5)) : null; const sm = SMART.find(x => x.k===v); const c = counts();
  $('#vTitle').innerHTML = search ? 'Search' : L ? `<span class="em">${L.icon}</span>${esc(L.name)}` : sm.n;
  let sub = '';
  if (search) sub = `Searching “${esc(search)}”`;
  else if (v==='today') sub = `${fmtDate(today(), true).replace('Today', DOWL[new Date().getDay()])} · ${MON[new Date().getMonth()]} ${new Date().getDate()}` + (c.late ? ` <span class="pill red">${c.late} overdue</span>` : '');
  else if (v==='inbox') sub = c.inbox ? `${c.inbox} unsorted · wandering the Ideas island` : 'Nothing unsorted';
  else if (v==='upcoming') sub = 'The next 14 days';
  else if (v==='someday') sub = 'Parked for later';
  else if (v==='logbook') sub = 'Finished, newest first';
  else if (L){ const n = wTasks().filter(t => isOpen(t) && t.listId===L.id).length; const bi = wLists().indexOf(L); sub = `${n} open <span class="pill">${(BUILDINGS.find(b=>b.k===L.bld)||{}).n}</span>`; }
  $('#vSub').innerHTML = sub;
  const tools = [];
  if (v==='inbox' && c.inbox && !search) tools.push(`<button id="tSort" class="cta">${ICON.sort} Sort</button>`);
  if (L) tools.push(`<button id="tGroup" title="Group by">${ICON.group}</button><button id="tMore" title="List options">${ICON.dots}</button>`);
  tools.push(`<button id="tSearch" title="Search (/)" class="${$('#search').classList.contains('on')?'on':''}">${ICON.search}</button>`);
  $('#vTools').innerHTML = tools.join('');
  const secs = sectionsFor(v); const total = secs.reduce((n,s) => n + s.items.length, 0);
  if (!total){ listEl.innerHTML = emptyHTML(v); return; }
  let html = '';
  for (const s of secs){ if (!s.items.length && !(s.k==='focus' && v==='today' && total)) continue;
    const closed = (S.settings.closed[v+'|'+s.k] ?? !!s.closedDefault);
    html += `<div class="sec${closed?' closed':''}" data-sec="${s.k}">`;
    if (s.n) html += `<div class="sec-h ${s.cls||''}" data-tog="${s.k}"><svg class="ico chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>${esc(s.n)} <span class="ct">${s.items.length||''}</span><span class="ln"></span></div>`;
    html += `<div class="rows" data-reorder="${s.reorder?1:0}">` + s.items.map(t => rowHTML(t, v)).join('');
    if (s.k==='focus' && s.hint) html += `<div style="color:var(--dim);font-size:12px;padding:4px 10px 6px 41px">${s.hint}</div>`;
    html += '</div></div>'; }
  listEl.innerHTML = html;
}
function emptyHTML(v){ const m = {upcoming:['📅','Nothing scheduled','The next two weeks are open.'], inbox:['☁️','Inbox zero','When your head gets busy, press B and dump it all.'], today:['☀️','Nothing due today','Star anything from your lists to put it on the stage.'], someday:['🌙','Nothing parked','Add “someday” to a task to park it here.'], logbook:['✓','Nothing finished yet','Finished tasks rest at the pond for a week, then live here.']}[v] || ['＋','An empty list','Add the first task below.'];
  return `<div class="empty"><div class="art">${m[0]}</div><div class="big">${m[1]}</div>${m[2]}</div>`; }
function renderSide(){
  const c = counts(), v = S.view;
  $('#smartNav').innerHTML = SMART.map(x => { const n = x.k==='today' ? c.today : x.k==='logbook' ? '' : c[x.k];
    const hot = x.k==='today' && c.late; return `<button class="ni${v===x.k && !search?' on':''}" data-v="${x.k}"><span class="ic" style="color:${x.col}">${x.ic}</span>${x.n}<span class="c${hot?' hot':''}">${n||''}</span></button>`; }).join('');
  $('#listNav').innerHTML = wLists().map((l,i) => { const n = wTasks().filter(t => isOpen(t) && t.listId===l.id && !t.someday).length;
    return `<button class="ni${v==='list:'+l.id && !search?' on':''}" data-v="list:${l.id}"><span class="ic">${l.icon}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.name)}</span><i class="dot" style="background:${l.color}"></i><span class="c">${n||''}</span><span class="more" data-edit="${l.id}">${ICON.dots}</span></button>`; }).join('');
  $('#addList').style.display = wLists().length >= 6 ? 'none' : '';
  const w = W(); const th = THEMES.find(t => t.k===w.theme) || THEMES[0];
  $('#wselSw').style.background = th.g; $('#wselName').textContent = w.name; $('#wselSub').textContent = `${th.n} · ${wLists().length} list${wLists().length===1?'':'s'}${S.worlds.length>1 ? ` · ${S.worlds.length} worlds` : ''}`;
  $('#wtopName').textContent = w.name;
  // calm
  const open = wTasks().filter(t => isOpen(t) && !t.someday).length; const calm = open ? Math.round(100*(1 - Math.min(1, (c.inbox + c.late*.7)/Math.max(open,4)))) : 100;
  for (const r of [$('#calmRing'), $('#calmRing2')]){ r.querySelector('.fg').style.strokeDashoffset = 100.5*(1-calm/100); r.querySelector('.fg').style.stroke = calm<45 ? '#E5484D' : calm<75 ? '#F5A524' : '#2F9E6B'; r.querySelector('b').textContent = calm; }
  $('#calmRing').title = `Clear head: ${calm}%`;
  if (prevInbox !== null && prevInbox > 0 && c.inbox === 0 && !tri){ World.celebrate(); toast('Inbox zero. Clear head ☀️'); }
  prevInbox = c.inbox;
  const ms = $$('#modes button'); const items = wTasks(); const cnt = [c.inbox, items.filter(t => isOpen(t) && t.listId && !t.someday).length, items.filter(t => t.done && Date.now()-t.doneAt < 7*864e5).length];
  ms.forEach((b,i) => b.querySelector('em').textContent = cnt[i] || '');
}
let prevInbox = null;
if (EMB){
  window.SPYRMind = {
    getState: () => S,
    loadState(snap){
      if (!snap || snap.v!==6 || !Array.isArray(snap.tasks) || !Array.isArray(snap.lists) || !Array.isArray(snap.worlds) || !snap.worlds.length) return;
      if (String(snap.savedAt || '') <= String(S.savedAt || '')) return;
      S = snap; S.settings = Object.assign({appearance:'auto', density:'comfy', labels:'all', villagers:'cloud', time:'auto', snd:1, showDone:false, group:{}, closed:{}}, S.settings); if (!S.view) S.view = 'today'; if (!S.worlds.some(w => w.id===S.worldId)) S.worldId = S.worlds[0].id; lastBody = bodyJSON();
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
      applyPrefs(); renderAll();
    },
    setSaveStatus(){},
  };
  document.body.classList.add('embedded');
  const b = document.createElement('button'); b.id = 'spyrExit'; b.type = 'button'; b.textContent = '← SPYR';
  b.onclick = () => { clearTimeout(saveT); S.savedAt = new Date().toISOString(); try { localStorage.setItem(KEY, JSON.stringify(S)); window.dispatchEvent(new CustomEvent('spyr:mind-change', {detail: S})); } catch {}
    try { parent.postMessage({type:'spyr:mind-exit'}, location.origin); } catch {} };
  document.body.appendChild(b);
}
function renderAll(){ renderSide(); renderMain(); if (detailId) renderDetail(); syncWorld(); save(); }

/* ============================== world bridge ============================== */
function worldModel(){ const now = Date.now(), t0 = today(); const lists = wLists();
  const items = wTasks().filter(t => !t.someday && (!t.done || (t.doneAt && now - t.doneAt < 7*864e5))).map(t => ({id:t.id, title:t.title, listId:t.listId,
    state: t.done ? 'done' : t.focus ? 'focus' : t.listId ? 'planned' : 'loose', subsOpen:t.subs.filter(s=>!s.done).length, ageDays:(Date.now()-t.created)/864e5, dueToday:t.due===t0, stepsTotal:t.subs.length, steps:t.subs.filter(s=>!s.done).map(s => ({id:s.id, text:s.text})), overdue:isLate(t), doneAt:t.doneAt, fresh:fresh.has(t.id), _t:t}));
  const byList = {}; for (const it of items) if (it.state==='planned') (byList[it.listId] = byList[it.listId]||[]).push(it);
  for (const k in byList) byList[k].sort((a,b) => sortSmart(a._t, b._t)).forEach((it,i) => it.order = i);
  for (const it of items){ if (it.state==='focus') it.order = it._t.focus; else if (it.order===undefined) it.order = it._t.order; delete it._t; }
  fresh.clear(); return {lists, items}; }
function syncWorld(){ World.sync(worldModel()); World.setTheme(W().theme); }
const narrow = () => innerWidth < 1100;
function layoutViewport(){
  document.body.classList.toggle('narrow', narrow());
  const cs = getComputedStyle(document.documentElement), px = k => parseInt(cs.getPropertyValue(k)); const r = narrow() ? {x0:0, y0:64, x1:innerWidth, y1:innerHeight-150} : {x0:px('--side-w') + px('--main-w') + 24 + (detailId && innerWidth >= 1560 ? px('--det-w') + 12 : 0), y0:0, x1:innerWidth, y1:innerHeight-64};
  World.setViewport(r);
}
function worldVisible(){ return !narrow() || document.body.classList.contains('world'); }
function modeForView(v){ if (v==='inbox' || v==='today') return 0; if (v==='logbook') return 2; return 1; }

/* ============================== detail editor ============================== */
const det = $('#det');
function openDetail(id, focusTitle){ document.body.classList.toggle('detover', !narrow() && innerWidth < 1560); detailId = id; selId = id; renderDetail(); det.classList.add('open'); layoutViewport(); $$('.row').forEach(r => r.classList.toggle('sel', r.dataset.id===id)); World.setHighlight(id);
  if (focusTitle) setTimeout(() => { const ta = det.querySelector('.dtitle textarea'); ta && ta.focus(); }, 50); }
function closeDetail(){ detailId = null; det.classList.remove('open'); layoutViewport(); }
function renderDetail(){
  const t = getT(detailId); if (!t){ closeDetail(); return; } const L = listOf(t); const t0 = today();
  const d = t.subs.filter(s=>s.done).length;
  const dateChip = (lab, val) => `<button class="chip${(val==='someday' ? t.someday : t.due===val && !t.someday) ? ' on' : ''}" data-due="${val}">${lab}</button>`;
  det.innerHTML = `
  <div class="dh"><div class="lb"><i style="background:${L ? L.color : 'var(--inbox)'}"></i>${L ? L.icon+' '+esc(L.name) : 'Inbox'}${t.done ? ' · Done' : ''}</div>
    <button class="iconbtn${t.focus && !t.done ? ' on' : ''}" id="dFocus" title="Focus (S)" style="width:36px;height:36px">★</button>
    <button class="iconbtn" id="dMore" style="width:36px;height:36px">${ICON.dots}</button>
    <button class="iconbtn" id="dClose" style="width:36px;height:36px;font-size:20px">×</button></div>
  <div class="dbody scroll">
    <div class="dtitle${t.done?' done':''}" style="--pc:${['var(--ckb)','var(--p1)','var(--p2)','var(--p3)'][t.pri]}"><button class="ck" id="dCk">${ICON.check}</button><textarea rows="1" placeholder="Task">${esc(t.title)}</textarea></div>
    <textarea class="dnotes" rows="1" placeholder="Notes">${esc(t.notes)}</textarea>
    <div class="dsec" style="border:0;padding-top:4px"><label>Steps ${t.subs.length ? `<span class="bar"><i style="width:${d/t.subs.length*100}%"></i></span><span class="ct">${d}/${t.subs.length}</span>` : ''}</label>
      <div id="dSubs">${t.subs.map(s => `<div class="sub${s.done?' done':''}" data-sid="${s.id}"><button class="sck">${ICON.check}</button><input value="${esc(s.text)}"><button class="x">×</button></div>`).join('')}</div>
      <form class="addsub" id="dAddSubF"><span style="width:17px;text-align:center;color:var(--dim)">+</span><input id="dAddSub" enterkeyhint="done" autocomplete="off" placeholder="${t.subs.length ? 'Add a step' : 'Add steps. Each one follows the task around the town.'}"><button type="submit" class="addbtn">Add</button></form></div>
    <div class="dsec"><label>When</label>
      <div class="chiprow">${dateChip('Today', t0)}${dateChip('Tomorrow', addDays(t0,1))}${dateChip('Weekend', nextDow(6,false))}${dateChip('Next week', nextDow(1,true))}${dateChip('☾ Someday','someday')}${(t.due||t.someday) ? '<button class="chip" data-due="">Clear</button>' : ''}</div>
      <div class="prow"><input type="date" class="inp" id="dDate" value="${t.due||''}"><input type="time" class="inp" id="dTime" value="${t.time||''}"><select class="inp" id="dRep">
        ${[['','No repeat'],['daily','Every day'],['weekdays','Weekdays'],['weekly','Every week'],['weekly2','Every 2 weeks'],['monthly','Every month'],['yearly','Every year'],['dow','Every '+DOWL[fromKey(t.due||t0).getDay()]]].map(([k,n]) => { const cur = !t.repeat ? '' : t.repeat.type==='weekly' && t.repeat.every===2 ? 'weekly2' : t.repeat.type; return `<option value="${k}"${cur===k?' selected':''}>${n}</option>`; }).join('')}</select></div></div>
    <div class="dsec"><label>Priority</label><div class="seg" id="dPri">${['None','Low','Medium','High'].map((n,i) => `<button class="p${i}${t.pri===i?' on':''}" data-p="${i}">${n}</button>`).join('')}</div></div>
    <div class="dsec"><label>List</label><div class="chiprow" id="dList"><button class="chip${!t.listId?' on':''}" data-l=""><i style="background:var(--inbox)"></i>Inbox</button>${wLists().map(l => `<button class="chip${t.listId===l.id?' on':''}" data-l="${l.id}"><i style="background:${l.color}"></i>${esc(l.name)}</button>`).join('')}</div></div>
    <div class="dsec"><label>Tags</label><div class="tagin" id="dTags">${t.tags.map(g => `<span class="t">@${esc(g)}<button data-g="${esc(g)}">×</button></span>`).join('')}<input placeholder="Add tag" id="dTagIn"></div></div>
  </div>
  <div class="dfoot"><span>Added ${ago(t.created)}</span><span class="sp"></span><button id="dWorld">Show in world</button><button class="del" id="dDel">Delete</button></div>`;
  const ta = det.querySelector('.dtitle textarea'), nt = det.querySelector('.dnotes'); const auto = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight+'px'; }; auto(ta); auto(nt);
  ta.addEventListener('input', () => { auto(ta); t.title = ta.value.replace(/\n/g,' '); quiet(); });
  ta.addEventListener('keydown', e => { if (e.key==='Enter'){ e.preventDefault(); nt.focus(); } });
  nt.addEventListener('input', () => { auto(nt); t.notes = nt.value; quiet(); });
  $('#dCk').onclick = () => toggleDone(t.id);
  $('#dFocus').onclick = () => { setFocus(t, !(t.focus && !t.done)); if (t.done && t.focus) complete(t, false); renderAll(); };
  $('#dClose').onclick = closeDetail;
  $('#dDel').onclick = () => { snap(); delTask(t); renderAll(); toast('Deleted', true); };
  $('#dWorld').onclick = () => { if (narrow()){ closeDetail(); setWorld(true); } World.reveal(t.id); };
  $('#dMore').onclick = e => pop(e.currentTarget, [
    {n:'Duplicate', fn:() => { const c = {...JSON.parse(JSON.stringify(t)), id:uid(), created:Date.now(), focus:null, done:false, doneAt:null}; c.subs.forEach(s => s.id = uid()); S.tasks.push(c); fresh.add(c.id); renderAll(); openDetail(c.id); toast('Duplicated'); }},
    {n:t.someday ? 'Move out of Someday' : 'Move to Someday', fn:() => { t.someday = !t.someday; if (t.someday) t.focus = null; renderAll(); }},
    {n:'Copy as text', fn:() => { navigator.clipboard && navigator.clipboard.writeText([t.title, ...t.subs.map(s => `- [${s.done?'x':' '}] ${s.text}`), t.notes].filter(Boolean).join('\n')); toast('Copied'); }},
    {hr:true}, {n:'Delete', cls:'danger', fn:() => { snap(); delTask(t); renderAll(); toast('Deleted', true); }}]);
  det.querySelectorAll('[data-due]').forEach(b => b.onclick = () => { const v = b.dataset.due; if (v==='someday'){ t.someday = !t.someday; if (t.someday){ t.focus = null; } } else { t.due = v || null; t.someday = false; if (!v) t.time = null; } renderAll(); });
  $('#dDate').onchange = e => { t.due = e.target.value || null; t.someday = false; renderAll(); };
  $('#dTime').onchange = e => { t.time = e.target.value || null; if (t.time && !t.due) t.due = today(); renderAll(); };
  $('#dRep').onchange = e => { const v = e.target.value; t.repeat = !v ? null : v==='weekly2' ? {type:'weekly', every:2} : v==='dow' ? {type:'dow', dow:fromKey(t.due||today()).getDay()} : {type:v, every:1}; if (t.repeat && !t.due) t.due = today(); renderAll(); };
  $$('#dPri button').forEach(b => b.onclick = () => { t.pri = Number(b.dataset.p); renderAll(); });
  $$('#dList button').forEach(b => b.onclick = () => { t.listId = b.dataset.l || null; t.someday = false; renderAll(); World.followIfVisible(t.id); });
  $$('#dTags [data-g]').forEach(b => b.onclick = () => { t.tags = t.tags.filter(g => g!==b.dataset.g); renderAll(); });
  $('#dTagIn').addEventListener('keydown', e => { if ((e.key==='Enter' || e.key===',') && e.target.value.trim()){ e.preventDefault(); const g = e.target.value.trim().replace(/^[@#]/,'').toLowerCase(); if (!t.tags.includes(g)) t.tags.push(g); renderAll(); setTimeout(() => $('#dTagIn').focus(), 0); } });
  $$('#dSubs .sub').forEach(row => { const s = t.subs.find(x => x.id===row.dataset.sid);
    row.querySelector('.sck').onclick = () => { s.done = !s.done; if (s.done) World.ping(900, .12); if (t.subs.length && t.subs.every(x=>x.done) && !t.done){ renderAll(); toast('All steps done. Mark the task done?', false, 'Done', () => toggleDone(t.id)); } else renderAll(); };
    const inp = row.querySelector('input'); inp.oninput = () => { s.text = inp.value; quiet(); };
    inp.onkeydown = e => { if (e.key==='Enter'){ e.preventDefault(); $('#dAddSub').focus(); } if (e.key==='Backspace' && !inp.value){ e.preventDefault(); t.subs = t.subs.filter(x => x!==s); renderAll(); } };
    row.querySelector('.x').onclick = () => { t.subs = t.subs.filter(x => x!==s); renderAll(); }; });
  const addSteps = (keepFocus) => { const inp = $('#dAddSub'); if (!inp) return; const v = inp.value.trim(); if (!v) return; inp.value = '';
    v.split(/\n|,(?=\s)/).map(x=>x.trim()).filter(Boolean).forEach(text => t.subs.push({id:uid(), text, done:false})); World.ping(700,.08); renderAll(); if (keepFocus) setTimeout(() => { const n = $('#dAddSub'); n && n.focus(); }, 0); };
  $('#dAddSubF').addEventListener('submit', e => { e.preventDefault(); addSteps(true); });
  $('#dAddSub').addEventListener('keydown', e => { if ((e.key==='Enter' || e.keyCode===13) && !e.isComposing){ e.preventDefault(); e.stopPropagation(); addSteps(true); } });
  $('#dAddSub').addEventListener('input', e => { $('#dAddSubF').classList.toggle('has', !!e.target.value.trim()); });
  $('#dAddSub').addEventListener('blur', () => setTimeout(() => addSteps(false), 0));
  $('#dAddSub').addEventListener('paste', e => { const txt = (e.clipboardData||window.clipboardData).getData('text'); if (txt.includes('\n')){ e.preventDefault(); txt.split(/\n/).map(x=>x.replace(/^[-*•\[\]x ]+/,'').trim()).filter(Boolean).forEach(text => t.subs.push({id:uid(), text, done:false})); renderAll(); } });
}
let quietT; function quiet(){ clearTimeout(quietT); quietT = setTimeout(() => { renderSide(); renderMain(); syncWorld(); save(); }, 350); }

/* ============================== list interactions ============================== */
function toggleDone(id, rowEl){
  const t = getT(id); if (!t) return; snap();
  if (t.done){ complete(t, false); renderAll(); return; }
  const res = complete(t); World.ping(880, .1);
  const row = rowEl || listEl.querySelector(`.row[data-id="${id}"]`);
  if (row && !t.repeat){ row.classList.add('checking'); row.classList.add('collapse'); setTimeout(() => { renderSide(); renderMain(); }, 700); syncWorld(); save(); if (detailId===id) renderDetail(); }
  else renderAll();
  toast(res.next ? `Done. Next one ${fmtDate(res.next)}` : 'Done', true);
}
listEl.addEventListener('click', e => {
  if (suppressClick){ suppressClick = false; return; }
  const tog = e.target.closest('[data-tog]'); if (tog){ const k = S.view+'|'+tog.dataset.tog; const sec = tog.closest('.sec'); const closed = !sec.classList.contains('closed'); S.settings.closed[k] = closed; sec.classList.toggle('closed', closed); save(); return; }
  const row = e.target.closest('.row'); if (!row) return; const id = row.dataset.id;
  if (e.target.closest('.sadd')) return;
  if (e.target.closest('[data-steps]')){ expanded.has(id) ? expanded.delete(id) : expanded.add(id); renderMain(); return; }
  const sp = e.target.closest('.sp'); if (sp){ if (e.target.closest('b')){ const t = getT(id); const st = t.subs.find(x => x.id===sp.dataset.sid); st.done = !st.done; if (st.done) World.ping(900,.12); renderAll(); if (t.subs.every(x=>x.done) && !t.done) toast('All steps done. Mark the task done?', false, 'Done', () => toggleDone(t.id)); } else { openDetail(id); } return; }
  if (e.target.closest('.ck')){ toggleDone(id, row); return; }
  if (e.target.closest('.fx')){ const t = getT(id); setFocus(t, !t.focus); renderAll(); if (t.focus) World.ping(880,.12); return; }
  if (detailId===id && !narrow()){ closeDetail(); $$('.row.sel').forEach(r => r.classList.remove('sel')); selId = null; return; }
  openDetail(id); if (!narrow()) World.reveal(id);
});
const inlineAdd = (form, keep) => { const inp = form.querySelector('input'); const v = inp.value.trim(); if (!v) return; const id = form.closest('.row').dataset.id; const t = getT(id);
  v.split(/,(?=\s)/).map(x=>x.trim()).filter(Boolean).forEach(text => t.subs.push({id:uid(), text, done:false})); World.ping(700,.08); renderAll();
  if (keep) setTimeout(() => { const f = listEl.querySelector(`.row[data-id="${id}"] .sadd input`); f && f.focus(); }, 0); };
listEl.addEventListener('submit', e => { const f = e.target.closest('.sadd'); if (!f) return; e.preventDefault(); inlineAdd(f, true); });
listEl.addEventListener('focusout', e => { const f = e.target.closest && e.target.closest('.sadd'); if (f) setTimeout(() => { if (document.body.contains(f)) inlineAdd(f, false); }, 0); });
listEl.addEventListener('pointerover', e => { if (narrow()) return; const row = e.target.closest('.row'); World.setHighlight(row ? row.dataset.id : detailId); });
listEl.addEventListener('pointerleave', () => World.setHighlight(detailId));
// swipe (touch) + drag to reorder
let gest = null, suppressClick = false;
listEl.addEventListener('pointerdown', e => {
  const row = e.target.closest('.row'); if (!row || e.target.closest('.ck,.fx,.sadd,.steps')) return; const rows = row.parentElement; const reorder = rows.dataset.reorder==='1';
  gest = {row, id:row.dataset.id, x0:e.clientX, y0:e.clientY, mode:null, pid:e.pointerId, touch:e.pointerType!=='mouse', rows, reorder, grip:!!e.target.closest('.grip')};
  if (gest.touch && reorder) gest.timer = setTimeout(() => { if (gest && !gest.mode){ gest.mode = 'drag'; startDrag(); navigator.vibrate && navigator.vibrate(12); } }, 380);
});
addEventListener('pointermove', e => { if (!gest || e.pointerId!==gest.pid) return; const dx = e.clientX-gest.x0, dy = e.clientY-gest.y0;
  if (!gest.mode){ if (gest.touch && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)*1.3){ gest.mode = 'swipe'; clearTimeout(gest.timer); gest.row.setPointerCapture(e.pointerId); gest.bg = document.createElement('div'); gest.bg.className = 'swbg'; gest.row.prepend(gest.bg); }
    else if (!gest.touch && gest.reorder && (gest.grip || Math.abs(dy) > 6) && Math.abs(dy) > 4){ gest.mode = 'drag'; startDrag(); }
    else if (Math.abs(dy) > 10){ clearTimeout(gest.timer); gest = null; return; } }
  if (gest.mode==='swipe'){ const x = Math.max(-140, Math.min(140, dx)); gest.dx = x; gest.row.querySelector('.bd').style.transform = gest.row.querySelector('.ck').style.transform = `translateX(${x}px)`;
    gest.bg.style.opacity = Math.min(1, Math.abs(x)/90); gest.bg.style.background = x > 0 ? 'rgba(126,224,184,.22)' : 'rgba(255,184,107,.2)';
    gest.bg.innerHTML = x > 0 ? '<span style="color:var(--mint)">✓ Done</span><span></span>' : '<span></span><span style="color:var(--acc)">📅 Schedule</span>'; }
  if (gest.mode==='drag'){ e.preventDefault(); const r = gest.row; r.style.transform = `translateY(${e.clientY - gest.y0 - gest.shift}px)`;
    const sibs = [...gest.rows.querySelectorAll('.row')].filter(x => x!==r);
    for (const s of sibs){ const b = s.getBoundingClientRect(); const mid = b.top + b.height/2;
      if (e.clientY < mid && s.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING){ const before = r.getBoundingClientRect().top; gest.rows.insertBefore(r, s); gest.shift += r.getBoundingClientRect().top - before; r.style.transform = `translateY(${e.clientY - gest.y0 - gest.shift}px)`; break; }
      if (e.clientY > mid && s.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_PRECEDING){ const before = r.getBoundingClientRect().top; s.after(r); gest.shift += r.getBoundingClientRect().top - before; r.style.transform = `translateY(${e.clientY - gest.y0 - gest.shift}px)`; } } } }, {passive:false});
function startDrag(){ gest.row.classList.add('dragging'); gest.shift = 0; gest.row.setPointerCapture(gest.pid); }
addEventListener('pointerup', e => { if (!gest || e.pointerId!==gest.pid) return; clearTimeout(gest.timer); const g = gest; gest = null;
  if (g.mode==='swipe'){ suppressClick = true; setTimeout(() => suppressClick = false, 50); const x = g.dx||0; g.row.querySelector('.bd').style.transform = g.row.querySelector('.ck').style.transform = ''; g.bg && g.bg.remove();
    if (x > 90) toggleDone(g.id, g.row); else if (x < -90) scheduleMenu(g.row, getT(g.id)); }
  if (g.mode==='drag'){ suppressClick = true; setTimeout(() => suppressClick = false, 50); g.row.classList.remove('dragging'); g.row.style.transform = '';
    const ids = [...g.rows.querySelectorAll('.row')].map(r => r.dataset.id); const base = Date.now(); ids.forEach((id,i) => { const t = getT(id); if (t) t.order = base + i; });
    if (S.view.startsWith('list:')) S.settings.group[S.view.slice(5)] = 'none'; renderAll(); } });
function scheduleMenu(anchor, t){ const t0 = today(); pop(anchor, [
  {n:'☀️ Today', fn:() => { t.due = t0; t.someday = false; renderAll(); }}, {n:'🌅 Tomorrow', fn:() => { t.due = addDays(t0,1); t.someday = false; renderAll(); }},
  {n:'🛋 This weekend', fn:() => { t.due = nextDow(6,false); t.someday = false; renderAll(); }}, {n:'📅 Next week', fn:() => { t.due = nextDow(1,true); t.someday = false; renderAll(); }},
  {n:'☾ Someday', fn:() => { t.someday = true; t.focus = null; renderAll(); }}, {hr:true}, {n:'Pick a date…', fn:() => openDetail(t.id)}]); }

/* ============================== quick add ============================== */
const qa = $('#qaIn'), qaChips = $('#qaChips'), qaGo = $('#qaGo');
function qaUpdate(){ qa.style.height = 'auto'; qa.style.height = Math.min(140, qa.scrollHeight)+'px'; const v = qa.value.trim(); qaGo.classList.toggle('on', !!v);
  const lines = v.split('\n').filter(x => x.trim()); if (lines.length > 1){ qaChips.innerHTML = `<span class="sub">${lines.length} tasks</span>`; return; }
  qaChips.innerHTML = v ? chipsFor(parse(v)).map(([c,l]) => `<span class="${c}">${esc(l)}</span>`).join('') : ''; }
qa.addEventListener('input', qaUpdate);
qa.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); qaSubmit(); } if (e.key==='Escape') qa.blur(); });
qaGo.onclick = qaSubmit;
function qaSubmit(){ const lines = qa.value.split('\n').map(x => x.trim()).filter(Boolean); if (!lines.length) return;
  const made = lines.map(l => addTask(l)).filter(Boolean); qa.value = ''; qaUpdate(); renderAll();
  if (made.length===1){ const t = made[0]; const where = t.someday ? 'Someday' : t.listId ? listOf(t).name : 'Inbox'; const show = viewShows(t);
    toast(`Added to ${where}${t.due ? ' · '+fmtDate(t.due) : ''}`, false, show ? '' : 'Show', () => { setView(t.someday ? 'someday' : t.listId ? 'list:'+t.listId : 'inbox'); openDetail(t.id); }); }
  else toast(`${made.length} tasks added`); }
function viewShows(t){ return sectionsFor(S.view).some(s => s.items.includes(t)); }
$('#qaWgo').onclick = () => worldDrop(); $('#qaWin').addEventListener('keydown', e => { if (e.key==='Enter') worldDrop(); });
function worldDrop(){ const v = $('#qaWin').value.trim(); if (!v) return; const t = addTask(v, 'inbox'); $('#qaWin').value = ''; renderAll(); if (t && !t.listId && !t.someday){ World.setMode(0); toast('Dropped onto the Ideas island'); } else if (t) toast(`Added to ${t.someday ? 'Someday' : listOf(t) ? listOf(t).name : 'Inbox'}`); }

/* ============================== brain dump + triage ============================== */
const dumpTxt = $('#dumpTxt');
function dumpLines(){ const out = []; let parent = null;
  for (const raw of dumpTxt.value.split('\n')){ if (!raw.trim()){ parent = null; continue; }
    const indented = /^(\s{2,}|\t|\s*[-*•]\s)/.test(raw); let l = raw.replace(/^[-*•\d.)\s]+/,'').trim(); if (!l) continue;
    if (parent && indented){ parent.subs.push(l); continue; }
    if (/:\s*$/.test(l)){ parent = {title:l.replace(/:\s*$/,''), subs:[]}; out.push(parent); continue; }
    parent = null;
    if (!l.includes(':') && /;\s+/.test(l)) out.push(...l.split(/;\s+/).map(x=>x.trim()).filter(Boolean)); else if (!l.includes(':') && /,\s/.test(l)) out.push(...l.split(/,\s*/).map(x=>x.trim()).filter(Boolean)); else out.push(l); }
  return out.map(x => typeof x==='string' ? x : x.subs.length ? `${x.title}: ${x.subs.join(', ')}` : x.title); }
dumpTxt.addEventListener('input', () => { const ls = dumpLines(); $('#dumpN').textContent = ls.length ? `${ls.length} thought${ls.length>1?'s':''}` : '';
  $('#dumpOnly').disabled = $('#dumpSort').disabled = !ls.length;
  $('#dumpPrev').innerHTML = ls.slice(0,40).map((l,i) => { const p = parse(l); const c = chipsFor(p).map(x=>x[1]).join(' · '); return `<div class="it"><span class="n">${i+1}</span><span class="tx">${esc(p.title)}</span><span class="mt">${esc(c)}</span></div>`; }).join(''); });
function openDump(){ openMod('mDump'); dumpTxt.value = ''; dumpTxt.dispatchEvent(new Event('input')); setTimeout(() => dumpTxt.focus(), 60); }
function doDump(sort){ const ls = dumpLines(); if (!ls.length) return; const known = new Set(wTasks().filter(t => !t.done).map(t => t.title.trim().toLocaleLowerCase())); const unique = ls.filter(l => { const k = parse(l).title.trim().toLocaleLowerCase(); if (known.has(k)) return false; known.add(k); return true; }); const made = unique.map(l => addTask(l, 'inbox')).filter(Boolean); closeMod('mDump'); renderAll();
  World.setMode(0); toast(`${made.length} thought${made.length>1?'s':''} dropped on the Ideas island`);
  if (sort) setTimeout(() => openTriage(made.filter(t => !t.listId && !t.someday).map(t => t.id)), 350); }
$('#dumpOnly').onclick = () => doDump(false); $('#dumpSort').onclick = () => doDump(true);
dumpTxt.addEventListener('keydown', e => { if (e.key==='Enter' && (e.metaKey || e.ctrlKey)) doDump(true); });
let tri = null;
function openTriage(ids){ ids = ids || wTasks().filter(t => isOpen(t) && !t.listId && !t.someday).sort(sortManual).map(t => t.id); if (!ids.length){ toast('Inbox is clear'); return; }
  tri = {ids, i:0, done:0}; openMod('mTri'); renderTri(); if (!narrow()) World.setMode(0); }
function renderTri(){
  while (tri.i < tri.ids.length && !getT(tri.ids[tri.i])) tri.i++;
  if (tri.i >= tri.ids.length){ closeMod('mTri'); toast(`Sorted ${tri.done}. Inbox clear.`); World.setMode(1); tri = null; return; }
  const t = getT(tri.ids[tri.i]); const sug = suggestList(t.title); const t0 = today();
  $('#triN').textContent = `${tri.i+1} of ${tri.ids.length}`; $('#triBar').style.width = (tri.i/tri.ids.length*100)+'%';
  World.setHighlight(t.id);
  $('#triBody').innerHTML = `<div class="tri-card"><textarea rows="1" id="triTitle">${esc(t.title)}</textarea><div class="mt">${t.due ? '📅 '+fmtDate(t.due)+' · ' : ''}${t.subs.length ? t.subs.length+' steps · ' : ''}Added ${ago(t.created)}</div></div>
    <div class="tlbl">When</div><div class="chiprow" id="triWhen">${[['Today',t0],['Tomorrow',addDays(t0,1)],['Weekend',nextDow(6,false)],['Next week',nextDow(1,true)],['No date','']].map(([n,v]) => `<button class="chip${(t.due||'')===v?' on':''}" data-d="${v}">${n}</button>`).join('')}<button class="chip gold${t.focus?' on':''}" id="triFocus">★ Focus</button></div>
    <div class="tlbl">Where does it belong?</div><div class="lgrid">${wLists().map(l => `<button data-l="${l.id}" class="${sug && sug.id===l.id ? 'sug' : ''}"><span class="bi"><img src="art/b-${l.bld}-day.webp" alt=""></span><b><i style="background:${l.color}"></i>${esc(l.name)}</b></button>`).join('')}
      <button data-l="someday"><span class="bi" style="font-size:20px;align-items:center">🌙</span><b>Someday</b></button></div>`;
  const ta = $('#triTitle'); ta.style.height = ta.scrollHeight+'px'; ta.oninput = () => { t.title = ta.value.replace(/\n/g,' '); quiet(); };
  $$('#triWhen [data-d]').forEach(b => b.onclick = () => { t.due = b.dataset.d || null; renderTri(); syncWorld(); });
  $('#triFocus').onclick = () => { setFocus(t, !t.focus); renderTri(); renderAll(); };
  $$('#triBody .lgrid button').forEach(b => b.onclick = () => { const l = b.dataset.l; if (l==='someday'){ t.someday = true; t.focus = null; } else t.listId = l; tri.done++; tri.i++; renderAll(); World.ping(740); renderTri(); });
}
$('#triSkip').onclick = () => { tri.i++; renderTri(); };
$('#triDel').onclick = () => { const t = getT(tri.ids[tri.i]); snap(); delTask(t); tri.i++; renderAll(); renderTri(); toast('Deleted', true); };
$('#triDone').onclick = () => { const t = getT(tri.ids[tri.i]); complete(t); tri.done++; tri.i++; renderAll(); renderTri(); };

/* ============================== lists & worlds ============================== */
let editList = null;
function openListEditor(id){ const l = id ? S.lists.find(x => x.id===id) : null; if (!l && wLists().length >= 6){ toast('Each world has room for 6 buildings. Start a new world for more.'); return; }
  const used = new Set(wLists().map(x => x.bld)); editList = l ? {...l} : {id:null, name:'', color:COLORS[wLists().length % COLORS.length], icon:EMOJI[6], bld:(BUILDINGS.find(b => !used.has(b.k))||BUILDINGS[0]).k};
  $('#mlTitle').textContent = l ? 'Edit list' : 'New list'; $('#mlDel').style.display = l ? '' : 'none'; renderListEditor(); openMod('mList'); setTimeout(() => $('#mlName').focus(), 60); }
function renderListEditor(){ const e = editList;
  $('#mlBody').innerHTML = `<div class="fld"><label>Name</label><input class="inp" id="mlName" maxlength="24" value="${esc(e.name)}" placeholder="e.g. Errands"></div>
    <div class="fld"><label>Colour</label><div class="sws">${COLORS.map(c => `<button data-c="${c}" class="${e.color===c?'on':''}" style="background:${c}"></button>`).join('')}</div></div>
    <div class="fld"><label>Icon</label><div class="icons">${EMOJI.map(i => `<button data-i="${i}" class="${e.icon===i?'on':''}">${i}</button>`).join('')}</div></div>
    <div class="fld"><label>Building in the village</label><div class="blds">${BUILDINGS.map(b => `<button data-b="${b.k}" class="${e.bld===b.k?'on':''}"><img src="art/b-${b.k}-day.webp" alt="">${b.n}</button>`).join('')}</div>
    <p class="lede" style="margin-top:8px">The list's name is painted on the building's sign. Its tasks queue outside.</p></div>`;
  $('#mlName').oninput = ev => e.name = ev.target.value;
  $$('#mlBody [data-c]').forEach(b => b.onclick = () => { e.color = b.dataset.c; renderListEditor(); });
  $$('#mlBody [data-i]').forEach(b => b.onclick = () => { e.icon = b.dataset.i; renderListEditor(); });
  $$('#mlBody [data-b]').forEach(b => b.onclick = () => { e.bld = b.dataset.b; renderListEditor(); }); }
$('#mlSave').onclick = () => { const e = editList; if (!e.name.trim()){ $('#mlName').focus(); return; }
  if (e.id){ Object.assign(S.lists.find(x => x.id===e.id), {name:e.name.trim(), color:e.color, icon:e.icon, bld:e.bld}); }
  else { const l = {id:uid(), worldId:S.worldId, name:e.name.trim(), color:e.color, icon:e.icon, bld:e.bld, order:wLists().length}; S.lists.push(l); setView('list:'+l.id); }
  closeMod('mList'); renderAll(); };
$('#mlDel').onclick = () => { const e = editList; const n = S.tasks.filter(t => t.listId===e.id && !t.done).length; if (!confirm(`Delete “${e.name}”?${n ? ` Its ${n} open task${n>1?'s':''} will move to the Inbox.` : ''}`)) return;
  S.tasks.forEach(t => { if (t.listId===e.id) t.listId = null; }); S.lists = S.lists.filter(l => l.id!==e.id); wLists().forEach((l,i) => l.order = i); if (S.view==='list:'+e.id) setView('inbox'); closeMod('mList'); renderAll(); };
function openWorlds(){ renderWorlds(); openMod('mWorld'); }
let newW = null;
function renderWorlds(){ const body = $('#mwBody');
  body.innerHTML = `<p class="lede">Each world is its own island town with up to 6 buildings. Use them to keep big parts of life apart, like Work and Home.</p>
    <div class="wlist">${S.worlds.map(w => { const th = THEMES.find(t=>t.k===w.theme)||THEMES[0]; const n = S.tasks.filter(t => t.worldId===w.id && !t.done).length;
      return `<div class="w${w.id===S.worldId?' on':''}" data-w="${w.id}"><span class="sw" style="background:${th.g}"></span><b>${esc(w.name)}</b><span>${n} open</span><button class="ed" data-ed="${w.id}">${ICON.dots}</button></div>`; }).join('')}</div>
    ${newW ? `<div class="fld"><label>${newW.id ? 'Rename world' : 'New world'}</label><input class="inp" id="nwName" maxlength="20" value="${esc(newW.name)}" placeholder="e.g. Work"></div>
      <div class="fld"><label>Theme</label><div class="themes">${THEMES.map(t => `<button data-t="${t.k}" class="${newW.theme===t.k?'on':''}"><span class="sw" style="background:${t.g}"></span>${t.n}</button>`).join('')}</div></div>
      ${newW.id ? '' : `<div class="fld"><label>Start with</label><div class="chiprow">${[['life','Life · 6 lists'],['work','Work · 4 lists'],['blank','Blank · 2 lists']].map(([k,n]) => `<button class="chip${newW.tpl===k?' on':''}" data-tpl="${k}">${n}</button>`).join('')}</div></div>`}
      <div style="display:flex;gap:8px;justify-content:flex-end">${newW.id && S.worlds.length>1 ? '<button class="btn ghost danger" id="nwDel">Delete world</button><span style="flex:1"></span>' : ''}<button class="btn ghost" id="nwCancel">Cancel</button><button class="btn pri" id="nwSave">${newW.id ? 'Save' : 'Create world'}</button></div>`
    : `<button class="btn" id="nwNew" style="width:100%">+ New world</button>`}`;
  $$('#mwBody [data-w]').forEach(r => r.onclick = e => { if (e.target.closest('[data-ed]')) return; switchWorld(r.dataset.w); closeMod('mWorld'); });
  $$('#mwBody [data-ed]').forEach(b => b.onclick = () => { const w = S.worlds.find(x => x.id===b.dataset.ed); newW = {id:w.id, name:w.name, theme:w.theme}; renderWorlds(); });
  if ($('#nwNew')) $('#nwNew').onclick = () => { newW = {name:'', theme:'autumn', tpl:'blank'}; renderWorlds(); setTimeout(() => $('#nwName').focus(), 30); };
  if (newW){ $('#nwName').oninput = e => newW.name = e.target.value; $$('#mwBody [data-t]').forEach(b => b.onclick = () => { newW.theme = b.dataset.t; renderWorlds(); }); $$('#mwBody [data-tpl]').forEach(b => b.onclick = () => { newW.tpl = b.dataset.tpl; renderWorlds(); });
    $('#nwCancel').onclick = () => { newW = null; renderWorlds(); };
    $('#nwSave').onclick = () => { if (!newW.name.trim()){ $('#nwName').focus(); return; } if (newW.id){ Object.assign(S.worlds.find(w => w.id===newW.id), {name:newW.name.trim(), theme:newW.theme}); newW = null; renderAll(); renderWorlds(); }
      else { const w = addWorld(newW.name.trim(), newW.theme, newW.tpl); newW = null; switchWorld(w.id); closeMod('mWorld'); toast(`Welcome to ${w.name}`); } };
    if ($('#nwDel')) $('#nwDel').onclick = () => { const id = newW.id; const w = S.worlds.find(x => x.id===id); if (!confirm(`Delete the world “${w.name}” and everything in it?`)) return;
      S.worlds = S.worlds.filter(x => x.id!==id); S.lists = S.lists.filter(l => l.worldId!==id); S.tasks = S.tasks.filter(t => t.worldId!==id); newW = null; if (S.worldId===id) switchWorld(S.worlds[0].id); renderWorlds(); }; } }
function switchWorld(id){ S.worldId = id; closeDetail(); setView(S.view.startsWith('list:') ? 'today' : S.view); }

/* ============================== settings ============================== */
function openSettings(){ const st = S.settings;
  $('#msBody').innerHTML = `
    <div class="setrow"><div class="l"><b>Appearance</b><span>Panels and menus</span></div><div class="seg" id="sApp">${['auto','light','dark'].map(k => `<button data-k="${k}" class="${st.appearance===k?'on':''}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></div>
    <div class="setrow"><div class="l"><b>Density</b><span>Compact fits twice as many tasks</span></div><div class="seg" id="sDen"><button data-k="comfy" class="${st.density==='comfy'?'on':''}">Comfortable</button><button data-k="compact" class="${st.density==='compact'?'on':''}">Compact</button></div></div>
    <div class="setrow"><div class="l"><b>Labels in the world</b><span>Which villagers show their task</span></div><div class="seg" id="sLbl">${[['all','All'],['smart','Focus & unsorted'],['off','Off']].map(([k,n]) => `<button data-k="${k}" class="${st.labels===k?'on':''}">${n}</button>`).join('')}</div></div>
    <div class="setrow"><div class="l"><b>Villagers</b><span>How your tasks look in the town</span></div><div class="seg" id="sVil"><button data-k="cloud" class="${st.villagers==='cloud'?'on':''}">Clouds</button><button data-k="gen" class="${st.villagers==='gen'?'on':''}">People</button><button data-k="art" class="${st.villagers==='art'?'on':''}">Illustrated</button></div></div>
    <div class="setrow"><div class="l"><b>Reduce motion</b><span>Calmer town: no confetti, cheering or speech bubbles</span></div><div class="seg" id="sMotion"><button data-k="1" class="${st.reducedMotion?'on':''}">On</button><button data-k="0" class="${!st.reducedMotion?'on':''}">Off</button></div></div>
    <div class="setrow"><div class="l"><b>Time of day</b><span>Auto follows your clock</span></div><div class="seg" id="sTime">${['auto','day','dusk','night'].map(k => `<button data-k="${k}" class="${st.time===k?'on':''}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></div>
    <div class="setrow"><div class="l"><b>Sounds</b><span>Little chimes in the world</span></div><div class="seg" id="sSnd"><button data-k="1" class="${st.snd?'on':''}">On</button><button data-k="0" class="${!st.snd?'on':''}">Off</button></div></div>
    <div class="setrow"><div class="l"><b>How MIND works</b><span>The three islands, in three cards</span></div><button class="btn" id="sTour">Show tour</button></div>
    <div class="setrow"><div class="l"><b>Back up</b><span>Everything lives on this device. Save a copy now and then.</span></div><div style="display:flex;gap:6px"><button class="btn" id="sExp">Export</button><button class="btn" id="sImp">Import</button></div></div>
    <div class="setrow"><div class="l"><b>Start fresh</b><span>Replace everything with the sample town</span></div><button class="btn danger" id="sReset">Reset</button></div>
    <div class="tlbl">Keyboard</div><div class="kbdg"><kbd>N</kbd>New task<kbd>B</kbd>Brain dump<kbd>/</kbd>Search<kbd>1–5</kbd>Views<kbd>↑ ↓</kbd>Move<kbd>↵</kbd>Open<kbd>X</kbd>Complete<kbd>S</kbd>Focus<kbd>L</kbd>World labels<kbd>D</kbd>Density<kbd>⌫</kbd>Delete<kbd>Esc</kbd>Close</div>`;
  $$('#sApp button').forEach(b => b.onclick = () => { st.appearance = b.dataset.k; save(); applyPrefs(); openSettings(); });
  $$('#sDen button').forEach(b => b.onclick = () => { st.density = b.dataset.k; save(); applyPrefs(); openSettings(); });
  $$('#sVil button').forEach(b => b.onclick = () => { st.villagers = b.dataset.k; save(); applyPrefs(); openSettings(); });
  $$('#sMotion button').forEach(b => b.onclick = () => { st.reducedMotion = b.dataset.k==='1'; save(); applyPrefs(); openSettings(); });
  $$('#sLbl button').forEach(b => b.onclick = () => { st.labels = b.dataset.k; save(); applyPrefs(); openSettings(); });
  $$('#sTime button').forEach(b => b.onclick = () => { st.time = b.dataset.k; save(); openSettings(); syncTod(); });
  $$('#sSnd button').forEach(b => b.onclick = () => { st.snd = Number(b.dataset.k); save(); openSettings(); });
  $('#sTour').onclick = () => { closeMod('mSet'); setTimeout(openIntro, 250); };
  $('#sExp').onclick = () => { const blob = new Blob([JSON.stringify(S, null, 1)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `spyr-mind-${today()}.json`; a.click(); };
  $('#sImp').onclick = () => $('#importIn').click();
  $('#sReset').onclick = () => { if (!confirm('Replace everything with the sample town?')) return; localStorage.removeItem(KEY); location.reload(); };
  openMod('mSet'); }
$('#importIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (!d || d.v!==6 || !Array.isArray(d.tasks) || !Array.isArray(d.lists) || !Array.isArray(d.worlds) || !d.worlds.length) throw 0; if (!confirm(`Replace everything here with this backup (${d.tasks.length} tasks)?`)) return; S = d; save(); location.reload(); } catch { toast('That file isn’t a SPYR Mind backup'); } };
const mq = matchMedia('(prefers-color-scheme: dark)');
function applyPrefs(){ const st = S.settings; const dark = st.appearance==='dark' || (st.appearance==='auto' && mq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.querySelector('meta[name=theme-color]').content = dark ? '#161619' : '#FBFAF7';
  document.body.classList.toggle('compact', st.density==='compact'); World.setLabelMode(st.labels); World.setVillagerStyle(st.villagers); World.setReducedMotion(st.reducedMotion); $('#lbl').classList.toggle('on', st.labels!=='all'); }
mq.addEventListener && mq.addEventListener('change', applyPrefs);
$('#lbl').onclick = () => { const o = ['all','smart','off']; S.settings.labels = o[(o.indexOf(S.settings.labels)+1)%3]; save(); applyPrefs(); toast({all:'Labels: everyone', smart:'Labels: focus and unsorted only', off:'Labels: off'}[S.settings.labels]); };
function nightLevel(){ const t = S.settings.time; if (t==='day') return 0; if (t==='dusk') return .5; if (t==='night') return 1;
  const h = new Date().getHours() + new Date().getMinutes()/60; if (h < 5 || h >= 21) return 1; if (h < 7) return 1-(h-5)/2*.9; if (h < 17) return 0; if (h < 19.5) return (h-17)/2.5*.5; return .5+(h-19.5)/1.5*.5; }
function syncTod(){ $('#tod').classList.toggle('on', S.settings.time!=='auto'); $('#tod').textContent = {auto:'☾', day:'☀', dusk:'◐', night:'☾'}[S.settings.time]; }
$('#tod').onclick = () => { const o = ['auto','day','dusk','night']; S.settings.time = o[(o.indexOf(S.settings.time)+1)%4]; save(); syncTod(); toast('Time of day: '+S.settings.time); };

/* ============================== chrome: modals, pop, toast ============================== */
function openMod(id){ $('#'+id).classList.add('open'); }
function closeMod(id){ $('#'+id).classList.remove('open'); if (id==='mTri') World.setHighlight(detailId); }
$$('.mod').forEach(m => m.addEventListener('pointerdown', e => { if (e.target===m) closeMod(m.id); }));
$$('[data-close]').forEach(b => b.onclick = () => closeMod(b.closest('.mod').id));
const popEl = $('#pop');
function pop(anchor, items){ popEl.innerHTML = items.map((it,i) => it.hr ? '<hr>' : `<button data-i="${i}" class="${it.cls||''}">${it.n}${it.k ? `<span class="k">${it.k}</span>` : ''}</button>`).join('');
  const r = anchor.getBoundingClientRect(); popEl.classList.add('open'); const pw = popEl.offsetWidth, ph = popEl.offsetHeight;
  popEl.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.right - pw)) + 'px'; popEl.style.top = (r.bottom + ph + 8 > innerHeight ? Math.max(8, r.top - ph - 6) : r.bottom + 6) + 'px';
  popEl.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { popEl.classList.remove('open'); items[Number(b.dataset.i)].fn(); }); }
addEventListener('pointerdown', e => { if (popEl.classList.contains('open') && !popEl.contains(e.target)) popEl.classList.remove('open'); }, true);
let toastT, toastFn;
function toast(msg, canUndo, label, fn){ $('#toastT').textContent = msg; const b = $('#toastU'); toastFn = canUndo ? undo : fn; b.textContent = canUndo ? 'Undo' : (label || ''); $('#toast').classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => $('#toast').classList.remove('on'), canUndo || label ? 4200 : 2200); }
$('#toastU').onclick = () => { $('#toast').classList.remove('on'); toastFn && toastFn(); };

/* ============================== navigation ============================== */
function setView(v){ S.view = v; search = ''; $('#searchIn').value = ''; $('#search').classList.remove('on'); selId = null; document.body.classList.remove('drawer');
  World.setFilter(v.startsWith('list:') ? v.slice(5) : null); renderAll(); listEl.scrollTop = 0;
  if (v.startsWith('list:')){ const i = wLists().findIndex(l => l.id===v.slice(5)); World.setMode(1); }
  else World.setMode(modeForView(v)); }
$('#side').addEventListener('click', e => { const ed = e.target.closest('[data-edit]'); if (ed){ e.stopPropagation(); openListEditor(ed.dataset.edit); return; } const b = e.target.closest('[data-v]'); if (b) setView(b.dataset.v); });
$('#addList').onclick = () => openListEditor(null);
$('#wsel').onclick = openWorlds; $('#dumpBtn').onclick = openDump; $('#setBtn').onclick = openSettings;
$('#menuBtn').onclick = () => document.body.classList.add('drawer'); $('#scrim').onclick = () => document.body.classList.remove('drawer');
function setWorld(on){ document.body.classList.toggle('world', on); $('#peek').classList.remove('open'); if (on) World.setMode(World.getMode()); }
$('#worldTog').onclick = () => setWorld(true); $('#toList').onclick = () => setWorld(false);
$('#vTools').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
  if (b.id==='tSort') openTriage();
  if (b.id==='tSearch'){ const s = $('#search'); s.classList.toggle('on'); if (s.classList.contains('on')) $('#searchIn').focus(); else { search = ''; renderMain(); } b.classList.toggle('on'); }
  if (b.id==='tMore') openListEditor(S.view.slice(5));
  if (b.id==='tGroup'){ const id = S.view.slice(5); const cur = S.settings.group[id] || 'date'; pop(b, [['date','Due date'],['priority','Priority'],['tag','Tag'],['none','Manual (drag to reorder)']].map(([k,n]) => ({n:(cur===k?'✓ ':'   ')+n, fn:() => { S.settings.group[id] = k; renderAll(); }}))); } });
$('#searchIn').addEventListener('input', e => { search = e.target.value.trim(); renderMain(); renderSide(); });
$('#searchIn').addEventListener('keydown', e => { if (e.key==='Escape'){ search = ''; e.target.value = ''; $('#search').classList.remove('on'); renderAll(); } });
$$('#modes button').forEach(b => b.onclick = () => World.setMode(Number(b.dataset.m)));
$('#zin').onclick = () => World.zoomBy(1.3); $('#zout').onclick = () => World.zoomBy(1/1.3);
// peek (narrow world mode)
let peekId = null;
function openPeek(id){ const t = getT(id); if (!t) return; peekId = id; const L = listOf(t);
  $('#pkT').textContent = t.title; $('#pkM').textContent = [L ? L.icon+' '+L.name : 'Inbox', t.due ? fmtDate(t.due) : '', t.subs.length ? `${t.subs.filter(s=>s.done).length}/${t.subs.length} steps` : '', t.done ? 'Done' : ''].filter(Boolean).join(' · ');
  $('#pkFocus').textContent = t.focus ? '★ Unfocus' : '★ Focus'; $('#pkDone').textContent = t.done ? 'Reopen' : 'Done ✓'; $('#peek').classList.add('open'); World.setHighlight(id); }
$('#pkOpen').onclick = () => { $('#peek').classList.remove('open'); openDetail(peekId); };
$('#pkDone').onclick = () => { toggleDone(peekId); $('#peek').classList.remove('open'); };
$('#pkFocus').onclick = () => { const t = getT(peekId); setFocus(t, !t.focus); renderAll(); openPeek(peekId); };

/* ============================== keyboard ============================== */
addEventListener('keydown', e => {
  const tg = e.target || document.activeElement; const typing = /INPUT|TEXTAREA|SELECT/.test(tg.tagName) || tg.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key==='Escape'){ const open = $$('.mod.open'); if (open.length){ closeMod(open[open.length-1].id); return; } if (popEl.classList.contains('open')){ popEl.classList.remove('open'); return; } if (detailId){ closeDetail(); return; } if (document.body.classList.contains('world')){ setWorld(false); return; } }
  if (typing || e.metaKey || e.ctrlKey || e.altKey || $$('.mod.open').length) return;
  const k = e.key.toLowerCase();
  if (k==='n' || k==='q'){ e.preventDefault(); if (narrow()) setWorld(false); qa.focus(); return; }
  if (k==='b'){ e.preventDefault(); openDump(); return; }
  if (k==='/'){ e.preventDefault(); $('#search').classList.add('on'); $('#searchIn').focus(); return; }
  if (k==='w' && narrow()){ setWorld(!document.body.classList.contains('world')); return; }
  if (k==='l'){ $('#lbl').click(); return; }
  if (k==='d'){ S.settings.density = S.settings.density==='compact' ? 'comfy' : 'compact'; save(); applyPrefs(); toast(S.settings.density==='compact' ? 'Compact density' : 'Comfortable density'); return; }
  if ('12345'.includes(k)){ setView(SMART[Number(k)-1].k); return; }
  const rows = $$('#list .row'); const idx = rows.findIndex(r => r.dataset.id===selId);
  if (k==='arrowdown' || k==='j'){ e.preventDefault(); const r = rows[Math.min(rows.length-1, idx+1)]; if (r) selectRow(r); }
  if (k==='arrowup' || k==='k'){ e.preventDefault(); const r = rows[Math.max(0, idx-1)]; if (r) selectRow(r); }
  if (!selId) return; const t = getT(selId); if (!t) return;
  if (k==='enter'){ e.preventDefault(); openDetail(selId, true); }
  if (k==='x' || k===' '){ e.preventDefault(); toggleDone(selId); }
  if (k==='s'){ setFocus(t, !t.focus); renderAll(); }
  if (k==='backspace' || k==='delete'){ snap(); delTask(t); selId = null; renderAll(); toast('Deleted', true); }
});
function selectRow(r){ selId = r.dataset.id; $$('.row.sel').forEach(x => x.classList.remove('sel')); r.classList.add('sel'); r.scrollIntoView({block:'nearest'}); World.setHighlight(selId); if (detailId) openDetail(selId); }

/* ============================== boot ============================== */
addEventListener('resize', layoutViewport);
setInterval(() => { renderSide(); }, 60000);
let lastDay = today(); setInterval(() => { if (today()!==lastDay){ lastDay = today(); renderAll(); } }, 30000);
applyPrefs(); layoutViewport(); renderSide(); renderMain(); syncTod(); qaUpdate();
qa.placeholder = narrow() ? 'Add a task' : 'Add a task  ·  try “Pay rent fri !! #Money”';
World.initWorld({canvas:$('#world'), labels:$('#wlabels'), night:nightLevel, sound:() => !!S.settings.snd, visible:worldVisible, debug:/debug/.test(location.hash),
  onSelect: id => { if (narrow()) openPeek(id); else { openDetail(id); const r = listEl.querySelector(`.row[data-id="${id}"]`); r && r.scrollIntoView({block:'nearest', behavior:'smooth'}); } },
  onBackground: () => { $('#peek').classList.remove('open'); },
  onOpenList: id => { if (narrow()) setWorld(false); setView('list:'+id); },
  onMode: m => $$('#modes button').forEach(b => b.classList.toggle('on', Number(b.dataset.m)===m)),
  onDrop: (id, target) => { const t = getT(id); if (!t){ syncWorld(); return; } if (!target){ syncWorld(); return; } snap();
    if (target.type==='list'){ t.listId = target.listId; t.someday = false; if (t.done) complete(t, false); toast(`Moved to ${listOf(t).name}`, true); }
    else if (target.type==='focus'){ if (t.done) complete(t, false); setFocus(t, true); toast('On the stage ★', true); }
    else if (target.type==='inbox'){ t.listId = null; t.focus = null; if (t.done) complete(t, false); toast('Back to the Ideas island', true); }
    else if (target.type==='done'){ if (!t.done){ const r = complete(t); toast(r.next ? `Done · next one ${fmtDate(r.next)}` : 'Done · resting at the pond', true); } }
    renderAll(); },
}).then(() => { document.body.classList.add('ready'); syncWorld(); World.setMode(modeForView(S.view), false); layoutViewport();
  if (!S.settings.introSeen) setTimeout(openIntro, 900); })
  .catch(e => { console.error(e); worldFail(e); });

/* If the town can't start, say so where the town would be, with the reason, instead of a blank screen. */
function worldFail(e){
  const el = document.createElement('div'); el.id = 'wfail';
  el.innerHTML = `<b>The town couldn't load</b><span>Your tasks are safe. Send Claude a screenshot of this card.</span><code></code><button class="btn">Try again</button>`;
  el.querySelector('code').textContent = String(e && (e.message || e)) + ' · ' + navigator.userAgent.replace(/^Mozilla\/5\.0 /, '');
  el.querySelector('button').onclick = () => location.reload();
  document.body.appendChild(el);
}
/* Any other script error shows as a small red note (SPYR's error-box idea), so a screenshot tells the story. */
(() => { let box = null;
  const show = msg => { if (!box){ box = document.createElement('div'); box.id = 'errbox'; box.title = 'Tap to hide'; box.onclick = () => box.remove(); document.body.appendChild(box); }
    box.textContent = (box.textContent ? box.textContent + '\n' : '') + msg; };
  addEventListener('error', e => show((e.message || 'Error') + (e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno})` : '')));
  addEventListener('unhandledrejection', e => show('Promise: ' + String(e.reason && (e.reason.message || e.reason))));
})();

/* ============================== first-run tour ============================== */
const INTRO = [
  {m:0, k:'Ideas', t:'Empty your head', d:'Everything you add lands up here on the Ideas island as a little thought cloud. Dump it all, sort later.'},
  {m:1, k:'Village', t:'Sort into town', d:'Give a thought a list and it floats down to that building. Steps follow along as tiny clouds. Star up to three for the Focus stage.'},
  {m:2, k:'Pond', t:'Let it rest', d:'Check a task off and it drifts down to the pond to nap for a week. Clear the Ideas island for a little party.'},
];
let introAt = 0, introWasWorld = false;
function openIntro(){
  if (document.querySelector('.mod.open')) { setTimeout(openIntro, 1500); return; }
  introAt = 0; introWasWorld = document.body.classList.contains('world'); if (document.body.classList.contains('narrow')) setWorld(true);
  $('#intro').classList.add('open'); drawIntro();
}
function drawIntro(){
  const c = INTRO[introAt]; World.setMode(c.m);
  $('#intro').innerHTML = `<div class="ik">${introAt+1} of ${INTRO.length} · ${c.k}</div><h3>${c.t}</h3><p>${c.d}</p>
    <div class="if"><div class="dots">${INTRO.map((_, i) => `<i class="${i===introAt?'on':''}"></i>`).join('')}</div><span style="flex:1"></span>
    ${introAt < INTRO.length-1 ? '<button class="btn ghost" data-i="skip">Skip</button><button class="btn" data-i="next">Next</button>' : '<button class="btn" data-i="done">Start</button>'}</div>`;
}
function closeIntro(){ $('#intro').classList.remove('open'); S.settings.introSeen = true; save(); World.setMode(modeForView(S.view)); if (document.body.classList.contains('narrow') && !introWasWorld) setWorld(false); }
document.body.insertAdjacentHTML('beforeend', '<div id="intro" role="dialog" aria-label="How MIND works"></div>');
$('#intro').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return;
  if (b.dataset.i==='next'){ introAt++; drawIntro(); } else closeIntro(); });
syncWorld();
