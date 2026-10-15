/* SPYR Shelf data. v2 (v52.50) adds want-to-read and did-not-finish, covers, ratings, reviews,
   notes & quotes, a yearly goal. v1 libraries upgrade on load. Sessions keep their v1 shape
   (pages from→to, minutes, at) because the Reading habit reads them. */
export const CAPACITY=8;
export const STATUSES=['want','reading','completed','dnf'];
export const blank=()=>({version:2,books:[],sessions:[],goal:null});
const okDate=v=>Number.isFinite(Date.parse(v));
const str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
export function validate(s){
  if(!s||![1,2].includes(s.version)||!Array.isArray(s.books)||!Array.isArray(s.sessions))throw Error('Invalid library backup.');
  const ids=new Set(),books=[];
  for(const b of s.books){
    if(!b||!b.id||typeof b.id!=='string'||ids.has(b.id)||typeof b.title!=='string'||!b.title.trim()||b.title.length>160||!STATUSES.includes(b.status)||!Number.isInteger(b.total)||b.total<1||b.total>100000||!Number.isInteger(b.page)||b.page<0||!okDate(b.createdAt)||(b.status==='completed'&&!okDate(b.completedAt)))throw Error('Invalid book.');
    ids.add(b.id);
    const out={id:b.id,title:b.title,author:str(b.author,160),status:b.status,total:b.total,page:Math.min(b.page,b.total),createdAt:b.createdAt};
    if(b.completedAt&&okDate(b.completedAt))out.completedAt=b.completedAt;
    if(Array.isArray(b.reads)){const r=[...new Set(b.reads.filter(okDate))].slice(-50);if(r.length)out.reads=r;}
    if(b.startedAt&&okDate(b.startedAt))out.startedAt=b.startedAt;
    if(b.endedAt&&okDate(b.endedAt))out.endedAt=b.endedAt;
    if(typeof b.cover==='string'&&/^https:\/\/covers\.openlibrary\.org\//.test(b.cover)&&b.cover.length<200)out.cover=b.cover;
    if(typeof b.olid==='string'&&b.olid.length<60)out.olid=b.olid;
    if(Number.isInteger(b.year))out.year=b.year;
    if(typeof b.rating==='number'&&b.rating>=.5&&b.rating<=5&&Math.round(b.rating*2)===b.rating*2)out.rating=b.rating;
    if(typeof b.review==='string'&&b.review.trim())out.review=b.review.slice(0,5000);
    if(Array.isArray(b.notes))out.notes=b.notes.filter(n=>n&&typeof n.id==='string'&&typeof n.t==='string'&&n.t.trim()&&okDate(n.at)).slice(0,300).map(n=>({id:n.id,t:n.t.slice(0,2000),kind:n.kind==='quote'?'quote':'note',at:n.at,...(Number.isInteger(n.page)&&n.page>0?{page:n.page}:{})}));
    if(out.notes&&!out.notes.length)delete out.notes;
    books.push(out);
  }
  const logs=new Set(),sessions=[];
  for(const x of s.sessions){
    const b=books.find(b=>b.id===x?.bookId);
    if(!x||typeof x.id!=='string'||logs.has(x.id)||!b||!Number.isInteger(x.minutes)||x.minutes<0||x.minutes>1440||!Number.isInteger(x.from)||!Number.isInteger(x.to)||x.from<0||x.to<x.from||!okDate(x.at))throw Error('Invalid reading session.');
    logs.add(x.id);sessions.push({id:x.id,bookId:x.bookId,from:x.from,to:Math.min(x.to,Math.max(b.total,x.from)),minutes:x.minutes,at:x.at});
  }
  const goal=s.goal&&Number.isInteger(s.goal.books)&&s.goal.books>0&&s.goal.books<=1000&&Number.isInteger(s.goal.year)?{year:s.goal.year,books:s.goal.books}:null;
  return{version:2,books,sessions,goal};
}
export function shelves(s){const done=s.books.filter(b=>b.status==='completed').sort((a,b)=>a.completedAt.localeCompare(b.completedAt)||a.id.localeCompare(b.id));const archived=[];while(done.length>=CAPACITY)archived.push(done.splice(0,CAPACITY));return{reading:s.books.filter(b=>b.status==='reading'),want:s.books.filter(b=>b.status==='want'),dnf:s.books.filter(b=>b.status==='dnf'),archived,recent:done};}
export function log(s,id,{page,minutes,at=new Date().toISOString(),sessionId=crypto.randomUUID()}){
  const next=validate(s),b=next.books.find(b=>b.id===id);
  if(!b||b.status!=='reading')throw Error('Start reading this book first.');
  if(!Number.isInteger(page)||page<b.page||page>b.total)throw Error(`Choose a page from ${b.page} to ${b.total}.`);
  if(!Number.isInteger(minutes)||minutes<0||minutes>1440)throw Error('Enter 0–1440 minutes.');
  if(page===b.page&&minutes===0)throw Error('Add pages or minutes.');
  if(next.sessions.some(x=>x.id===sessionId))return next;
  next.sessions.push({id:sessionId,bookId:id,from:b.page,to:page,minutes,at});
  b.page=page;if(!b.startedAt)b.startedAt=at;
  if(page===b.total){b.status='completed';b.completedAt=at;b.reads=[...(b.reads||[]),at];}
  return validate(next);
}
/* every time a book was finished (re-reads keep earlier finishes) */
export const finishes=b=>[...new Set([...(b.reads||[]),...(b.completedAt?[b.completedAt]:[])])];
export function setStatus(s,id,status,at=new Date().toISOString()){
  const next=validate(s),b=next.books.find(b=>b.id===id);if(!b)throw Error('Book not found.');
  b.status=status;
  if(status==='reading'){if(!b.startedAt)b.startedAt=at;delete b.endedAt;if(b.page>=b.total)b.page=0;delete b.completedAt;}
  if(status==='completed'){b.page=b.total;b.completedAt=at;b.reads=[...(b.reads||[]),at];}
  if(status==='dnf'){b.endedAt=at;delete b.completedAt;}
  if(status==='want'){delete b.completedAt;delete b.endedAt;}
  return validate(next);
}
