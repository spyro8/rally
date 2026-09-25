export const source={name:'Nerd Fitness · Beginner Bodyweight Workout',url:'https://www.nerdfitness.com/blog/beginner-body-weight-workout-burn-fat-build-muscle/',accessed:'2026-09-08'};
export const moves={
 march:{name:'March & loosen up',short:'Warm-up',asset:'march',target:120,unit:'seconds',cue:'Start gently. Alternate knee lifts and let your arms swing.',tip:'Use a comfortable pace. This is preparation, not a race.',ease:'Keep knee lifts small and slow.'},
 squat:{name:'Bodyweight squat',short:'Squats',asset:'squat',target:20,unit:'reps',cue:'Send your hips back, bend your knees, then stand tall.',tip:'Keep feet planted and knees tracking in the direction of your toes.',ease:'Use a shallower range or a stable support.'},
 pushup:{name:'Push-up',short:'Push-ups',asset:'pushup',target:10,unit:'reps',cue:'Lower your body together, then press the floor away.',tip:'Keep your trunk steady. Finish the set when you cannot maintain control.',ease:'Use a stable raised surface or lower your knees; the animation shows the standard version.'},
 lunge:{name:'Reverse lunge',short:'Lunges',asset:'lunge',target:20,unit:'reps',cue:'Step one foot back, lower with control, then return. Alternate legs.',tip:'20 total repetitions means 10 per leg. Keep your front foot planted.',ease:'Use a smaller step and shallower depth with stable support.'},
 rowR:{name:'Dumbbell row · right',short:'Row · R',asset:'row',target:10,unit:'reps',cue:'Brace your other hand on a stable bench. Pull the weight toward your hip.',tip:'Keep your torso steady. Lower the weight under control.',ease:'Choose a lighter weight you can control. Do not use unstable furniture.'},
 rowL:{name:'Dumbbell row · left',short:'Row · L',asset:'row',mirror:true,target:10,unit:'reps',cue:'Switch arms. Brace yourself and draw the weight toward your hip.',tip:'The animation is mirrored for the other side. Keep your back steady.',ease:'Choose a lighter weight you can control. Do not use unstable furniture.'},
 plank:{name:'High plank',short:'Plank',asset:'pushup',hold:true,target:15,unit:'seconds',cue:'Hold the top of a push-up and breathe steadily.',tip:'Hands under shoulders. Keep your body aligned without sagging your hips.',ease:'Lower knees to the floor or use a stable raised surface.'},
 jack:{name:'Jumping jack',short:'Jacks',asset:'jack',target:30,unit:'reps',cue:'Move feet apart as arms rise; return with a soft landing.',tip:'One complete out-and-back movement counts as one repetition.',ease:'Step one foot sideways at a time instead of jumping.'},
 cooldown:{name:'Easy finish',short:'Cool-down',asset:'march',target:60,unit:'seconds',cue:'Slow to an easy march and let your breathing settle.',tip:'You can take longer if you need. Your session is yours.',ease:'Keep the movement slow and comfortable.'}
};
export const circuit=['squat','pushup','lunge','rowR','rowL','plank','jack'];
export function createSession(rounds=3,now=Date.now()){
 if(!Number.isInteger(rounds)||rounds<1||rounds>3)throw Error('Invalid rounds');
 const plan=[{move:'march',round:0,target:120,rest:0}];
 for(let r=1;r<=rounds;r++)circuit.forEach((move,i)=>plan.push({move,round:r,target:moves[move].target,rest:i===6?(r===rounds?0:60):move==='rowR'?10:20}));
 plan.push({move:'cooldown',round:0,target:60,rest:0});
 return {version:1,id:globalThis.crypto?.randomUUID?.()??`${now}-${Math.random()}`,rounds,plan,cursor:0,phase:'work',paused:false,remaining:120,elapsed:0,records:[],startedAt:new Date(now).toISOString(),endedAt:null};
}
export const current=s=>s.plan[s.cursor];
export function tick(s,seconds){if(!s||s.paused||s.phase==='summary'||!Number.isFinite(seconds)||seconds<0)return;s.elapsed+=seconds;if(s.remaining!==null)s.remaining=Math.max(0,s.remaining-seconds);}
export function next(s){if(s.cursor>=s.plan.length-1){s.phase='summary';s.endedAt=new Date().toISOString();s.remaining=null;return;}s.cursor++;s.phase='work';const b=current(s);s.remaining=moves[b.move].unit==='seconds'?b.target:null;}
export function log(s,actual,status='done'){
 if(!s||s.phase!=='work'||s.paused||!Number.isFinite(actual)||actual<0||actual>999||!Number.isInteger(actual)||s.records.some(r=>r.index===s.cursor))return false;
 const b=current(s),m=moves[b.move];s.records.push({index:s.cursor,move:b.move,round:b.round,target:b.target,actual:status==='skip'?0:actual,unit:m.unit,status:status==='skip'?'skipped':actual<b.target?'partial':'completed'});
 if(s.cursor===s.plan.length-1){next(s);}else if(b.rest>0){s.phase='rest';s.remaining=b.rest;}else next(s);return true;
}
export function finish(s,actual=null){if(!s||s.phase==='summary')return;s.paused=false;if(actual!==null&&s.phase==='work')log(s,actual);s.phase='summary';s.remaining=null;s.endedAt=new Date().toISOString();}
export function stats(s){const work=s.records.filter(r=>r.round>0);return {done:work.filter(r=>r.status==='completed').length,partial:work.filter(r=>r.status==='partial').length,skipped:work.filter(r=>r.status==='skipped').length,total:s.rounds*circuit.length,reps:work.filter(r=>r.unit==='reps').reduce((a,b)=>a+b.actual,0),holds:work.filter(r=>r.unit==='seconds').reduce((a,b)=>a+b.actual,0),elapsed:Math.round(s.elapsed)};}
export function valid(s){return !!s&&s.version===1&&typeof s.id==='string'&&Number.isInteger(s.rounds)&&s.rounds>=1&&s.rounds<=3&&Array.isArray(s.plan)&&s.plan.length===2+s.rounds*7&&s.plan.every(b=>moves[b.move]&&Number.isFinite(b.target)&&b.target>0&&Number.isFinite(b.rest)&&b.rest>=0)&&Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<s.plan.length&&['work','rest','summary'].includes(s.phase)&&typeof s.paused==='boolean'&&(s.remaining===null||Number.isFinite(s.remaining)&&s.remaining>=0)&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&Array.isArray(s.records)&&s.records.every(r=>moves[r.move]&&Number.isInteger(r.index)&&r.index>=0&&r.index<s.plan.length&&Number.isInteger(r.actual)&&r.actual>=0&&r.actual<=999&&['completed','partial','skipped'].includes(r.status))&&new Set(s.records.map(r=>r.index)).size===s.records.length;}
