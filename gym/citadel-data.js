// Original Spyr pacing, adapted from Fitness Blender's strength/stability pairings.
export const source={title:'Fitness Blender · Strength and Stability',url:'https://www.fitnessblender.com/videos/heavy-dumbbell-low-rep-strength-and-stability-gain-total-body-strength-and-control'};
export const moves={
 plank:{name:'High plank',asset:'pushup',hold:true,holdFrame:0,cue:'Hold the top of a push-up with hands under shoulders. Keep your body aligned and breathe steadily.',easy:'Lower your knees or use a stable raised surface.'},
 march:{name:'Easy march',asset:'march',cue:'Walk gently in place. Let your arms swing and gradually settle into a comfortable rhythm.',easy:'Keep the steps small and grounded.'},
 squat:{name:'Bodyweight squat',asset:'squat',cue:'Sit your hips back and down, then stand tall. Move through a comfortable range.',easy:'Use a shallower squat.'},
 lunge:{name:'Alternating reverse lunge',asset:'lunge',cue:'Step back, bend both knees with control, then return. Alternate legs without rushing.',easy:'Shorten the range or use a stable support for balance.'},
 jack:{name:'Gentle jumping jack',asset:'jack',cue:'Keep the pace easy and land softly. This is preparation, not a sprint.',easy:'For a quiet option, choose Easy march below.',alternative:'march'},
 frontsquat:{name:'Dumbbell front squat',asset:'front-squat',cue:'Hold the dumbbells at your shoulders. Sit between your hips, then drive through your feet to stand. Take controlled reps; rest within the interval when needed.',easy:'Use lighter dumbbells or switch to Bodyweight squat.',alternative:'squat'},
 deadbug:{name:'Dead bug',asset:'deadbug',cue:'Lie on your back with arms up and knees bent. Slowly extend the opposite arm and leg, return, then switch. Keep your lower back gently supported by the floor.',easy:'Move only your legs, tapping one heel down at a time.'},
 rdl:{name:'Dumbbell Romanian deadlift',asset:'rdl',cue:'With soft knees, send your hips back and keep the weights close to your legs. Stand by bringing your hips forward. Stop the descent before your back rounds.',easy:'Use lighter weights and a shorter hinge.'},
 bridge:{name:'Glute bridge hold',asset:'bridge',hold:true,holdFrame:3,cue:'Lie on your back, feet planted. Raise your hips until shoulders, hips and knees form a line; hold and breathe. Lower to reset whenever needed.',easy:'Use a lower lift and shorter holds. This version is unweighted.'},
 floorpress:{name:'Dumbbell floor press',asset:'floorpress',cue:'Lie on your back with bent knees. Press the dumbbells above your chest, then lower until your upper arms gently meet the floor. Keep wrists stacked.',easy:'Use lighter dumbbells; take breaks before your form changes.'},
 overhead:{name:'Tall-kneeling overhead hold',asset:'overhead',hold:true,cue:'Kneel upright on a mat. Hold light dumbbells overhead with ribs stacked over hips. Breathe steadily; lower the weights to rest as needed.',easy:'Use very light weights. If overhead work is uncomfortable, choose Floor press.',alternative:'floorpress'},
 bentrow:{name:'Dumbbell bent-over row',asset:'bentrow',cue:'Hinge at your hips with soft knees. Pull the dumbbells toward your ribs, pause, then lower. Keep your torso steady.',easy:'Use lighter weights and reset upright between reps.'},
 offset:{name:'Offset dumbbell hold',asset:'offset',hold:true,cue:'Hold one dumbbell at your shoulder and the other beside your thigh. Stand tall without leaning. Switch the rack side each round.',easy:'Use lighter dumbbells and shorten the hold.'},
 carry:{name:'Suitcase march',asset:'carry',cue:'Hold one dumbbell at your side. March in place with controlled steps, keeping your shoulders level. Set it down to rest when needed.',easy:'Use a lighter dumbbell or switch to Easy march.',alternative:'march'},
 calf:{name:'Standing calf stretch',asset:'march',instructionOnly:true,cue:'Face a wall with hands supported. Step the indicated foot back, heel down and knee comfortably straight. Lean forward gently; do not bounce.',easy:'Keep the stretch mild and breathe normally.'},
 hip:{name:'Half-kneeling hip stretch',asset:'march',instructionOnly:true,cue:'Kneel on the indicated knee on a mat, other foot in front. Keep your torso upright and gently tuck your pelvis until you feel the front of the rear hip lengthen.',easy:'Use padding beneath the knee or stand in a small split stance.'},
 chest:{name:'Chest opener & slow breathing',asset:'march',instructionOnly:true,cue:'Stand comfortably, hands resting behind your hips. Gently open your chest without arching your lower back. Release and take slow, easy breaths.',easy:'Keep your arms low and the range small.'}
};
export const environment={name:'The Citadel Terrace',asset:'citadel-water-floor',ground:.80,camera:.35};
export const chapters=[
 {name:'Squat & stabilize',short:'Squat & core',pair:['frontsquat','deadbug']},
 {name:'Hinge & bridge',short:'Hinge & bridge',pair:['rdl','bridge']},
 {name:'Press & hold',short:'Press & hold',pair:['floorpress','overhead']},
 {name:'Row & balance',short:'Row & balance',pair:['bentrow','offset']}
].map(block=>({...block,asset:environment.asset,ground:environment.ground,
 mission:`${moves[block.pair[0]].name} and ${moves[block.pair[1]].name.toLowerCase()}. Four rounds on the Citadel terrace.`,
 verbs:block.pair.map(id=>moves[id].name),
 states:['Settle into your training space','Round 1 complete','Round 2 complete','Round 3 complete','Block complete']}));
export function buildPlan(){
 const p=[];const add=(kind,seconds,move,chapter,extra={})=>p.push({id:p.length,kind,seconds,move,chapter,...extra});
 ['march','squat','lunge','jack','march'].forEach(m=>{add('warmup',45,m,0);add('rest',15,'march',0,{warmup:true});});
 chapters.forEach((ch,c)=>{for(let round=1;round<=4;round++)ch.pair.forEach((m,j)=>{add('work',45,m,c,{round,slot:j,side:m==='offset'?(round%2?'Left rack':'Right rack'):''});add('rest',15,'march',c,{round,slot:j});});});
 [{m:'carry',side:'Left hand'},{m:'carry',side:'Right hand'},{m:'lunge',side:'Alternate legs'}].forEach(({m,side})=>{add('finale',45,m,3,{side});add('rest',15,'march',3,{finale:true});});
 [['calf','Left leg back'],['calf','Right leg back'],['hip','Left knee down'],['hip','Right knee down'],['chest','Easy breathing']].forEach(([m,side])=>add('cooldown',60,m,3,{side}));
 return p;
}
export const plan=buildPlan();
export const total=plan.reduce((n,s)=>n+s.seconds,0);
export const fresh=()=>({version:1,index:0,remaining:plan[0].seconds,elapsed:0,records:[],paused:false,status:'active',alternative:false});
export const current=s=>plan[s.index];
export const selectedMove=s=>s.alternative&&moves[current(s)?.move]?.alternative?moves[current(s).move].alternative:current(s)?.move;
function record(s,status){const step=current(s);s.records.push({id:step.id,move:selectedMove(s),kind:step.kind,seconds:Math.max(0,step.seconds-s.remaining),status});}
export function advance(s,status='timed'){if(s.status!=='active')return;record(s,status);s.index++;s.alternative=false;if(s.index>=plan.length){s.status='finished';s.remaining=0;}else s.remaining=current(s).seconds;}
export function tick(s,dt){if(s.status!=='active'||s.paused||!Number.isFinite(dt)||dt<=0)return;let left=dt;while(left>0&&s.status==='active'){const used=Math.min(left,s.remaining);s.remaining-=used;s.elapsed+=used;left-=used;if(s.remaining<=1e-7)advance(s);}}
export function end(s){if(s.status!=='active')return;record(s,'partial');s.status='ended';s.paused=true;}
export function stats(s){const exercise=s.records.filter(r=>['work','finale'].includes(r.kind));return {elapsed:s.elapsed,intervals:exercise.filter(r=>r.status==='timed').length,exerciseSeconds:exercise.reduce((n,r)=>n+r.seconds,0),skipped:s.records.filter(r=>r.status==='skipped').length};}
export function valid(s){return !!s&&s.version===1&&s.status==='active'&&Number.isInteger(s.index)&&s.index>=0&&s.index<plan.length&&Number.isFinite(s.remaining)&&s.remaining>0&&s.remaining<=plan[s.index].seconds&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&Array.isArray(s.records)&&s.records.length===s.index&&s.records.every((r,i)=>r.id===i&&r.kind===plan[i].kind&&!!moves[r.move]&&Number.isFinite(r.seconds)&&r.seconds>=0&&r.seconds<=plan[i].seconds&&['timed','early','skipped'].includes(r.status))&&typeof s.paused==='boolean'&&typeof s.alternative==='boolean';}
