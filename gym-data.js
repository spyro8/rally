const exercise=(id,name,sets,min,max,rest,slot,cue,alternative)=>({id,name,sets,min,max,rest,slot,cue,alternative});
export const gymWorkouts=[
{id:'ironwood-pull',title:'Ironwood Pull',subtitle:'Back & Biceps · Pull Day',trainer:'03',trainerName:'Ash',route:'ironwood.html',atlas:'gym-chest-back',background:'gym-venice',room:'Ironwood Training Hall',ground:.8,estimate:'35–45 min',presentation:'cinematic',exercises:[
exercise('lat-pulldown','Lat pulldown',3,8,12,120,0,'Thighs secure. Lead with your elbows; return with control.','Assisted pull-up'),
exercise('cable-row','Seated cable row',3,8,12,120,1,'Sit tall. Draw the handle to your lower ribs without rocking.','Chest-supported row'),
exercise('rear-delt','Rear-delt fly',3,12,15,90,2,'Keep your hinge. Open softly bent arms; lower slowly.','Reverse pec deck'),
exercise('db-curl','Dumbbell curls',3,10,15,90,3,'Keep elbows close. Curl smoothly, with no body swing.','Cable curl')
]},
{id:'ironwood-push',title:'Ironwood Push',subtitle:'Chest, Shoulders & Triceps · Push Day',trainer:'03',trainerName:'Ash',route:'ironwood-push.html',atlas:'gym-shoulders-arms',background:'gym-rooftop',room:'Sunset Ironworks',ground:.8,estimate:'35–45 min',presentation:'cinematic',exercises:[
exercise('db-bench','Dumbbell bench press',3,8,12,120,0,'Feet planted. Keep your head, shoulders and hips supported; press smoothly.','Machine chest press'),
exercise('db-overhead','Seated shoulder press',3,8,12,120,1,'Stay against the backrest. Press overhead without arching your back.','Machine shoulder press'),
exercise('lateral-raise','Lateral raises',3,12,15,90,2,'Soft elbows. Raise to shoulder height; lower without swinging.','Cable lateral raise'),
exercise('pressdown','Triceps pressdown',3,10,15,90,3,'Keep elbows beside your ribs. Extend, pause, and return with control.','Resistance-band pressdown')
]},
{id:'ironwood-legs',title:'Ironwood Legs & Core',subtitle:'Legs & Core · Leg Day',trainer:'06',trainerName:'Sage',route:'ironwood-legs.html',atlas:'gym-legs-core',background:'gym-barn',room:'Alpine Strength Barn',ground:.8,mobileFloor:.63,estimate:'45–55 min',presentation:'cinematic',exercises:[
exercise('back-squat','Barbell back squat',3,6,10,180,0,'Brace. Keep your feet planted and knees tracking with your toes.','Goblet squat'),
exercise('db-rdl','Dumbbell Romanian deadlift',3,8,12,150,1,'Soft knees. Send hips back; keep the weights close and your spine steady.','Barbell Romanian deadlift'),
exercise('leg-extension','Leg extension',3,10,15,90,2,'Back supported. Extend smoothly, pause, then lower without swinging.','Banded leg extension'),
exercise('calf-raise','Standing calf raise',3,12,20,90,3,'Rise through the balls of your feet. Pause, then lower slowly.','Seated calf raise'),
exercise('reverse-crunch','Reverse crunch',3,10,15,60,4,'Keep your head resting. Gently curl your pelvis up; lower with control.','Dead bug')
]},
{id:'chest-back',title:'Chest & Back',subtitle:'Golden Era · Arnold-style split',trainer:'03',atlas:'gym-chest-back',background:'gym-venice',room:'Venice Iron Hall',ground:.8,estimate:'65–85 min',exercises:[
exercise('db-bench','Dumbbell bench press',4,6,10,150,0,'Plant your feet and brace against the bench. Lower the dumbbells with control, then press up without bouncing.','Machine chest press'),
exercise('lat-pulldown','Lat pulldown',3,8,12,120,1,'Secure your thighs beneath the pad. Pull the bar toward your upper chest, keeping your torso steady. Return slowly.','Assisted pull-up'),
exercise('incline-db','Incline dumbbell press',3,8,12,120,2,'Use a modest bench incline. Keep feet planted and press with wrists stacked over elbows.','Incline chest press machine'),
exercise('cable-row','Seated cable row',3,8,12,120,3,'Sit tall with knees soft. Pull toward your lower ribs without leaning back, then reach forward under control.','Chest-supported dumbbell row'),
exercise('db-fly','Dumbbell fly',2,10,15,90,4,'Lie on a flat bench with a soft elbow bend. Open your arms only through a comfortable range and bring them back over your chest.','Cable fly'),
exercise('pullover','Dumbbell pullover',2,10,15,90,5,'Support your head and back on the bench. With a light dumbbell and soft elbows, lower behind your head through a comfortable range, then return.','Straight-arm cable pulldown')
]},
{id:'shoulders-arms',title:'Shoulders & Arms',subtitle:'Golden Era · Arnold-style split',trainer:'03',atlas:'gym-shoulders-arms',background:'gym-rooftop',room:'Sunset Ironworks',ground:.8,estimate:'55–75 min',exercises:[
exercise('db-overhead','Seated dumbbell shoulder press',3,6,10,150,0,'Sit with your back supported. Press from shoulder height without arching your lower back. Lower with control.','Machine shoulder press'),
exercise('lateral-raise','Dumbbell lateral raise',3,10,15,90,1,'With a soft elbow bend, raise the dumbbells out to your sides to a comfortable height. Lower slowly without swinging.','Cable lateral raise'),
exercise('rear-delt','Bent-over rear delt raise',3,10,15,90,2,'Hinge with a steady back. Open your arms out to the sides with light weights, then lower with control.','Reverse pec deck'),
exercise('db-curl','Dumbbell biceps curl',3,8,12,90,3,'Keep your upper arms near your sides. Curl without swinging your torso, then lower fully with control.','Cable curl'),
exercise('pressdown','Cable triceps pressdown',3,10,15,90,4,'Keep elbows beside your ribs. Extend your arms smoothly, then return without letting your shoulders move forward.','Resistance-band pressdown'),
exercise('hammer-curl','Dumbbell hammer curl',2,10,15,90,5,'Keep palms facing inward. Curl with steady upper arms, then lower the weights slowly.','Rope cable hammer curl')
]},
{id:'legs-core',title:'Legs & Core',subtitle:'Golden Era · Arnold-style split',trainer:'06',atlas:'gym-legs-core',background:'gym-barn',room:'Alpine Strength Barn',ground:.8,estimate:'65–85 min',exercises:[
exercise('back-squat','Barbell back squat',3,6,10,180,0,'Set the rack safety bars appropriately. Brace, sit between your hips through a controlled range, then stand without rushing.','Goblet squat or hack squat machine'),
exercise('db-rdl','Dumbbell Romanian deadlift',3,8,12,150,1,'Keep knees soft and weights close. Hinge your hips back until you feel a comfortable hamstring stretch, then stand tall.','Barbell Romanian deadlift'),
exercise('leg-press','Leg press',3,10,15,120,2,'Keep your back and pelvis supported. Lower through a comfortable range and press without forcefully locking your knees.','Supported split squat'),
exercise('leg-curl','Lying leg curl',3,10,15,90,3,'Align the machine with your knees. Curl your heels toward your hips without lifting your pelvis, then lower slowly.','Seated leg curl'),
exercise('calf-raise','Standing weighted calf raise',3,10,15,90,4,'Use stable support. Rise onto your toes, pause briefly, and lower under control through a comfortable range.','Seated calf raise'),
exercise('leg-raise','Bent-knee leg raise',3,10,15,60,5,'Lie on your back. Bring bent knees toward your torso without swinging, then lower only as far as you can control.','Dead bug')
]}];
export const gymReference={title:'Arnold’s Blueprint · training reference',url:'https://www.youtube.com/watch?v=o9zCgPtsups'};
export const progressionCopy='Keep roughly 2 controlled reps in reserve. When every working set reaches the top of its rep range with at least 2 reps left, consider the smallest available load increase next time. Otherwise repeat the load. Reduce it if your form or recovery suffers.';
export function gymCourse(id){const w=gymWorkouts.find(w=>w.id===id);if(!w)throw new RangeError('Unknown gym workout');return {...w,moves:Object.fromEntries(w.exercises.map(e=>[e.id,{...e,easy:e.alternative}])),idleSlot:0};}
export function freshGym(id){gymCourse(id);return {version:1,workoutId:id,exercise:0,set:1,phase:'warmup',remaining:300,elapsed:0,paused:false,records:[],status:'active',unit:'lb',logId:null};}
export function validGym(s){if(!s||s.version!==1||s.status!=='active'||!['warmup','lift','rest','cooldown'].includes(s.phase)||!['lb','kg'].includes(s.unit)||typeof s.paused!=='boolean'||!Number.isFinite(s.elapsed)||s.elapsed<0||!Number.isFinite(s.remaining)||s.remaining<0||!Array.isArray(s.records))return false;const w=gymWorkouts.find(w=>w.id===s.workoutId);if(!w||!Number.isInteger(s.exercise)||s.exercise<0||s.exercise>=w.exercises.length||!Number.isInteger(s.set)||s.set<1||s.set>w.exercises[s.exercise].sets)return false;const prefix=w.exercises.slice(0,s.exercise).reduce((n,e)=>n+e.sets,0)+s.set-1;const expected=s.phase==='warmup'?0:s.phase==='cooldown'?w.exercises.reduce((n,e)=>n+e.sets,0):prefix+(s.phase==='rest'?1:0);if(s.records.length!==expected)return false;const slots=w.exercises.flatMap(e=>Array.from({length:e.sets},(_,i)=>({exercise:e.id,set:i+1})));return s.records.every((r,i)=>r.exercise===slots[i]?.exercise&&r.set===slots[i]?.set&&w.exercises.some(e=>e.id===r.exercise)&&['lb','kg'].includes(r.unit)&&((r.completed===true&&r.reps===null&&r.weight===null&&r.rir===null)||(Number.isInteger(r.reps)&&r.reps>=0&&r.reps<=100&&Number.isFinite(r.weight)&&r.weight>=0&&r.weight<=2000&&Number.isInteger(r.rir)&&r.rir>=0&&r.rir<=5)));}
export function logGymSet(s,{reps,weight,rir}){if(s.status!=='active'||s.paused||s.phase!=='lift')return false;if(!Number.isInteger(reps)||reps<0||reps>100||!Number.isFinite(weight)||weight<0||weight>2000||!Number.isInteger(rir)||rir<0||rir>5)throw new RangeError('Enter valid reps, weight and reps in reserve.');const e=gymCourse(s.workoutId).exercises[s.exercise];s.records.push({exercise:e.id,set:s.set,reps,weight,unit:s.unit,rir});s.phase='rest';s.remaining=e.rest;return true;}
export function advanceGym(s){if(s.status!=='active'||s.paused)return;const w=gymCourse(s.workoutId);if(s.phase==='warmup'){s.phase='lift';s.remaining=0;}else if(s.phase==='rest'){if(s.set<w.exercises[s.exercise].sets)s.set++;else if(s.exercise<w.exercises.length-1){s.exercise++;s.set=1;}else{s.phase='cooldown';s.remaining=180;return;}s.phase='lift';s.remaining=0;}else if(s.phase==='cooldown'){s.phase='finished';s.status='finished';s.remaining=0;}}
export function tickGym(s,dt){if(s.status!=='active'||s.paused||!Number.isFinite(dt)||dt<=0)return;s.elapsed+=dt;if(s.phase!=='lift'){s.remaining=Math.max(0,s.remaining-dt);if(s.remaining===0)advanceGym(s);}}
export function nextLoadHint(exercise,records,unit){const sets=records.filter(r=>r.exercise===exercise.id&&r.unit===unit&&r.reps!==null&&r.weight!==null);if(sets.length!==exercise.sets)return 'Build a complete set history to compare next time.';const sameLoad=sets.every(r=>r.weight===sets[0].weight);return sameLoad&&sets.every(r=>r.reps>=exercise.max&&r.rir>=2)?'Top of the range on every set. Consider the smallest available load increase next time.':'Repeat this load until all sets reach the top of the range with controlled reps.';}

export function completeGymSet(s){if(s.status!=='active'||s.paused||s.phase!=='lift')return false;const e=gymCourse(s.workoutId).exercises[s.exercise];s.records.push({exercise:e.id,set:s.set,reps:null,weight:null,unit:s.unit,rir:null,completed:true});s.phase='rest';s.remaining=e.rest;return true;}
