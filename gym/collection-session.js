import {makePlan,workSteps} from './collection-data.js';
export function createSession(w){const plan=makePlan(w),total=workSteps(w).length;
 const fresh=()=>({version:['yoga','pilates'].includes(w.category)?3:2,workoutId:w.id,index:0,remaining:plan[0].seconds,elapsed:0,paused:false,status:'active',records:[],logId:globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`});
 const current=s=>plan[s.index];
 function advance(s,reason='complete',log=null){if(s.status!=='active'||s.paused)return;const p=current(s),work=['work','lift'].includes(p.kind);s.records.push({id:p.id,key:p.key,performedKey:s.variation??p.key,kind:p.kind,seconds:Math.max(0,p.seconds-s.remaining),complete:work&&(p.kind==='lift'?reason==='complete':reason==='timed'),log});s.index++;if(s.index===plan.length){s.status='finished';s.remaining=0;}else s.remaining=plan[s.index].seconds;}
 function tick(s,dt){if(s.status!=='active'||s.paused||!Number.isFinite(dt)||dt<=0)return;
  while(dt>0&&s.status==='active'){const p=current(s);if(p.kind==='lift'){s.elapsed+=dt;break;}const used=Math.min(dt,s.remaining);s.elapsed+=used;s.remaining=Math.max(0,s.remaining-used);dt-=used;if(s.remaining===0)advance(s,'timed');else break;}
 }
 const valid=s=>!!s&&s.version===(['yoga','pilates'].includes(w.category)?3:2)&&s.workoutId===w.id&&s.status==='active'&&Number.isInteger(s.index)&&s.index>=0&&s.index<plan.length&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=plan[s.index].seconds+3600&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&typeof s.paused==='boolean'&&typeof s.logId==='string'&&Array.isArray(s.records)&&s.records.length===s.index&&s.records.every((r,i)=>r.id===i&&r.key===plan[i].key&&r.kind===plan[i].kind&&typeof r.complete==='boolean');
 const stats=s=>({total,completed:s.records.filter(r=>r.complete).length,processed:s.records.filter(r=>['lift','work'].includes(r.kind)).length});
 return {plan,fresh,current,advance,tick,valid,stats};}
