import {blank,localDate,validate,validDate,ordered,upsert} from './model.js';
import {quoteFor} from './quotes.js';

/* SPYR Notebook. One parchment page per day: title, writing, mood, daily quote.
   v52.50 adds: writing prompts, photos on a page, On this day (memories from a month / years
   ago), and a Mood map (calendar of moods, last-30-days mix, mood line, writing streak).
   Photos are stored next to the notebook through window.SPYRPhotoStore (set by the SPYR host);
   standalone they stay on this device. */

const MOODS=[{id:1,c:'#C96A5A',name:'Rough',mouth:'M8 16.5 Q12 13.5 16 16.5'},{id:2,c:'#C9963A',name:'Low',mouth:'M8 15.5 Q12 14.5 16 15.5'},{id:3,c:'#9A9283',name:'Okay',mouth:'M8 15.5 H16'},{id:4,c:'#7FA88E',name:'Good',mouth:'M8 14.5 Q12 17 16 14.5'},{id:5,c:'#2A5445',name:'Great',mouth:'M7.5 14 Q12 18.5 16.5 14'}];
const face=(M,active,size=28)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="${active?M.c:'#cfc6b2'}"/><circle cx="8.6" cy="9.6" r="1.3" fill="#FFFDF4"/><circle cx="15.4" cy="9.6" r="1.3" fill="#FFFDF4"/><path d="${M.mouth}" fill="none" stroke="#FFFDF4" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const PROMPTS=[
 'What made you smile today?','What is one thing you want to remember about today?','What drained your energy, and what gave it back?',
 'Who are you grateful for right now, and why?','What is on your mind that you have not said out loud?','What did you learn today, big or small?',
 'Describe a moment today using all five senses.','What would make tomorrow a good day?','What are you proud of this week?',
 'What is something you are looking forward to?','What did your body need today? Did it get it?','Write a short letter to yourself a year from now.',
 'What is a worry you can let go of tonight?','What small win happened today?','Where did you feel most like yourself today?',
 'What conversation stuck with you, and why?','What habit is helping you lately? Which one is not?','If today had a title, what would it be?',
 'What are three things that went right?','What is something kind someone did for you recently?','What would you tell a friend going through your week?',
 'What are you avoiding, and what is the smallest first step?','Describe your ideal ordinary day.','What is a place that makes you feel calm?',
 'What surprised you today?','What did you do today just for you?','What are you curious about right now?','Finish this: lately I have been feeling…',
 'What is one thing you would do differently today?','What made today different from yesterday?','Who could you reach out to this week?',
 'What does rest look like for you right now?','What is a memory from this time last year?','What do you want more of in your life?','What do you want less of?',
 'Write down a goal and the next tiny step toward it.','What did you notice outside today?','What is a song, book or show you have been enjoying, and why?',
 'What is something you forgave yourself for?','How did you move your body today, and how did it feel?'];
const ICON={
 prompt:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M7 1h2v4H7zM7 11h2v4H7zM1 7h4v2H1zM11 7h4v2h-4zM6 6h4v4H6z" fill="currentColor"/></svg>',
 photo:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 4h3l1-2h6l1 2h3v10H1zM3 6v6h10V6z" fill="currentColor"/><path d="M6 7h4v4H6z" fill="currentColor"/></svg>',
 mood:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 2h14v12H1zM3 4v8h10V4z" fill="currentColor"/><path d="M4 5h2v2H4zM7 5h2v2H7zM10 5h2v2h-2zM4 8h2v2H4zM7 8h2v2H7z" fill="currentColor"/></svg>'};

const $=id=>document.getElementById(id),embedded=new URLSearchParams(location.search).get('embedded')==='1'||window.parent!==window,KEY='spyr-notebook:v1';
let state=blank(),draft,timer,confirmAction,hostStatus='managed',storageBlocked=false,dirty=false,memDismissed=false;
const newPage=()=>({id:crypto.randomUUID(),date:localDate(),title:'',body:'',updatedAt:new Date().toISOString()});
let todayPage=newPage();
try{if(!embedded){const raw=localStorage.getItem(KEY);if(raw)state=validate(JSON.parse(raw));}}catch{storageBlocked=true;$('notice').textContent='Your previous notebook could not be read. It has not been overwritten. Export any new writing before leaving.';}

/* ---------- photo store (host-provided; local fallback) ---------- */
const photoCache=new Map();
const localPhotos={async put(id,data){try{localStorage.setItem('spyr-nbphoto:'+id,data);}catch{throw Error('This device is out of space for photos.');}},async get(id){try{return localStorage.getItem('spyr-nbphoto:'+id);}catch{return null;}},async del(id){try{localStorage.removeItem('spyr-nbphoto:'+id);}catch{}}};
const photos=()=>window.SPYRPhotoStore||localPhotos;
/* inside SPYR the host hands over its photo store just after the pages load; wait for it */
async function store(){if(window.SPYRPhotoStore||!embedded)return photos();for(let i=0;i<60&&!window.SPYRPhotoStore;i++)await new Promise(r=>setTimeout(r,100));return photos();}
async function photoData(id){if(photoCache.has(id))return photoCache.get(id);const d=await (await store()).get(id).catch(()=>null);if(d)photoCache.set(id,d);return d;}
function shrink(file){return new Promise((res,rej)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const sc=Math.min(1,1200/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',.74));};img.onerror=()=>{URL.revokeObjectURL(url);rej(Error('That file is not a photo this browser can read.'));};img.src=url;});}

function pages(){const entries=ordered(state);if(draft&&!entries.some(e=>e.id===draft.id))entries.push(draft);if(!entries.some(e=>e.date===localDate())&&!entries.some(e=>e.id===todayPage.id))entries.push(todayPage);return ordered({entries});}
function status(){$('status').textContent=embedded?(hostStatus==='error'?'Not saved · retry':hostStatus==='saving'?'Saving…':hostStatus==='saved'?'Saved':''):storageBlocked?'Not saved · export a copy':'';$('retry').hidden=embedded?hostStatus!=='error':!storageBlocked;}
function persist(){if(!embedded&&!storageBlocked){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageBlocked=true;$('notice').textContent='Could not save on this device. Your writing is still here—export a backup.';}}window.dispatchEvent(new CustomEvent('spyr:notebook-change',{detail:structuredClone(state)}));status();}
const isEmpty=d=>!d.title.trim()&&!d.body.trim()&&d.mood==null&&!(d.photos||[]).length;
function commit(){clearTimeout(timer);if(!draft||!dirty)return;if(isEmpty(draft)&&!state.entries.some(e=>e.id===draft.id)){status();return;}state=upsert(state,draft);dirty=false;persist();navigation();}
function touch(delay=350){dirty=true;draft.updatedAt=new Date().toISOString();$('status').textContent='Saving…';clearTimeout(timer);timer=setTimeout(commit,delay);}
function navigation(){const all=pages(),index=all.findIndex(e=>e.id===draft.id);$('previous').disabled=index<=0;$('next').disabled=index>=all.length-1;$('position').textContent=(index+1)+' / '+all.length;$('remove').disabled=!state.entries.some(e=>e.id===draft.id);}
function drawMood(){const box=$('mood');box.replaceChildren();for(const M of MOODS){const b=document.createElement('button');b.type='button';b.className='face'+(draft.mood===M.id?' on':'');b.setAttribute('aria-pressed',String(draft.mood===M.id));b.setAttribute('aria-label','Mood: '+M.name);b.innerHTML=face(M,draft.mood==null||draft.mood===M.id);b.onclick=()=>{draft.mood=draft.mood===M.id?null:M.id;drawMood();touch(150);};box.append(b);}}

/* ---------- prompt ---------- */
function drawPrompt(){const box=$('prompt-card');box.hidden=!draft.prompt;document.body.classList.toggle('has-prompt',!!draft.prompt);if(!draft.prompt)return;$('prompt-text').textContent=draft.prompt;}
function pickPrompt(){const used=new Set(ordered(state).slice(-40).map(e=>e.prompt).filter(Boolean));const pool=PROMPTS.filter(p=>p!==draft.prompt&&!used.has(p));const list=pool.length?pool:PROMPTS.filter(p=>p!==draft.prompt);draft.prompt=list[Math.floor(Math.random()*list.length)];drawPrompt();touch();}
$('prompt-btn').onclick=pickPrompt;$('prompt-new').onclick=pickPrompt;$('prompt-clear').onclick=()=>{draft.prompt=null;drawPrompt();touch();};

/* ---------- photos ---------- */
async function drawPhotos(){const strip=$('photos');const list=draft.photos||[];strip.hidden=!list.length;document.body.classList.toggle('has-photos',!!list.length);strip.replaceChildren();const id=draft.id;for(const pid of list){const b=document.createElement('button');b.type='button';b.className='thumb';b.setAttribute('aria-label','Open photo');const img=document.createElement('img');img.alt='';b.append(img);b.onclick=()=>openPhoto(pid);strip.append(b);photoData(pid).then(d=>{if(draft.id!==id)return;if(d)img.src=d;else b.classList.add('missing');});}}
$('photo-btn').onclick=()=>{if((draft.photos||[]).length>=12){$('notice').textContent='A page holds up to 12 photos.';return;}$('photo-file').click();};
$('photo-file').onchange=async e=>{const files=[...(e.target.files||[])].slice(0,12-(draft.photos||[]).length);e.target.value='';if(!files.length)return;$('status').textContent='Adding photo…';try{for(const f of files){const data=await shrink(f);const pid='p'+crypto.randomUUID().replace(/-/g,'').slice(0,18);await (await store()).put(pid,data);photoCache.set(pid,data);draft.photos=[...(draft.photos||[]),pid];}$('notice').textContent='';drawPhotos();touch(50);}catch(err){$('notice').textContent=err.message||'Could not add that photo.';status();}};
let openPid=null;
async function openPhoto(pid){openPid=pid;$('lightbox-img').src=await photoData(pid)||'';$('lightbox').showModal();}
$('lightbox-remove').onclick=()=>{const pid=openPid;$('lightbox').close();draft.photos=(draft.photos||[]).filter(p=>p!==pid);if(!draft.photos.length)delete draft.photos;store().then(st=>st.del(pid));photoCache.delete(pid);drawPhotos();touch(50);};

/* ---------- On this day ---------- */
function memories(date){const [y,m,d]=date.split('-');const list=[];for(const e of ordered(state)){if(e.id===draft.id||(!e.title.trim()&&!e.body.trim()&&!(e.photos||[]).length))continue;const [ey,em,ed]=e.date.split('-');if(em===m&&ed===d&&ey<y)list.push({e,label:(y-ey)===1?'A year ago':`${y-ey} years ago`,rank:0});}
 if(!list.length){const mo=new Date(date+'T12:00:00');mo.setMonth(mo.getMonth()-1);const md=localDate(mo);const wk=new Date(date+'T12:00:00');wk.setDate(wk.getDate()-7);const wd=localDate(wk);for(const e of ordered(state)){if(e.title.trim()||e.body.trim()||(e.photos||[]).length){if(e.date===md)list.push({e,label:'A month ago',rank:1});else if(e.date===wd)list.push({e,label:'A week ago',rank:2});}}}
 return list.sort((a,b)=>a.rank-b.rank||b.e.date.localeCompare(a.e.date));}
function drawMemory(){const card=$('memory');const isToday=draft.date===localDate();const list=isToday&&!memDismissed?memories(draft.date):[];card.hidden=!list.length;if(!list.length)return;const {e,label}=list[0];$('memory-when').textContent=label+' · '+new Date(e.date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});$('memory-title').textContent=e.title||'Untitled page';$('memory-text').textContent=e.body.replace(/\s+/g,' ').slice(0,110)+(e.body.length>110?'…':'');const mm=MOODS.find(x=>x.id===e.mood);$('memory-face').innerHTML=mm?face(mm,true,20):'';$('memory-open').onclick=()=>turnTo(e,'backward');$('memory-more').textContent=list.length>1?`+${list.length-1} more`:'';}
$('memory-close').onclick=()=>{memDismissed=true;drawMemory();};

/* ---------- Mood map ---------- */
let mapMonth=null;
function streak(){const days=new Set(state.entries.filter(e=>e.body.trim()||e.title.trim()||e.mood!=null).map(e=>e.date));let n=0;const d=new Date();if(!days.has(localDate(d)))d.setDate(d.getDate()-1);while(days.has(localDate(d))){n++;d.setDate(d.getDate()-1);}return n;}
function moodOn(date){const es=state.entries.filter(e=>e.date===date);const withMood=es.filter(e=>e.mood!=null).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));return{mood:withMood.length?withMood.at(-1).mood:null,wrote:es.some(e=>e.body.trim()||e.title.trim())};}
function drawMap(){const base=mapMonth||new Date();const y=base.getFullYear(),m=base.getMonth();$('map-month').textContent=base.toLocaleDateString(undefined,{month:'long',year:'numeric'});const grid=$('map-grid');grid.replaceChildren();for(const w of ['M','T','W','T','F','S','S']){const h=document.createElement('span');h.className='wk';h.textContent=w;grid.append(h);}
 const first=new Date(y,m,1),lead=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),today=localDate();for(let i=0;i<lead;i++)grid.append(document.createElement('span'));
 for(let d=1;d<=days;d++){const date=localDate(new Date(y,m,d)),info=moodOn(date),cell=document.createElement('button');cell.type='button';cell.className='day'+(date===today?' today':'')+(date>today?' future':'');const M=MOODS.find(x=>x.id===info.mood);cell.innerHTML=M?face(M,true,22):`<b>${d}</b>${info.wrote?'<i></i>':''}`;cell.setAttribute('aria-label',date+(M?' · '+M.name:info.wrote?' · wrote':''));if(M||info.wrote)cell.onclick=()=>{const e=ordered(state).filter(x=>x.date===date).at(-1);if(e){$('moodmap').close();turnTo(e);}};else cell.disabled=true;grid.append(cell);}
 $('map-next').disabled=y===new Date().getFullYear()&&m===new Date().getMonth();
 /* last 30 days */
 const counts=[0,0,0,0,0];const line=[];for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const mo=moodOn(localDate(d)).mood;if(mo){counts[mo-1]++;}line.push(mo);}
 const total=counts.reduce((a,b)=>a+b,0),max=Math.max(1,...counts);const bars=$('map-bars');bars.replaceChildren();MOODS.forEach((M,i)=>{const row=document.createElement('div');row.className='bar';row.innerHTML=`${face(M,true,18)}<span class="track"><span style="width:${counts[i]/max*100}%;background:${M.c}"></span></span><b>${counts[i]}</b>`;bars.append(row);});
 const avg=total?counts.reduce((a,c,i)=>a+c*(i+1),0)/total:0;const top=total?MOODS[counts.indexOf(max)]:null;
 $('map-summary').textContent=total?`Mostly ${top.name.toLowerCase()} lately · average ${avg.toFixed(1)} of 5`:'Tap a face on a page to start your mood map.';
 /* mood line (last 30 days, gaps where no mood) */
 const W=300,H=70;let path='',pen=false;line.forEach((v,i)=>{const x=6+i*(W-12)/29;if(v){const yy=H-8-(v-1)*(H-16)/4;path+=(pen?' L':' M')+x.toFixed(1)+','+yy.toFixed(1);pen=true;}else pen=false;});
 const dots=line.map((v,i)=>v?`<rect x="${(6+i*(W-12)/29-3).toFixed(1)}" y="${(H-8-(v-1)*(H-16)/4-3).toFixed(1)}" width="6" height="6" fill="${MOODS[v-1].c}"/>`:'').join('');
 $('map-line').innerHTML=`<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true">${[1,2,3,4,5].map(v=>`<line x1="0" x2="${W}" y1="${H-8-(v-1)*(H-16)/4}" y2="${H-8-(v-1)*(H-16)/4}" stroke="#b9a67c44" stroke-dasharray="3 4"/>`).join('')}<path d="${path}" fill="none" stroke="#7a6a4c" stroke-width="2"/>${dots}</svg>`;
 const st=streak(),written=new Set(state.entries.filter(e=>e.body.trim()||e.title.trim()).map(e=>e.date)).size;const words=state.entries.reduce((a,e)=>a+(e.body.trim()?e.body.trim().split(/\s+/).length:0),0);
 $('map-stats').innerHTML=`<div><b>${st}</b><span>day streak</span></div><div><b>${written}</b><span>days written</span></div><div><b>${words.toLocaleString()}</b><span>words</span></div>`;}
$('mood-btn').onclick=()=>{commit();mapMonth=null;drawMap();$('moodmap').showModal();};
$('map-prev').onclick=()=>{const b=mapMonth||new Date();mapMonth=new Date(b.getFullYear(),b.getMonth()-1,1);drawMap();};
$('map-next').onclick=()=>{const b=mapMonth||new Date();mapMonth=new Date(b.getFullYear(),b.getMonth()+1,1);drawMap();};

/* ---------- page ---------- */
function draw(){const date=new Date(draft.date+'T12:00:00');$('calendar').replaceChildren();const q=quoteFor(draft.date);$('quote').replaceChildren();const qt=document.createElement('p'),qb=document.createElement('small');qt.textContent='“'+q.t+'”';qb.textContent='— '+q.by;$('quote').append(qt,qb);drawMood();const n=ordered(state).findIndex(e=>e.id===draft.id);$('entry-no').textContent=n>=0?'PAGE '+String(n+1).padStart(2,'0'):'NEW PAGE';const day=document.createElement('b'),month=document.createElement('span');day.textContent=date.getDate();month.textContent=date.toLocaleDateString(undefined,{month:'long',year:'numeric'});$('calendar').append(day,month);$('date-label').textContent=date.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'});$('title').value=draft.title;$('body').value=draft.body;$('body').scrollTop=0;wordCount();drawPrompt();drawPhotos();drawMemory();status();navigation();}
function wordCount(){const words=draft.body.trim()?draft.body.trim().split(/\s+/).length:0;$('words').textContent=words+' '+(words===1?'word':'words');}
function turnTo(entry,direction='forward'){commit();const old={...draft};draft=structuredClone(entry);draw();if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const layer=$('turn');layer.replaceChildren();const title=document.createElement('h2'),body=document.createElement('p');title.textContent=old.title||'Untitled';body.textContent=old.body;layer.append(title,body);layer.className='';void layer.offsetWidth;layer.className=direction;}}
function today(){commit();const existing=ordered(state).filter(e=>e.date===localDate()).at(-1);turnTo(existing||todayPage);$('body').focus();}
function change(delta){const all=pages(),index=all.findIndex(e=>e.id===draft.id),entry=all[index+delta];if(entry)turnTo(entry,delta<0?'backward':'forward');}
for(const id of ['title','body'])$(id).addEventListener('input',()=>{draft.title=$('title').value;draft.body=$('body').value;wordCount();touch();});
$('previous').onclick=()=>change(-1);$('next').onclick=()=>change(1);$('today').onclick=today;
function renderIndex(){const query=$('search').value.toLowerCase();$('list').replaceChildren();const matches=ordered(state).reverse().filter(e=>(e.date+' '+e.title+' '+e.body+' '+(e.prompt||'')).toLowerCase().includes(query));if(!matches.length){$('list').textContent=state.entries.length?'No matching pages.':'No entries yet.';return;}for(const e of matches){const b=document.createElement('button'),date=document.createElement('small'),title=document.createElement('strong'),excerpt=document.createElement('p');const M=MOODS.find(x=>x.id===e.mood);date.innerHTML=(M?face(M,true,14)+' ':'')+e.date+((e.photos||[]).length?` · ${e.photos.length} photo${e.photos.length>1?'s':''}`:'');title.textContent=e.title||'Untitled';excerpt.textContent=e.body.slice(0,120)||'';b.append(date,title,excerpt);b.onclick=()=>{$('index').close();turnTo(e);};$('list').append(b);}}
$('browse').onclick=()=>{commit();renderIndex();$('index').showModal();};$('search').oninput=renderIndex;
$('change-date').onclick=()=>{$('date-input').value=draft.date;$('dates').showModal();};$('date-cancel').onclick=()=>$('dates').close();$('date-form').onsubmit=e=>{e.preventDefault();if(!validDate($('date-input').value))return;if(draft.id===todayPage.id&&$('date-input').value!==todayPage.date)todayPage=newPage();dirty=true;draft.date=$('date-input').value;draft.updatedAt=new Date().toISOString();commit();draw();$('dates').close();};
function confirm(title,copy,action){$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;confirmAction=action;$('confirm').showModal();}$('cancel').onclick=()=>$('confirm').close();$('proceed').onclick=()=>{$('confirm').close();confirmAction?.();confirmAction=null;};
$('remove').onclick=()=>confirm('Remove this page?','This deletes the current entry and its photos. Export a backup first if you want to keep a copy.',()=>{clearTimeout(timer);dirty=false;for(const p of draft.photos||[])store().then(st=>st.del(p));state.entries=state.entries.filter(e=>e.id!==draft.id);draft=structuredClone(ordered(state).at(-1)||newPage());persist();draw();});
$('export').onclick=()=>{commit();const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='spyr-notebook.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>10000000)throw Error('Choose a backup smaller than 10 MB.');const incoming=validate(JSON.parse(await f.text()));confirm('Replace this notebook?',incoming.entries.length+' entries will replace your current notebook. Export your current notebook first to keep a copy.',()=>{clearTimeout(timer);dirty=false;state=incoming;draft=structuredClone(ordered(state).at(-1)||newPage());persist();draw();});}catch(error){$('notice').textContent=error.message;}finally{$('file').value='';}};
$('retry').onclick=()=>{if(embedded){window.dispatchEvent(new CustomEvent('spyr:notebook-retry'));return;}try{const existing=localStorage.getItem(KEY);if(existing)validate(JSON.parse(existing));storageBlocked=false;persist();}catch{$('notice').textContent='The stored notebook is still unreadable. Export your current writing before resolving device storage.';}};
window.addEventListener('pagehide',commit);document.addEventListener('visibilitychange',()=>{if(document.hidden)commit();});document.addEventListener('keydown',e=>{if(e.altKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')&&!document.querySelector('dialog[open]')){e.preventDefault();change(e.key==='ArrowLeft'?-1:1);}});
for(const [id,ic] of [['prompt-btn','prompt'],['photo-btn','photo'],['mood-btn','mood']])$(id).insertAdjacentHTML('afterbegin',ICON[ic]);
window.SPYRNotebook={getState(){commit();return structuredClone(state);},loadState(raw){const next=validate(raw);clearTimeout(timer);dirty=false;state=next;draft=structuredClone(ordered(state).filter(e=>e.date===localDate()).at(-1)||todayPage);draw();},flush:commit,setSaveStatus(value){hostStatus=value;status();}};
if(embedded){$('export').hidden=true;$('import').hidden=true;$('host-exit').hidden=false;document.body.classList.add('embedded');$('host-exit').onclick=()=>{commit();try{window.parent.postMessage({type:'spyr:notebook-exit'},location.origin);}catch{}};}
draft=structuredClone(ordered(state).filter(e=>e.date===localDate()).at(-1)||todayPage);draw();
