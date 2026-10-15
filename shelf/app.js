import{blank,validate,shelves,log,setStatus,finishes,CAPACITY}from'./model.js';

/* SPYR Shelf v2. The cabinet keeps its three shelves: Currently reading, Completed (with the
   numbered full-shelf collection), Want to read. Books come from a search of Open Library
   (free, covers + page counts) or by hand. Each book has progress (pages or %), a live reading
   timer, star rating, review, notes & quotes, history, edit, did-not-finish. Year in books:
   goal, stats, monthly pages, collection. */

const $=id=>document.getElementById(id),embedded=new URLSearchParams(location.search).get('embedded')==='1'||window.parent!==window,KEY='spyr-reading:v1',TKEY='spyr-reading:timer';
let loaded=!(new URLSearchParams(location.search).get('embedded')==='1'||window.parent!==window);let state=blank(),blocked=false,archive=null,readingPage=0,wantPage=0,confirmAction,openId=null,pickStatus='reading',picked=null;
try{if(!embedded&&localStorage.getItem(KEY))state=validate(JSON.parse(localStorage.getItem(KEY)));}catch{blocked=true;$('notice').textContent='Stored library could not be read. It has not been overwritten. Export new changes before leaving.';}
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const dayOf=iso=>{const d=new Date(iso);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const fmtDate=iso=>new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
const bookOf=id=>state.books.find(b=>b.id===id);
function status(text){$('save-status').textContent=text;$('retry').hidden=!blocked;}
function save(session){if(!embedded&&!blocked)try{localStorage.setItem(KEY,JSON.stringify(state));}catch{blocked=true;}status(embedded?'Saving…':blocked?'Not saved · export a copy':'Saved on this device');window.dispatchEvent(new CustomEvent('spyr:reading-change',{detail:structuredClone(state)}));if(session)window.dispatchEvent(new CustomEvent('spyr:reading-session',{detail:structuredClone(session)}));render();if(openId&&$('book-dialog').open)drawBook();}
function update(fn){const next=structuredClone(state);fn(next);state=validate(next);save();}

/* ---------- cabinet ---------- */
const COLORS=['#526d61','#7d4e49','#526176','#8a6b40','#655578','#6f7347'];
function spine(b,i){const button=el('button',undefined,'book'+(b.status==='dnf'?' dnf':''));let hash=0;for(const c of b.id)hash=(hash*31+c.charCodeAt(0))>>>0;button.style.setProperty('--book-color',COLORS[hash%6]);button.style.setProperty('--height',(158+hash%33)+'px');button.style.setProperty('--spine-width',(23+hash%12)+'px');button.style.setProperty('--lean',i===0?'-3deg':'0deg');
 const prog=b.status==='completed'?'✓':b.status==='want'?(b.rating?'★':'·'):Math.round(b.page/b.total*100)+'%';
 button.setAttribute('aria-label',b.title+', '+(b.status==='completed'?'completed':b.status==='want'?'want to read':b.page+' of '+b.total+' pages'));button.title=b.title+(b.author?' — '+b.author:'');
 button.append(el('span','✦','ornament'),el('span',b.title,'spine-title'),el('span',prog,'spine-progress'));button.onclick=()=>openBook(b.id);return button;}
function row(id,books,empty,addBtn){const node=$(id);node.replaceChildren();if(!books.length){node.append(el('p',empty,'empty'));if(addBtn){const b=el('button','+ Add a book','empty-add');b.onclick=openAdd;node.append(b);}return;}books.forEach((b,i)=>node.append(spine(b,i)));if(addBtn){const ab=el('button','+ Add','spine-add');ab.setAttribute('aria-label','Add a book');ab.onclick=openAdd;node.append(ab);}}
function pager(navId,list,page,set){const nav=$(navId);nav.replaceChildren();if(list.length<=CAPACITY)return;for(const [text,delta]of[['←',-1],['→',1]]){const b=el('button',text);b.disabled=delta<0?page===0:(page+1)*CAPACITY>=list.length;b.onclick=()=>{set(page+delta);render();};nav.append(b);}}
function render(){const g=shelves(state);if(archive!==null&&archive>=g.archived.length)archive=null;
 readingPage=Math.min(readingPage,Math.max(0,Math.ceil(g.reading.length/CAPACITY)-1));wantPage=Math.min(wantPage,Math.max(0,Math.ceil(g.want.length/CAPACITY)-1));
 row('reading',g.reading.slice(readingPage*CAPACITY,(readingPage+1)*CAPACITY),'No current reads.',true);
 const comp=archive===null?[...g.recent,...g.dnf].slice(-CAPACITY):g.archived[archive];
 row('completed',comp,'Finished books will appear here.');$('completed-label').textContent=archive===null?'Completed':'Shelf '+(archive+1);$('close-shelf').hidden=archive===null;
 row('collection-slots',g.want.slice(wantPage*CAPACITY,(wantPage+1)*CAPACITY),'Books you want to read go here.');
 pager('reading-nav',g.reading,readingPage,v=>readingPage=v);pager('want-nav',g.want,wantPage,v=>wantPage=v);
 const yr=new Date().getFullYear(),doneYr=state.books.filter(b=>finishes(b).some(d=>new Date(d).getFullYear()===yr)).length;
 $('count').textContent=state.goal&&state.goal.year===yr?`${doneYr} / ${state.goal.books} books in ${yr}`:state.books.filter(b=>finishes(b).length).length+' finished';
 $('minutes').textContent=state.sessions.reduce((a,s)=>a+s.minutes,0).toLocaleString()+' minutes read';drawTimer();}
$('close-shelf').onclick=()=>{archive=null;render();};

/* ---------- add a book ---------- */
function openAdd(){$('q').value='';$('results').replaceChildren();$('search-note').textContent='Search millions of books, or add one by hand.';$('pick-form').hidden=true;$('search-form').hidden=false;$('manual-btn').hidden=false;$('add-dialog').showModal();setTimeout(()=>$('q').focus(),60);}
$('add').onclick=openAdd;
$('search-form').onsubmit=async e=>{e.preventDefault();const q=$('q').value.trim();if(!q)return;$('search-note').textContent='Searching…';$('results').replaceChildren();
 try{const isbn=q.replace(/[-\s]/g,'');const url=/^\d{10}(\d{3})?$/.test(isbn)?`https://openlibrary.org/search.json?isbn=${isbn}&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i&limit=12`:`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i&limit=15`;
  const r=await fetch(url);const d=await r.json();const docs=(d.docs||[]).filter(x=>x.title);
  $('search-note').textContent=docs.length?'Tap a book to add it.':'Nothing found. Try fewer words, or add it by hand.';
  for(const x of docs){const b=el('button',undefined,'result');const cover=Number.isInteger(x.cover_i)?`https://covers.openlibrary.org/b/id/${x.cover_i}-M.jpg`:'';b.innerHTML=`<span class="cv">${cover?`<img src="${cover.replace('-M','-S')}" alt="" loading="lazy">`:'<i>✦</i>'}</span><span class="rt"><strong>${esc(x.title)}</strong><span>${esc((x.author_name||[])[0]||'Unknown author')}${Number.isInteger(x.first_publish_year)?' · '+x.first_publish_year:''}${Number.isInteger(x.number_of_pages_median)?' · '+x.number_of_pages_median+' pages':''}</span></span>`;
   b.onclick=()=>pick({title:x.title.slice(0,160),author:((x.author_name||[])[0]||'').slice(0,160),total:Number.isInteger(x.number_of_pages_median)?x.number_of_pages_median:'',cover,olid:String(x.key||'').slice(0,59),year:Number.isInteger(x.first_publish_year)?x.first_publish_year:undefined});$('results').append(b);}
 }catch{$('search-note').textContent='Couldn’t reach the book search. Check your connection, or add it by hand.';}};
function pick(p){picked=p;$('search-form').hidden=true;$('results').replaceChildren();$('search-note').textContent='';$('manual-btn').hidden=true;$('pick-form').hidden=false;$('pick-error').textContent='';
 $('pick-cover').hidden=!p.cover;if(p.cover)$('pick-cover').src=p.cover;$('pick-title').textContent=p.title||'New book';$('pick-author').textContent=p.author||'';
 $('m-title').value=p.title||'';$('m-author').value=p.author||'';$('m-total').value=p.total||'';setPick('reading');if(!p.title)$('m-title').focus();else if(!p.total)$('m-total').focus();}
function setPick(s){pickStatus=s;for(const b of $('pick-status').children)b.classList.toggle('on',b.dataset.s===s);}
for(const b of $('pick-status').children)b.onclick=()=>setPick(b.dataset.s);
$('manual-btn').onclick=()=>pick({title:'',author:'',total:''});$('pick-back').onclick=openAdd;
$('pick-form').onsubmit=e=>{e.preventDefault();try{const total=Number($('m-total').value);if(!Number.isInteger(total)||total<1)throw Error('Enter the number of pages (a whole number).');const now=new Date().toISOString(),done=pickStatus==='completed';
 const b={id:crypto.randomUUID(),title:$('m-title').value.trim(),author:$('m-author').value.trim(),total,page:done?total:0,status:pickStatus,createdAt:now,...(done?{completedAt:now}:{}),...(pickStatus==='reading'?{startedAt:now}:{}),...(picked?.cover?{cover:picked.cover}:{}),...(picked?.olid?{olid:picked.olid}:{}),...(picked?.year?{year:picked.year}:{})};
 if(!b.title)throw Error('Add a title.');state=validate({...state,books:[...state.books,b]});save();$('add-dialog').close();openBook(b.id);}catch(err){$('pick-error').textContent=err.message;}};

/* ---------- a book ---------- */
function openBook(id){openId=id;drawBook();if(!$('book-dialog').open)$('book-dialog').showModal();}
function stars(r){let h='';for(let i=1;i<=5;i++){const f=r>=i?'full':r>=i-.5?'half':'';h+=`<span class="star ${f}" data-i="${i}"><b data-v="${i-.5}"></b><b data-v="${i}"></b></span>`;}return h;}
function drawBook(){const b=bookOf(openId);const v=$('book-view');if(!b){$('book-dialog').close();return;}
 const pct=Math.round(b.page/b.total*100),sess=state.sessions.filter(s=>s.bookId===b.id).reverse(),mins=sess.reduce((a,s)=>a+s.minutes,0);
 const label={want:'WANT TO READ',reading:'READING',completed:'FINISHED',dnf:'DID NOT FINISH'}[b.status];
 const t=timer();const timing=t&&t.bookId===b.id;
 v.innerHTML=`<div class="bk-head"><span class="bk-cover">${b.cover?`<img src="${esc(b.cover)}" alt="">`:`<i style="--book-color:${COLORS[[...b.id].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,0)%6]}">✦</i>`}</span><div><small>${label}</small><h2>${esc(b.title)}</h2><p class="by">${esc(b.author||'Unknown author')}${b.year?' · '+b.year:''}</p><button id="bk-edit" class="linkish">Edit details</button></div></div>
 <div class="bk-progress"><div class="bar"><span style="width:${pct}%"></span></div><span>${b.page} / ${b.total} pages · ${pct}%${mins?` · ${mins} min`:''}</span></div>
 ${b.status==='reading'?`<form id="bk-log" class="bk-log"><div class="seg small" id="bk-unit"><button type="button" data-u="page" class="on">Page</button><button type="button" data-u="pct">%</button></div><label class="inl">Now on<input id="bk-to" type="number" inputmode="numeric" min="${b.page}" max="${b.total}" value="${b.page}"></label><label class="inl">Minutes<input id="bk-min" type="number" inputmode="numeric" min="0" max="1440" value="20"></label><button class="primary">Log</button></form><p id="bk-err" class="err" role="alert"></p>
 <div class="bk-actions"><button id="bk-timer" class="${timing?'primary':''}">${timing?'Stop timer':'▶ Reading timer'}</button><button id="bk-done">Finished it</button><button id="bk-dnf">Didn’t finish</button></div>`:''}
 ${b.status==='want'?`<div class="bk-actions"><button id="bk-start" class="primary">Start reading</button><button id="bk-done">Already read it</button></div>`:''}
 ${b.status==='completed'||b.status==='dnf'?`<p class="note">${b.status==='completed'?'Finished '+fmtDate(b.completedAt):'Stopped '+fmtDate(b.endedAt||b.createdAt)}${b.startedAt?' · started '+fmtDate(b.startedAt):''}</p><div class="bk-actions"><button id="bk-again">${b.status==='dnf'?'Pick it back up':'Read it again'}</button></div>`:''}
 <h3>Your rating</h3><div class="stars" id="bk-stars" aria-label="Rating">${stars(b.rating||0)}${b.rating?`<button id="bk-unrate" class="linkish">clear</button>`:''}</div>
 <h3>Review</h3><textarea id="bk-review" rows="3" maxlength="5000" placeholder="What did you think?">${esc(b.review||'')}</textarea>
 <h3>Notes & quotes</h3><form id="bk-note" class="bk-note"><div class="seg small" id="bk-kind"><button type="button" data-k="note" class="on">Note</button><button type="button" data-k="quote">Quote</button></div><textarea id="bk-note-t" rows="2" maxlength="2000" placeholder="A thought, or a line worth keeping"></textarea><div class="row"><label class="inl">Page<input id="bk-note-p" type="number" min="1" max="${b.total}" placeholder="—"></label><button class="primary">Save</button></div></form>
 <div class="notes">${(b.notes||[]).slice().reverse().map(n=>`<div class="n ${n.kind}"><p>${n.kind==='quote'?'“'+esc(n.t)+'”':esc(n.t)}</p><span>${n.page?'p. '+n.page+' · ':''}${fmtDate(n.at)}<button data-del="${esc(n.id)}" aria-label="Delete">×</button></span></div>`).join('')}</div>
 ${sess.length?`<h3>History</h3><div class="hist">${sess.slice(0,30).map(s=>`<p>${fmtDate(s.at)} · ${s.minutes} min · pages ${s.from}–${s.to}</p>`).join('')}</div>`:''}`;
 $('bk-edit').onclick=openEdit;
 if(b.status==='reading'){let unit='page';const seg=$('bk-unit');for(const x of seg.children)x.onclick=()=>{unit=x.dataset.u;for(const y of seg.children)y.classList.toggle('on',y===x);$('bk-to').value=unit==='pct'?pct:b.page;$('bk-to').max=unit==='pct'?100:b.total;$('bk-to').min=unit==='pct'?pct:b.page;};
  $('bk-log').onsubmit=e=>{e.preventDefault();try{let p=Number($('bk-to').value);if(unit==='pct')p=Math.max(b.page,Math.min(b.total,Math.round(b.total*Math.min(100,p)/100)));state=log(state,b.id,{page:p,minutes:Number($('bk-min').value)||0});save(state.sessions.at(-1));if(bookOf(b.id).status==='completed')$('notice').textContent='Finished “'+b.title+'”. Rate it while it’s fresh.';}catch(err){$('bk-err').textContent=err.message;}};
  $('bk-timer').onclick=()=>{if(timing)stopTimer();else startTimer(b.id);};
  const bankTimer=()=>{const t=timer();if(t&&t.bookId===b.id){const m=Math.min(1440,Math.max(1,Math.round((Date.now()-t.start)/60000)));try{state=log(state,b.id,{page:bookOf(b.id).page,minutes:m});}catch{}clearTimer();}};
  $('bk-done').onclick=()=>{bankTimer();state=setStatus(state,b.id,'completed');save(state.sessions.at(-1));};
  $('bk-dnf').onclick=()=>confirm('Stop reading this book?','It moves to your Completed shelf marked as not finished. You can pick it back up any time.',()=>{bankTimer();state=setStatus(state,b.id,'dnf');save();});}
 if(b.status==='want'){$('bk-start').onclick=()=>{state=setStatus(state,b.id,'reading');save();};$('bk-done').onclick=()=>{state=setStatus(state,b.id,'completed');save();};}
 if($('bk-again'))$('bk-again').onclick=()=>{state=setStatus(state,b.id,'reading');save();};
 $('bk-stars').onclick=e=>{const v=Number(e.target.dataset?.v);if(v)update(s=>{s.books.find(x=>x.id===b.id).rating=v;});};
 if($('bk-unrate'))$('bk-unrate').onclick=()=>update(s=>{delete s.books.find(x=>x.id===b.id).rating;});
 $('bk-review').onchange=()=>update(s=>{const x=s.books.find(x=>x.id===b.id);const t=$('bk-review').value.trim();if(t)x.review=t;else delete x.review;});
 let kind='note';for(const x of $('bk-kind').children)x.onclick=()=>{kind=x.dataset.k;for(const y of $('bk-kind').children)y.classList.toggle('on',y===x);};
 $('bk-note').onsubmit=e=>{e.preventDefault();const t=$('bk-note-t').value.trim();if(!t)return;const p=Number($('bk-note-p').value);update(s=>{const x=s.books.find(x=>x.id===b.id);x.notes=[...(x.notes||[]),{id:crypto.randomUUID(),t,kind,at:new Date().toISOString(),...(Number.isInteger(p)&&p>0?{page:p}:{})}];});};
 for(const d of v.querySelectorAll('[data-del]'))d.onclick=()=>update(s=>{const x=s.books.find(x=>x.id===b.id);x.notes=(x.notes||[]).filter(n=>n.id!==d.dataset.del);});}

/* ---------- edit ---------- */
function openEdit(){const b=bookOf(openId);$('e-title').value=b.title;$('e-author').value=b.author||'';$('e-total').value=b.total;$('e-page').value=b.page;$('edit-error').textContent='';$('edit-dialog').showModal();}
$('edit-form').onsubmit=e=>{e.preventDefault();try{const total=Number($('e-total').value),page=Number($('e-page').value);if(!Number.isInteger(total)||total<1)throw Error('Pages must be a whole number.');if(!Number.isInteger(page)||page<0||page>total)throw Error('Current page must be between 0 and '+total+'.');
 update(s=>{const x=s.books.find(x=>x.id===openId);x.title=$('e-title').value.trim()||x.title;x.author=$('e-author').value.trim();x.total=total;x.page=x.status==='completed'?total:page;for(const ss of s.sessions)if(ss.bookId===x.id&&ss.to>total)ss.to=total;for(const ss of s.sessions)if(ss.bookId===x.id&&ss.from>ss.to)ss.from=ss.to;});$('edit-dialog').close();}catch(err){$('edit-error').textContent=err.message;}};
$('edit-delete').onclick=()=>confirm('Remove this book?','The book, its notes and its reading history will be removed.',()=>{const id=openId;if(timer()?.bookId===id)clearTimer();state={...state,books:state.books.filter(b=>b.id!==id),sessions:state.sessions.filter(s=>s.bookId!==id)};$('edit-dialog').close();$('book-dialog').close();openId=null;save();});

/* ---------- reading timer (survives closing the shelf) ---------- */
const timer=()=>{try{return JSON.parse(localStorage.getItem(TKEY)||'null');}catch{return null;}};
const clearTimer=()=>{try{localStorage.removeItem(TKEY);}catch{}drawTimer();};
function startTimer(id){try{localStorage.setItem(TKEY,JSON.stringify({bookId:id,start:Date.now()}));}catch{}drawTimer();drawBook();}
let tick=null;
function drawTimer(){const t=timer(),b=t&&bookOf(t.bookId);$('timer-pill').hidden=!b;clearInterval(tick);if(!b){if(t&&loaded)clearTimer();return;}const up=()=>{const s=Math.floor((Date.now()-t.start)/1000);$('timer-text').textContent=`${b.title.slice(0,22)} · ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};up();tick=setInterval(up,1000);}
function stopTimer(){const t=timer(),b=t&&bookOf(t.bookId);if(!b){clearTimer();return;}const m=Math.max(1,Math.round((Date.now()-t.start)/60000));$('td-copy').textContent=`${m} minute${m>1?'s':''} with “${b.title}”. What page did you reach?`;$('td-page').min=b.page;$('td-page').max=b.total;$('td-page').value=b.page;$('td-error').textContent='';$('timer-dialog').dataset.min=m;$('timer-dialog').showModal();}
$('timer-stop').onclick=stopTimer;
$('timer-form').onsubmit=e=>{e.preventDefault();const t=timer();try{state=log(state,t.bookId,{page:Number($('td-page').value),minutes:Math.min(1440,Number($('timer-dialog').dataset.min)||1)});clearTimer();save(state.sessions.at(-1));$('timer-dialog').close();}catch(err){$('td-error').textContent=err.message;}};
$('td-discard').onclick=()=>{clearTimer();$('timer-dialog').close();if($('book-dialog').open)drawBook();};

/* ---------- Year in books ---------- */
let statYear=new Date().getFullYear();
function drawStats(){const y=statYear,v=$('stats-view'),now=new Date().getFullYear();
 const lastIn=b=>finishes(b).filter(d=>new Date(d).getFullYear()===y).sort().at(-1);const done=state.books.filter(b=>lastIn(b)).sort((a,b)=>lastIn(a).localeCompare(lastIn(b)));
 const ses=state.sessions.filter(s=>new Date(s.at).getFullYear()===y);const pages=ses.reduce((a,s)=>a+s.to-s.from,0),mins=ses.reduce((a,s)=>a+s.minutes,0);
 const months=Array.from({length:12},(_,m)=>ses.filter(s=>new Date(s.at).getMonth()===m).reduce((a,s)=>a+s.to-s.from,0));const mx=Math.max(1,...months);
 const rated=done.filter(b=>b.rating);const avg=rated.length?(rated.reduce((a,b)=>a+b.rating,0)/rated.length).toFixed(1):'—';
 const days=new Set(state.sessions.map(s=>dayOf(s.at)));let streak=0;const d=new Date();if(!days.has(today()))d.setDate(d.getDate()-1);while(days.has(dayOf(d.toISOString()))){streak++;d.setDate(d.getDate()-1);}
 const goal=state.goal&&state.goal.year===y?state.goal.books:null;const g=shelves(state);
 const ring=goal?Math.min(1,done.length/goal):0,C=2*Math.PI*42;
 v.innerHTML=`<small>YEAR IN BOOKS</small><div class="yr"><button id="y-prev" aria-label="Previous year">‹</button><h2>${y}</h2><button id="y-next" aria-label="Next year" ${y>=now?'disabled':''}>›</button></div>
 <div class="goal"><svg viewBox="0 0 100 100" shape-rendering="geometricPrecision"><circle cx="50" cy="50" r="42" fill="none" stroke="#c9b48a" stroke-width="10"/><circle cx="50" cy="50" r="42" fill="none" stroke="#576846" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-ring)}" transform="rotate(-90 50 50)"/></svg><div><b>${done.length}${goal?' / '+goal:''}</b><span>${goal?'books toward your goal':'books finished'}</span>${y===now?`<form id="goal-form" class="row"><input id="goal-n" type="number" min="1" max="1000" value="${goal||''}" placeholder="Goal"><button class="primary">${goal?'Update goal':'Set a goal'}</button></form>`:''}</div></div>
 <div class="tiles"><div><b>${pages.toLocaleString()}</b><span>pages</span></div><div><b>${Math.round(mins/60)}h</b><span>reading</span></div><div><b>${streak}</b><span>day streak</span></div><div><b>${avg}</b><span>avg rating</span></div></div>
 <h3>Pages by month</h3><div class="months">${months.map((p,i)=>`<div><span style="height:${p/mx*100}%"></span><i>${'JFMAMJJASOND'[i]}</i></div>`).join('')}</div>
 ${done.length?`<h3>Finished in ${y}</h3><div class="covers">${done.map(b=>`<button data-open="${esc(b.id)}" title="${esc(b.title)}">${b.cover?`<img src="${esc(b.cover)}" alt="${esc(b.title)}">`:`<i>${esc(b.title.slice(0,18))}</i>`}${b.rating?`<em>★${b.rating}</em>`:''}</button>`).join('')}</div>`:''}
 ${g.archived.length?`<h3>Collection</h3><div class="tokens">${g.archived.map((s,i)=>`<button data-shelf="${i}" class="shelf-token"><span class="tally">▥</span><span>Shelf ${i+1}</span><small>8 books</small></button>`).join('')}</div><p class="note">Every 8 finished books become a shelf. Open one to see it in the cabinet.</p>`:''}`;
 $('y-prev').onclick=()=>{statYear--;drawStats();};$('y-next').onclick=()=>{statYear++;drawStats();};
 if($('goal-form'))$('goal-form').onsubmit=e=>{e.preventDefault();const n=Number($('goal-n').value);if(Number.isInteger(n)&&n>0)update(s=>{s.goal={year:now,books:n};});drawStats();};
 for(const b of v.querySelectorAll('[data-open]'))b.onclick=()=>{$('stats-dialog').close();openBook(b.dataset.open);};
 for(const b of v.querySelectorAll('[data-shelf]'))b.onclick=()=>{archive=Number(b.dataset.shelf);$('stats-dialog').close();render();};}
$('stats-btn').onclick=()=>{statYear=new Date().getFullYear();drawStats();$('stats-dialog').showModal();};

/* ---------- shared ---------- */
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
function confirm(title,body,action){$('confirm-title').textContent=title;$('confirm-body').textContent=body;confirmAction=action;$('confirm').showModal();}$('cancel').onclick=()=>$('confirm').close();$('proceed').onclick=()=>{$('confirm').close();confirmAction?.();confirmAction=null;};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='spyr-reading.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>10000000)throw Error('Choose a backup under 10 MB.');const incoming=validate(JSON.parse(await f.text()));confirm('Replace this library?',incoming.books.length+' books will replace this library. Export first to keep a copy.',()=>{state=incoming;archive=null;save();});}catch(e){$('notice').textContent=e.message;}finally{$('file').value='';}};
$('retry').onclick=()=>{if(embedded){window.dispatchEvent(new CustomEvent('spyr:reading-retry'));return;}try{const raw=localStorage.getItem(KEY);if(raw)validate(JSON.parse(raw));blocked=false;save();}catch{$('notice').textContent='Existing storage is still unreadable. Export a copy first.';}};
window.SPYRReading={getState:()=>structuredClone(state),loadState(raw){state=validate(raw);loaded=true;archive=null;render();},flush(){},setSaveStatus(value){blocked=value==='error';status(value==='error'?'Save failed · retry':value==='saving'?'Saving…':'Saved');}};
if(embedded){document.body.classList.add('embedded');for(const id of ['export','import'])$(id).hidden=true;$('host-exit').hidden=false;$('host-exit').onclick=()=>{try{window.parent.postMessage({type:'spyr:shelf-exit'},location.origin);}catch{}};status('');}else status(blocked?'Not saved · export a copy':'Saved on this device');
render();
