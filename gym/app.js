import {categories,collection,movements,duration,workSteps} from './collection-data.js';
import {createSession} from './collection-session.js';
import {CollectionScene} from './collection-scene.js';

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const el=(tag,cls,html)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>{t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
const embedded=window.parent!==window;
const post=msg=>{if(embedded){try{window.parent.postMessage(msg,location.origin);}catch{}}};
const img=name=>`assets/${name}.webp`;
const shortCue=m=>{const c=(m.cue||'').split(/(?<=\.)\s+/)[0]||'';return c.length>90?c.slice(0,87).replace(/\s+\S*$/,'')+'…':c;};
const STORE={active:'spyr-gym:active:v2',history:'spyr-gym:history'};
const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d;}catch{return d;}};
const write=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v));}catch{}};

/* ---------- audio: one soft chime, made on the fly ---------- */
let ac=null;
function chime(kind='end'){try{ac??=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();const t=ac.currentTime,notes=kind==='go'?[523.25,659.25]:[659.25,523.25];notes.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.18);g.gain.linearRampToValueAtTime(.18,t+i*.18+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.18+.5);o.connect(g).connect(ac.destination);o.start(t+i*.18);o.stop(t+i*.18+.55);});}catch{}}

/* ---------- wake lock ---------- */
let lock=null;
async function keepAwake(on){try{if(on&&!lock&&navigator.wakeLock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null;});}else if(!on&&lock){await lock.release();lock=null;}}catch{lock=null;}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&view==='play'&&session&&!session.paused)keepAwake(true);});

/* ---------- state ---------- */
const root=$('#app');
let view='rooms',roomId=null,workout=null,engine=null,session=null,scene=null,raf=0,last=0,started=false,confirmLeave=false;

/* ---------- routing ---------- */
function go(hash){location.hash=hash;}
function route(){
  const p=new URLSearchParams(location.hash.slice(1));
  const sid=p.get('session'),rid=p.get('room');
  stopLoop();
  if(sid&&collection.some(w=>w.id===sid)){workout=collection.find(w=>w.id===sid);roomId=workout.category;renderIntro();return;}
  if(rid&&categories.some(c=>c.id===rid)){roomId=rid;renderRoom();return;}
  renderRooms();
}
window.addEventListener('hashchange',route);

/* ---------- views ---------- */
function header(title,back){
  const h=el('header','top');
  if(back){const b=el('button','icon back');b.setAttribute('aria-label','Back');b.innerHTML=ico('back');b.onclick=back;h.append(b);}
  else if(embedded){const b=el('button','icon back');b.setAttribute('aria-label','Back to SPYR');b.innerHTML=ico('back');b.onclick=()=>post({type:'spyr:gym-exit'});h.append(b);}
  h.append(el('h1','title',esc(title)));
  return h;
}
function ico(n){return{
  back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  pause:'<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next:'<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
}[n];}

function renderRooms(){
  view='rooms';document.body.dataset.view=view;root.replaceChildren();
  root.append(header('SPYR Gym'));
  const grid=el('div','rooms');
  for(const c of categories){
    const n=collection.filter(w=>w.category===c.id).length;
    const a=el('a','room-card');a.href='#room='+c.id;
    a.innerHTML=`<img src="${img(c.image)}" alt="" loading="lazy"><div class="room-body"><span class="room-name">${esc(c.name)}</span><span class="muted">${n} session${n===1?'':'s'}</span></div>`;
    grid.append(a);
  }
  root.append(grid);window.scrollTo(0,0);
}

function renderRoom(){
  view='room';document.body.dataset.view=view;root.replaceChildren();
  const c=categories.find(x=>x.id===roomId);
  root.append(header(c.name,()=>go('')));
  const list=el('div','sessions');
  for(const w of collection.filter(w=>w.category===c.id)){
    const a=el('a','session-card');a.href='#session='+w.id;
    const moves=[...new Set(w.entries.map(e=>movements[e.key].name))];
    a.innerHTML=`<img src="${img(w.background)}" alt="" loading="lazy"><div class="session-body"><span class="session-title">${esc(w.title)}</span><span class="muted">${esc(duration(w))} · ${esc(w.trainerName)}</span></div>`;
    list.append(a);
  }
  root.append(list);window.scrollTo(0,0);
}

function renderIntro(){
  view='intro';document.body.dataset.view=view;root.replaceChildren();
  const w=workout;engine=createSession(w);
  const saved=read(STORE.active,null),resumable=engine.valid(saved)&&saved.workoutId===w.id;
  const wrap=el('div','intro');
  wrap.style.setProperty('--bg',`url(${img(w.background)})`);
  const h=el('header','top over');
  const b=el('button','icon back');b.setAttribute('aria-label','Back');b.innerHTML=ico('back');b.onclick=()=>go('room='+w.category);h.append(b);
  wrap.append(h);
  const sheet=el('div','sheet');
  const sets=workSteps(w).length;
  const steps=[...new Set(w.entries.map(e=>e.key))].map(k=>{const e=w.entries.find(x=>x.key===k),m=movements[k];const n=w.entries.filter(x=>x.key===k).length;const rhs=w.mode==='sets'?`${e.sets}×${e.reps}`:`${w.entries.filter(x=>x.key===k).length*(w.rounds||1)}×${e.seconds}s`;return`<li><span>${esc(m.name)}</span><span class="muted">${rhs}</span></li>`;}).join('');
  sheet.innerHTML=`<h2 class="display">${esc(w.title)}</h2><p class="meta">${esc(duration(w))} · ${sets} ${w.mode==='sets'?'sets':'intervals'} · ${esc(w.trainerName)}</p><ul class="steps">${steps}</ul>`;
  const actions=el('div','actions');
  const start=el('button','primary',resumable?'Resume':'Start');start.onclick=()=>startSession(resumable?saved:null);
  actions.append(start);
  if(resumable){const fresh=el('button','ghost','Start over');fresh.onclick=()=>{write(STORE.active,null);startSession(null);};actions.append(fresh);}
  sheet.append(actions);wrap.append(sheet);root.append(wrap);window.scrollTo(0,0);
}

/* ---------- player ---------- */
let ui={};
async function startSession(saved){
  const w=workout;view='play';document.body.dataset.view=view;root.replaceChildren();
  session=saved??engine.fresh();started=!!saved;confirmLeave=false;
  const stage=el('div','stage');
  const canvas=el('canvas','scene');stage.append(canvas);
  const top=el('header','top over play-top');
  const close=el('button','icon');close.setAttribute('aria-label','Leave session');close.innerHTML=ico('close');close.onclick=askLeave;
  const bar=el('div','bar','<i></i>');const elapsed=el('span','elapsed','0:00');
  top.append(close,bar,elapsed);stage.append(top);
  const status=el('div','status','Preparing the room…');stage.append(status);
  const sheet=el('div','sheet play-sheet');
  sheet.innerHTML=`<div class="row"><span class="phase"></span><button class="icon pause" aria-label="Pause">${ico('pause')}</button></div><h2 class="display move"></h2><p class="cue"></p><div class="row bottom"><div class="big"><strong class="value"></strong><span class="unit"></span></div><div class="btns"></div></div>`;
  stage.append(sheet);root.append(stage);
  ui={canvas,bar:bar.firstChild,elapsed,status,phase:sheet.querySelector('.phase'),pause:sheet.querySelector('.pause'),move:sheet.querySelector('.move'),cue:sheet.querySelector('.cue'),value:sheet.querySelector('.value'),unit:sheet.querySelector('.unit'),btns:sheet.querySelector('.btns'),sheet};
  ui.pause.onclick=togglePause;
  scene=new CollectionScene(canvas,m=>{status.textContent=m||'';status.hidden=!m;});
  try{await scene.load(w);status.hidden=true;}catch(e){status.textContent='This room could not load.';}
  if(!started)await new Promise(r=>setTimeout(r,80));
  render();startLoop();keepAwake(true);
}
function togglePause(){if(!session||session.status!=='active')return;session.paused=!session.paused;keepAwake(!session.paused);render();}
function startLoop(){last=performance.now();const frame=now=>{const dt=Math.min(1,(now-last)/1000);last=now;if(session&&session.status==='active'){const before=engine.current(session)?.id;engine.tick(session,dt);const cur=engine.current(session);if(session.status==='finished'){finish();return;}if(cur&&cur.id!==before){onStep(cur);render();}else if(cur&&cur.kind!=='lift')updateNumbers();}scene?.update(dt);raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);}
function stopLoop(){cancelAnimationFrame(raf);raf=0;keepAwake(false);}
function onStep(p){chime(p.kind==='rest'||p.kind==='cooldown'?'end':'go');save();}
function save(){if(session&&session.status==='active')write(STORE.active,session);}
function phaseLabel(p){const side=p.side?` · ${p.side}`:'';if(p.kind==='warmup')return'Warm-up';if(p.kind==='cooldown')return'Cool-down';if(p.kind==='rest')return'Rest';if(workout.mode==='sets')return`Set ${p.set} of ${p.sets}${side}`;const total=workout.rounds||1;return(total>1?`Round ${p.round} of ${total}`:'Work')+side;}
function updateNumbers(){const p=engine.current(session);if(!p)return;ui.value.textContent=p.kind==='lift'?p.reps:fmt(session.remaining);ui.elapsed.textContent=fmt(session.elapsed);}
function render(){
  if(!session||session.status!=='active')return;
  const p=engine.current(session),m=movements[p.key],stats=engine.stats(session),w=workout;
  const animate=p.kind==='lift'||p.kind==='work'||(w.audio&&['warmup','cooldown'].includes(p.kind));
  scene.set(p.key,animate?'work':'rest',session.paused,stats.processed/Math.max(1,stats.total),p.side);
  ui.bar.style.width=(stats.processed/Math.max(1,stats.total)*100)+'%';
  ui.phase.textContent=['warmup','cooldown'].includes(p.kind)?workout.trainerName:phaseLabel(p);
  ui.move.textContent=p.kind==='rest'?'Rest':p.kind==='warmup'?'Warm-up':p.kind==='cooldown'?'Cool-down':m.name;
  const next=engine.plan[session.index+1];
  ui.cue.textContent=p.kind==='rest'?(next?`Next: ${movements[next.key].name}`:''):p.kind==='warmup'?`First up: ${m.name}`:p.kind==='cooldown'?'':shortCue(m);
  ui.unit.textContent=p.kind==='lift'?'reps':'';
  ui.pause.innerHTML=session.paused?ico('play'):ico('pause');ui.pause.setAttribute('aria-label',session.paused?'Resume':'Pause');
  ui.sheet.classList.toggle('paused',session.paused);ui.sheet.dataset.kind=p.kind;
  ui.btns.replaceChildren();
  if(p.kind==='lift'){const b=el('button','primary',ico('check')+'<span>Done</span>');b.onclick=()=>{engine.advance(session,'complete');after();};ui.btns.append(b);}
  else if(p.kind==='rest'){const plus=el('button','ghost','+30s');plus.onclick=()=>{session.remaining+=30;updateNumbers();};const skip=el('button','primary','<span>Skip</span>'+ico('next'));skip.onclick=()=>{engine.advance(session,'skip');after();};ui.btns.append(plus,skip);}
  else{const skip=el('button','ghost',p.kind==='work'?'End early':'Skip');skip.onclick=()=>{engine.advance(session,'skip');after();};ui.btns.append(skip);}
  updateNumbers();
}
function after(){if(session.status==='finished'){finish();return;}onStep(engine.current(session));render();}
function askLeave(){
  if(!session||session.status!=='active'){go('room='+workout.category);return;}
  const wasPaused=session.paused;session.paused=true;render();
  const m=el('div','modal');m.innerHTML=`<div class="card"><h3 class="display">Leave for now?</h3></div>`;
  const acts=el('div','actions');const stay=el('button','ghost','Keep going');const leave=el('button','primary','Leave');
  stay.onclick=()=>{m.remove();session.paused=wasPaused;keepAwake(!wasPaused);render();};
  leave.onclick=()=>{save();stopLoop();m.remove();go('room='+workout.category);};
  acts.append(stay,leave);m.firstChild.append(acts);root.append(m);
}
function finish(){
  stopLoop();const w=workout,stats=engine.stats(session);
  const record={...structuredClone(session),date:new Date().toISOString(),title:w.title,trainer:w.trainer,trainerName:w.trainerName,complete:stats.completed===stats.total,stamp:stats.completed===stats.total?w.stamp:null,elapsed:session.elapsed};
  let hist=read(STORE.history,[]);if(!Array.isArray(hist))hist=[];hist=hist.filter(h=>h.logId!==record.logId).concat(record).slice(-100);write(STORE.history,hist);write(STORE.active,null);
  window.dispatchEvent(new CustomEvent('spyr:workout-complete',{detail:structuredClone(record)}));post({type:'spyr:gym-complete',record:structuredClone(record)});
  chime('end');
  view='done';document.body.dataset.view=view;
  const stage=root.querySelector('.stage');if(stage){stage.querySelector('.play-sheet')?.remove();stage.querySelector('.play-top')?.remove();scene?.set(engine.plan.at(-1).key,'rest',true,1);}
  const sheet=el('div','sheet done');
  sheet.innerHTML=`<div class="tick">${ico('check')}</div><h2 class="display">${esc(w.title)}</h2><p class="meta">${fmt(session.elapsed)} · ${stats.completed} of ${stats.total} ${w.mode==='sets'?'sets':'intervals'}</p>`;
  const b=el('button','primary','Finish');b.onclick=()=>go('room='+w.category);
  const acts=el('div','actions');acts.append(b);sheet.append(acts);(stage||root).append(sheet);
  session=null;
}

/* ---------- boot ---------- */
route();
