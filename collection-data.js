import {reviewedForms} from './reviewed-forms.js';
import {workouts,trainers} from './program-data.js';
import {gymWorkouts} from './gym-data.js';
export const research={
 nike:{title:'Nike Training Club',url:'https://www.nike.com/ntc-app',note:'Official strength, conditioning, core and recovery categories; no public current workout ranking.'},
 nikeShort:{title:'Apple editorial · 5 Quick Nike Workouts',url:'https://apps.apple.com/us/story/id1396837934',note:'Editorial selection of short NTC sessions, not a current leaderboard.'},
 nikePrograms:{title:'Nike · Training Club programs',url:'https://about.nike.com/en/newsroom/releases/nike-launches-nike-training-club-workouts-on-netflix',note:'Official 2022 announcement of accessible strength, yoga and high-intensity formats; historical program reference.'},
 nikeRunner:{title:'Nike · Strength and Conditioning for Runners',url:'https://about.nike.com/en/newsroom/releases/nike-partners-with-strava-to-fuel-digital-sport-benefits',note:'Nike identifies its running-strength series in its official 2023 announcement.'},
 iron:{title:'Caroline Girvan · IRON',url:'https://carolinegirvan.com/programs/iron',note:'Structured compound-first strength, approximately 30-minute sessions; public YouTube series and separate CGX program.'},
 blender:{title:'Fitness Blender · Strength and Stability',url:'https://www.fitnessblender.com/videos/heavy-dumbbell-low-rep-strength-and-stability-gain-total-body-strength-and-control',note:'Dumbbell strength and controlled stability work.'},
 noRepeat:{title:'Fitness Blender · No-repeat strength and cardio',url:'https://www.fitnessblender.com/videos/total-body-strength-and-cardio-with-no-repeat-exercises',note:'A distinct exercise at each station; variety without randomized movement order.'},
 coach:{title:'The Body Coach · 20-minute beginner low-impact workout',url:'https://www.youtube.com/watch?v=gV-6ZySOq04',note:'Verified creator video, published November 2021; search snapshot showed about 310,000 views on September 11, 2026. Reach is not evidence of superior results.'},
 wiki:{title:'r/Fitness · Recommended strength routines',url:'https://thefitness.wiki/routines/strength-training-muscle-building/',note:'Community-curated barbell, dumbbell and bodyweight routines, including Arnold-style splits. Not a clinical ranking.'},
 insanity:{title:'BODi · INSANITY',url:'https://shop.bodi.com/products/insanity',note:'Recognizable interval-conditioning reference. SPYR uses its own pacing and grounded alternatives.'},
 p90x:{title:'BODi · P90X',url:'https://shop.bodi.com/products/p90x',note:'Recognizable mixed strength and conditioning program; SPYR is not its 90-day plan.'},
 boxing:{title:'Fitness Blender · Cardio kickboxing',url:'https://www.fitnessblender.com/videos/bodyweight-cardio-kickboxing-low-and-moderate-impact-combos',note:'Non-contact combinations with low/moderate-impact options.'},
 pilates:{title:'Move With Nicole · 30-minute full-body Pilates',url:'https://www.youtube.com/watch?v=7Ps6w1TpI0U',note:'Creator-led mat Pilates reference; SPYR uses a smaller original exercise selection.'},
 yoga:{title:'Yoga With Adriene · Gentle Morning Yoga',url:'https://yogawithadriene.com/morning-yoga-sequence/',note:'Gentle 20-minute practice from the original creator.'},
 kettlebell:{title:'SELF · Full-body kettlebell workout',url:'https://www.self.com/gallery/20-minute-total-body-kettlebell-workout',note:'Coach-led kettlebell exercise selection.'}
};
const base=id=>workouts.find(w=>w.id===id);
function old(course,key){const w=base(course),m=w.moves[key];if(!m)throw Error(course+':'+key);return {key:course+':'+key,name:m.name,cue:m.cue,easy:m.easy,art:{kind:'legacy',course,move:key},trainer:w.trainer};}
function gym(key,trainer='03',custom={}){const e=gymWorkouts.flatMap(w=>w.exercises).find(e=>e.id===key);return {key,name:e?.name??key,cue:e?.cue??'Move slowly through a comfortable range. Keep your support points steady.',easy:e?.alternative??'Use less load and a smaller comfortable range.',art:{kind:'gym',move:key},trainer,...custom};}
const r=k=>old('ironwood',k),a=k=>old('meadow-pulse',k),b=k=>old('windward',k),f=k=>old('tidal-control',k),low=k=>old('mosswood-rhythm',k),kb=k=>old('ember-engine',k);
const sage=k=>gym(k,'06'),ash=k=>gym(k);
export const movements={
 front:r('frontsquat'),row:r('bentrow'),hinge:r('rdl'),floorpress:r('floorpress'),deadbug:r('deadbug'),carry:r('carry'),lunge:r('lunge'),bridge:r('bridge'),squat:r('squat'),plank:r('plank'),offset:r('offset'),overhead:r('overhead'),march:r('march'),
 kaiSquat:a('squat'),kaiLunge:a('lunge'),jack:a('jack'),pushup:a('pushup'),climber:a('climber'),kaiMarch:a('march'),
 jab:b('jab'),combo:b('oneTwo'),four:b('fourPunch'),hooks:b('hooks'),weave:b('weave'),slip:b('slipCombo'),knee:b('kneeCombo'),kick:b('kickPunch'),mikaSquat:b('squat'),mikaLunge:b('lunge'),mikaMarch:b('march'),
 dead:f('deadbug'),glute:f('bridge'),bird:f('bird'),warrior:f('warrior'),child:f('child'),opener:f('chest'),
 step:low('step'),heel:low('heel'),punch:low('punch'),sageSquat:low('squat'),sageMarch:low('march'),sageCalf:low('calf'),
 swing:kb('swing'),halo:kb('halo'),clean:kb('clean'),lateral:kb('lateral'),kbpress:kb('press'),around:kb('around'),
 bench:ash('db-bench'),lat:ash('lat-pulldown'),cable:ash('cable-row'),shoulder:ash('db-overhead'),raise:ash('lateral-raise'),rear:ash('rear-delt'),curl:ash('db-curl'),hammer:ash('hammer-curl'),triceps:ash('pressdown'),
 back:sage('back-squat'),rdl:sage('db-rdl'),extension:sage('leg-extension'),calf:sage('calf-raise'),core:sage('reverse-crunch'),
 ashSquat:gym('exp-ash-squat','03',{name:'Barbell back squat',cue:'Brace and keep both feet planted. Lower with knees tracking your toes; stand smoothly.'}),
 ashRdl:gym('exp-ash-rdl','03',{name:'Dumbbell Romanian deadlift',cue:'Soften your knees. Hinge back with weights close to your legs; keep your spine steady.'}),
 incline:gym('exp-incline','03',{name:'Incline dumbbell press',cue:'Keep head, back and hips supported. Press above your upper chest with steady wrists.'}),
 supportRow:gym('exp-supported-row','03',{name:'Chest-supported row',cue:'Keep your chest against the pad. Draw elbows back toward your hips, then lower slowly.'}),
 thrust:gym('exp-hip-thrust','06',{name:'Barbell hip thrust',cue:'Anchor your upper back to the bench. Drive through planted feet, keeping the bar padded across your hips.'}),
 chestMachine:gym('exp-chest-machine','03',{name:'Machine chest press',cue:'Set handles near chest height. Keep your back supported and press smoothly without locking your elbows.'}),
 shoulderMachine:gym('exp-shoulder-machine','03',{name:'Machine shoulder press',cue:'Keep your back on the pad and feet flat. Press overhead through a comfortable range.'}),
 legPress:gym('exp-leg-press','03',{name:'Leg press',cue:'Keep your back and pelvis on the pad and whole soles against the platform. Lower with control; press without locking your knees.'})
};
const strength=(keys,sets=3,reps='8–12',rest=90)=>keys.map(key=>({key,sets,reps,rest}));
const timed=(keys,seconds=40,rest=20)=>keys.map(key=>({key,seconds,rest}));
const make=(number,id,title,trainer,background,room,category,mode,entries,extra={})=>({number,id,title,trainer,trainerName:trainers.find(t=>t.id===trainer).name,background,room,category,mode,entries,warmup:180,cooldown:120,rounds:3,sources:['nike'],challenge:'Finish with the same control you started with.',stamp:'FOUNDATIONS',...extra});
// The launch collection: eight tracks, twenty-four distinct sessions.
export const categories=[
{id:'gym',name:'Gym Strength',image:'category-gym',fallback:'gym-venice',description:'Classic splits and full-body sessions. Reps, weights and proper recovery.'},
{id:'heavy',name:'Heavy Strength',image:'category-heavy',fallback:'gym-barn',description:'Two barbell sessions. Alternate A and B with at least a rest day between lifts.'},
{id:'athletic',name:'Obstacle & Athletic',image:'category-obstacle',fallback:'citadel-forest-floor',description:'Build the carrying strength, endurance and control that obstacles demand.'},
{id:'bodyweight',name:'Bodyweight & HIIT',image:'category-bodyweight',fallback:'forge-foundry-floor',description:'Strength and conditioning with room to move. No weights required.'},
{id:'pilates',name:'Pilates',image:'category-pilates',fallback:'coastal-studio',description:'Deliberate mat work. Breath, alignment and whole-body control.'},
{id:'yoga',name:'Yoga & Mobility',image:'category-yoga',fallback:'mountain-conservatory',description:'Find space to move, build strength in your poses, or recover.'},
{id:'run',name:'Run & Jog',image:'cedarwood-trail',fallback:'wind-meadows-floor',description:'Guided walk–jog, steady running and intervals. Your pace, your route.'},
{id:'bike',name:'Cycling',image:'caribbean-runway',fallback:'citadel-water-floor',description:'Steady rides and controlled intervals, indoors or on a suitable outdoor route.'}
];
Object.assign(research,{
 strong:{title:'StrongLifts · A/B structure and progression',url:'https://stronglifts.com/stronglifts-5x5/workout-program/',note:'Five compound lifts, alternating sessions and rest days.'},
 ace:{title:'ACE · Exercise library',url:'https://www.acefitness.org/resources/everyone/exercise-library/',note:'Setup, alignment and controlled exercise technique.'},
 nhs:{title:'NHS · Pilates and yoga',url:'https://www.nhs.uk/live-well/exercise/pilates-and-yoga/',note:'Instructor-led mat work and yoga references.'},
 run:{title:'NHS · Couch to 5K',url:'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/',note:'Gradual walk–run progression, warm-up walks and recovery.'},
 bike:{title:'British Cycling · Bike setup',url:'https://www.britishcycling.org.uk/knowledge/bike-kit/set-up',note:'Fit and setup reference; adjust your own bicycle.'},
 obstacle:{title:'Tough Mudder · Training guide',url:'https://s3.amazonaws.com/web.toughmudder.com/2018/Training/Race%2BSeries%2BTraining%2BGuide%2B2018.pdf',note:'Running and strength as complementary obstacle-race preparation.'}
});
const newArt=(key,name,cue,trainer='04',easy='Use a smaller comfortable range.')=>gym(key,trainer,{name,cue,easy});
Object.assign(movements,{
 bbBench:newArt('launch-bench','Barbell bench press','Keep your head, upper back and hips on the bench, feet firmly planted. Lower to your lower chest with wrists over elbows; press up and slightly back.','03'),
 bbRow:newArt('launch-row','Barbell row','Hinge with a neutral spine. Brace before each pull, keep the bar close and pull toward the lower chest. Reset without rounding your back.','03'),
 bbPress:newArt('launch-press','Barbell overhead press','Brace with ribs over pelvis. Move your head just enough to clear the bar; press close to your face, finishing over your midfoot.','03'),
 deadlift:newArt('launch-deadlift','Barbell deadlift','Start with the bar over midfoot. Brace, keep it close to your legs, and push the floor away. Stand tall without leaning back.','03'),
 heelSlide:newArt('launch-heel-slide','Pilates heel slide','Keep your heel on the floor. Lie with knees bent, head supported and pelvis steady. Slide one heel away, then back without lifting the foot or drawing the knee toward your chest. Alternate legs after each return.'),
 clam:newArt('launch-clam','Side-lying clam','Stack shoulders and hips, bend your knees and keep your feet together. Open the top knee without rolling your pelvis backward.'),
 catcow:newArt('launch-catcow','Cat–cow','Place hands under shoulders and knees under hips. Slowly round and lengthen your spine with your breath; keep the range comfortable.'),
 dogplank:newArt('launch-dog-plank','Downward dog to plank','Spread your fingers and press through your hands. Shift from hips high to shoulders over wrists, keeping your trunk supported.'),
});
// All Ember demonstrations share the same calibrated renderer and floor anchor.
for(const [key,move] of Object.entries({dead:'mat-deadbug',glute:'mat-bridge',bird:'mat-bird',warrior:'mat-warrior',child:'mat-child',opener:'mat-opener'}))movements[key].art={kind:'gym',move};
Object.assign(movements,{
 mountain:newArt('mat-mountain','Mountain pose','Stand tall with feet grounded. Relax your shoulders and breathe steadily.'),
 lowLunge:newArt('mat-low-lunge','Low lunge','Pad your back knee. Keep the front foot flat, knee above ankle, and gently lengthen through the hips.'),
 tree:newArt('mat-tree','Tree pose','Use a wall for balance if needed. Place your lifted foot against the ankle or calf, away from the knee.'),
 twist:newArt('mat-twist','Reclined twist','Keep your shoulders supported. Lower bent knees gently to one side without forcing the stretch.'),
 butterfly:newArt('mat-butterfly','Reclined butterfly','Rest your head and back. Bring soles together and let knees open comfortably; support them with cushions if needed.'),
 matRest:newArt('mat-rest','Resting breath','Rest on your back with arms relaxed. Let your breathing slow naturally.'),
 hundred:newArt('mat-hundred','Supported Hundred prep','Keep head and feet supported. Pump long arms gently beside your hips while breathing steadily.'),
 proneLeg:newArt('mat-prone-leg','Prone leg lift','Rest your forehead on your forearms. Keep hips down and lift one long leg only slightly; lower before switching.'),
 frontSupport:newArt('mat-front-support','Front support','Stack shoulders above wrists. Keep a long line through your body; lower your knees if you need support.')
});
for(const key of ['lowLunge','tree','twist'])movements[key].sides=true;
movements.clam.sides=true;
movements.warrior.sides=true;movements.warrior.name='Warrior II';
movements.carry.name='Farmer hold';movements.carry.cue='Stand tall with a dumbbell in each hand beside your hips. Keep your ribs stacked over your pelvis, shoulders relaxed and grip steady. Set down before your grip fails.';
movements.offset.name='Suitcase hold';movements.offset.sides=true;movements.offset.cue='Hold one dumbbell beside your hip. Stand tall without leaning sideways. Breathe steadily; set it down before changing sides.';
const audio=(name,cue,trainer)=>({name,cue,easy:'Ease your pace whenever you need.',trainer,art:{kind:'audio'},key:name});
Object.assign(movements,{
 walk:audio('Walk','Walk at an easy pace. Relax your shoulders and let your arms swing.','01'),
 jog:audio('Easy jog','Keep a conversational pace, relaxed arms and comfortable short steps.','01'),
 runFast:audio('Controlled run','Run briskly, not an all-out sprint. Stay tall and keep your steps comfortable.','01'),
 rideEasy:audio('Easy spin','Pedal lightly with relaxed shoulders and soft elbows. Keep your hips steady on the saddle.','06'),
 rideSteady:audio('Endurance ride','Choose a resistance that lets you pedal smoothly while speaking in full sentences.','06'),
 rideBrisk:audio('Controlled bike effort','Increase effort gradually. Stay seated, keep your hips stable and pedal smoothly.','06'),
 rowanJog:audio('Easy jog','Use a clear route and a conversational pace. Return to the same safe training area before the next strength station.','05')
});
// Audio guidance and animated demonstrations share the same interval plan.
movements.walk.art={...movements.kaiMarch.art};
for(const [key,move] of Object.entries({jog:'cardio-jog',runFast:'cardio-run',rideEasy:'cardio-spin-easy',rideSteady:'cardio-spin',rideBrisk:'cardio-spin-brisk'}))movements[key].art={kind:'gym',move};
const session=(number,id,title,trainer,bg,category,mode,entries,extra={})=>make(number,id,title,trainer,bg,categories.find(c=>c.id===category).name,category,mode,entries,{equipment:'Mat',level:'Build your base',...extra});
export const collection=[
 session(1,'pull','Ironwood Pull','03','gym-venice','gym','sets',strength(['lat','cable','rear','curl'],3,'8–12',90),{route:'ironwood.html?v=4',equipment:'Cable machines · dumbbells',sources:['ace'],stamp:'PULL CLUB'}),
 session(2,'push','Ironwood Push','03','gym-rooftop','gym','sets',strength(['bench','shoulder','raise','triceps'],3,'8–12',90),{route:'ironwood-push.html?v=1',equipment:'Bench · dumbbells · cable',sources:['ace'],stamp:'PUSH CLUB'}),
 session(3,'legs','Ironwood Legs & Core','06','gym-barn','gym','sets',strength(['back','rdl','extension','calf','core'],3,'8–12',120),{route:'ironwood-legs.html?v=1',equipment:'Rack · barbell · dumbbells · machine',sources:['ace'],stamp:'GROUNDWORK'}),
 session(4,'dumbbells','Ironwood Foundations','05','woodland-gym','gym','sets',strength(['front','floorpress','row','hinge','deadbug'],3,'8–12',90),{equipment:'Dumbbells · mat',sources:['blender','ace'],stamp:'ROOTED',challenge:'Five movement patterns. One steady session.'}),
 session(5,'machines','Ironwood Machines','03','gym-venice','gym','sets',strength(['legPress','chestMachine','cable','lat','shoulderMachine'],3,'10–12',90),{equipment:'Leg press · press machines · cable',sources:['ace'],stamp:'MACHINE ROOM',challenge:'Adjust each seat and pad before your first set.'}),
 session(6,'barbell-a','Iron Standard A','03','gym-barn','heavy','sets',strength(['ashSquat','bbBench','bbRow'],5,'5',180),{equipment:'Barbell · rack · bench · safeties',level:'Barbell experience',sources:['strong'],stamp:'IRON A',warmup:300,cooldown:180,challenge:'Five sets of five. Take the full rest.'}),
 session(7,'barbell-b','Iron Standard B','03','gym-barn','heavy','sets',[...strength(['ashSquat','bbPress'],5,'5',180),...strength(['deadlift'],1,'5',180)],{equipment:'Barbell · rack · plates',level:'Barbell experience',sources:['strong'],stamp:'IRON B',warmup:300,cooldown:180,challenge:'Squat. Press. Deadlift. Build steadily.'}),
 session(8,'grip','Carry Your Weight','05','citadel-forest-floor','athletic','timed',timed(['carry','offset','front','row'],35,40),{equipment:'Dumbbells · clear level space',rounds:3,sources:['obstacle','ace'],stamp:'GRIP CLUB',challenge:'Build grip endurance with bilateral and single-sided holds.',changes:'Stationary grip foundations; add walking carries only with a clear level route.'}),
 session(9,'trail-strength','Trail & Iron','05','citadel-water-floor','athletic','timed',[{key:'rowanJog',seconds:180,rest:45},...timed(['squat','lunge','plank'],35,30)],{equipment:'Mat · clear running route',rounds:3,sources:['obstacle','run'],stamp:'TRAIL TOUGH',challenge:'Run easily. Return to your station. Move with control.'}),
 session(10,'athletic','Summit Circuit','01','citadel-summit-floor','athletic','timed',timed(['kaiSquat','kaiLunge','pushup','climber','kaiMarch'],35,25),{rounds:4,sources:['obstacle','nike'],stamp:'SUMMIT',challenge:'Four steady rounds. Keep enough energy to finish cleanly.'}),
 session(11,'bodyweight','Bodyweight Club','01','wind-dojo-floor','bodyweight','sets',strength(['kaiSquat','pushup','kaiLunge'],3,'8–12',90),{sources:['wiki','ace'],stamp:'OWN YOUR WEIGHT',challenge:'Use a range and variation you can control.'}),
 session(12,'ignite','Ignite 20','01','forge-foundry-floor','bodyweight','timed',timed(['kaiSquat','jack','kaiLunge','pushup','climber'],40,20),{rounds:3,level:'Challenging',sources:['coach','insanity'],stamp:'IGNITION',challenge:'Three rounds. Sustainable intensity, soft landings.'}),
 session(13,'low-impact','Mosswood Rhythm','06','mosswood-panorama-floor','bodyweight','timed',timed(['step','heel','punch','sageSquat','sageMarch'],40,20),{rounds:3,equipment:'No equipment',sources:['coach'],stamp:'RHYTHM',challenge:'Keep your feet grounded and find your pace.'}),
 session(14,'boxing','Ember Fight Club','02','forge-foundry-floor','bodyweight','timed',timed(['jab','combo','hooks','weave','slip','four'],40,20),{rounds:2,equipment:'Clear floor space',sources:['boxing'],stamp:'RING CRAFT',challenge:'Return to guard. Change your lead for round two.'}),
 session(15,'pilates-foundations','Tidal Foundations','04','coastal-studio','pilates','timed',timed(['heelSlide','glute','clam','catcow'],40,20),{rounds:2,sources:['nhs','pilates'],stamp:'CENTERED',challenge:'Exhale through the effort. Keep your pelvis steady.'}),
 session(16,'pilates-control','Tidal Full-Body Control','04','coastal-studio','pilates','timed',timed(['hundred','dead','bird','proneLeg','frontSupport'],40,20),{rounds:3,level:'Steady challenge',sources:['nhs','pilates'],stamp:'TIDAL CONTROL',challenge:'Arm endurance, trunk control and gentle back-body strength.'}),
 session(17,'beginner-flow','Glasshouse Flow','04','mountain-conservatory','yoga','timed',timed(['mountain','catcow','lowLunge','child'],50,15),{rounds:2,warmup:60,cooldown:120,sources:['nhs','yoga'],stamp:'FIRST FLOW',challenge:'Breathe into a comfortable range. Take your time changing position.'}),
 session(18,'power-flow','Mountain Flow','04','mountain-conservatory','yoga','timed',timed(['mountain','lowLunge','warrior','tree','dogplank'],40,15),{rounds:2,level:'Steady challenge',sources:['nhs','yoga'],stamp:'MOUNTAIN FLOW',challenge:'Standing strength, single-leg balance and a controlled floor flow.'}),
 session(19,'reset','Stillwater Reset','04','mountain-conservatory','yoga','timed',[{key:'twist',seconds:60,rest:15},{key:'butterfly',seconds:90,rest:15},{key:'matRest',seconds:120,rest:0}],{rounds:1,warmup:60,cooldown:60,sources:['yoga','nhs'],stamp:'REST COUNTS',challenge:'A floor-only reset: gentle rotation, supported hips and quiet breathing.'}),
 session(20,'walk-jog','First Miles','01','cedarwood-trail','run','timed',[{key:'jog',seconds:60,rest:0},{key:'walk',seconds:90,rest:0}],{rounds:8,warmup:300,cooldown:300,equipment:'Running shoes · safe route or treadmill',sources:['run'],stamp:'FIRST MILES',audio:true,challenge:'One minute jogging, ninety seconds walking. Repeat eight times.'}),
 session(21,'easy-run','Easy Miles','01','cedarwood-trail','run','timed',[{key:'jog',seconds:1200,rest:0}],{rounds:1,warmup:300,cooldown:300,equipment:'Running shoes · safe route or treadmill',sources:['run'],stamp:'EASY DOES IT',audio:true,challenge:'Twenty conversational minutes between two easy walks.'}),
 session(22,'run-intervals','Trail Tempo','01','cedarwood-trail','run','timed',[{key:'runFast',seconds:60,rest:0},{key:'walk',seconds:120,rest:0}],{rounds:6,warmup:300,cooldown:300,level:'Running experience',equipment:'Running shoes · clear route or treadmill',sources:['run'],stamp:'TRAIL TEMPO',audio:true,challenge:'Six brisk efforts, each followed by two easy minutes.'}),
 session(23,'endurance-ride','Coastal Cruise','06','caribbean-runway','bike','timed',[{key:'rideSteady',seconds:1200,rest:0}],{rounds:1,warmup:300,cooldown:300,equipment:'Fitted bicycle or stationary bike',sources:['bike'],stamp:'COASTAL CLUB',audio:true,challenge:'Stay seated. Keep the pedals smooth and the effort conversational.'}),
 session(24,'bike-intervals','Coastal Intervals','06','caribbean-runway','bike','timed',[{key:'rideBrisk',seconds:60,rest:0},{key:'rideEasy',seconds:120,rest:0}],{rounds:6,warmup:300,cooldown:300,level:'Cycling experience',equipment:'Stationary bike or suitable clear route',sources:['bike'],stamp:'COASTAL ENGINE',audio:true,challenge:'Six controlled efforts with generous easy spinning between them.'})
];
for(const w of collection)for(const e of w.entries){if(['deadbug','dead','bird','kaiLunge'].includes(e.key)&&w.mode==='sets')e.reps='6–8 / side';if(['extension','raise','rear','calf'].includes(e.key)&&w.mode==='sets')e.reps='12–15';}
export function getWorkout(id){const w=collection.find(w=>w.id===id);if(!w)throw Error('Unknown session');return w;}
export function makePlan(w){
 const warmKey=w.category==='yoga'?(w.id==='reset'?'matRest':'mountain'):w.category==='pilates'?'matRest':w.category==='bike'?'rideEasy':w.category==='run'?'walk':w.entries[0].key;
 const plan=[{kind:'warmup',seconds:w.warmup,key:warmKey}];
 const add=(e,round,set,side='')=>{plan.push({...e,kind:e.seconds?'work':'lift',round,set,side,seconds:e.seconds??0});if(e.rest>0)plan.push({kind:'rest',seconds:e.rest,key:e.key,round,set,side});};
 const station=(e,round,set)=>{if(movements[e.key].sides){add(e,round,set,'Right side');add(e,round,set,'Left side');}else add(e,round,set,w.id==='boxing'?(round%2?'Left lead':'Right lead'):'');};
 if(w.mode==='sets')for(const e of w.entries)for(let set=1;set<=e.sets;set++)station(e,0,set);
 else for(let round=1;round<=w.rounds;round++)for(const e of w.entries)station(e,round,0);
 plan.push({kind:'cooldown',seconds:w.cooldown,key:['yoga','pilates'].includes(w.category)?'matRest':w.audio?warmKey:w.entries.at(-1).key});
 return plan.map((p,i)=>({...p,id:i}));
}
export const workSteps=w=>makePlan(w).filter(p=>['work','lift'].includes(p.kind));
export function duration(w){if(w.estimate)return w.estimate;const seconds=makePlan(w).reduce((n,p)=>n+(p.kind==='lift'?45:p.seconds),0);const minutes=Math.round(seconds/60);return w.mode==='sets'?`${Math.max(10,minutes-5)}–${minutes+5} min`:`${minutes} min`;}

// Setup notes are intentionally separate from the short in-session movement cue.
const form=(keys,setup,title,url)=>{for(const key of keys){movements[key].setup=setup;movements[key].source={title,url};}};
form(['lat'],'Sit centered facing the cable. Set the thigh pad snugly on the tops of your thighs, just above the knees, with both feet flat. Allow a small steady backward lean; leave room for the bar in front of your face.','NASM · Lat pulldown form','https://www.nasm.org/resource-center/blog/training/the-biomechanics-of-the-lat-pulldown-muscles-grip-and-form');
form(['cable'],'Sit lengthwise along the center of the bench, facing the pulley. Place both soles on the footplates with knees softly bent; keep your hips supported.','ACE · Seated cable row','https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/');
form(['chestMachine'],'Set the seat so the handles meet your mid-chest. Keep your back on the pad and feet firmly supported. Set the starting handles no farther back than your chest.','ACE · Seated chest press','https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/');
form(['shoulderMachine'],'Adjust the seat so the handles begin around shoulder height. Sit fully back on the seat with feet supported, wrists above elbows and a comfortable grip.','Physitrack · Machine shoulder press','https://na.physitrack.com/home-exercise-video/seated-shoulder-press-machine');
form(['legPress'],'Position your whole back and pelvis on the pad. Place feet about shoulder-width on the platform, heels supported. Set a depth that keeps your pelvis down and avoids compressing thighs into your torso. Learn the machine’s safety stops before loading.','ACE · Leg press setup','https://www.acefitness.org/resources/everyone/exercise-library/154/seated-leg-press/');
form(['bbBench'],'Center the bench inside the rack. Set catches to allow an unrack without losing shoulder position; set safeties to catch the bar if you flatten your arch. Use a spotter, a full thumb-around grip and balanced loading.','StrongLifts · Bench press','https://stronglifts.com/bench-press/');
form(['bbRow'],'Use equal plates and level ground. Take a balanced overhand grip slightly wider than your stance. Keep your torso close to horizontal and reset your brace before each rep.','StrongLifts · Barbell row','https://stronglifts.com/barbell-row/');
form(['bbPress'],'Set the rack just below shoulder height. Grip just outside shoulder width with forearms vertical from the front. Step clear of the hooks and plant both feet.','StrongLifts · Overhead press','https://stronglifts.com/overhead-press/');
form(['deadlift'],'Place the bar over midfoot with feet roughly hip-width. Bend to grip just outside your legs, bring shins to the bar, brace and take out the slack before lifting.','StrongLifts · Deadlift','https://stronglifts.com/deadlift/');
form(['ashSquat','back'],'Set catches below shoulder height and safeties just below your controlled squat depth. Place the bar across your upper back, not your neck. Grip evenly and step clear of the hooks.','PureGym · Back squat','https://www.puregym.com/exercises/legs/quad-exercises/squats/barbell-back-squat/');
form(['heelSlide','clam'],'Use a mat on a level floor. For heel slides, support your head and shoulders and keep the heel in contact. For clams, rest your head on your lower arm or a pillow and stack the hips.','CUH · Heel slide and clam mechanics','https://www.cuh.nhs.uk/patient-information/exercises-after-a-pelvic-fracture/');
form(['catcow'],'Use a mat, hands beneath shoulders and knees beneath hips. Spread your fingers and keep the motion slow and comfortable.','Frimley Health · Cat–cow','https://www.fhft.nhs.uk/patients-and-visitors/patient-information-library/pelvic-health-exercises/submit/7561');
form(['dogplank'],'Start with a stable high plank: hands under shoulders and feet hip-width. Keep knees soft as hips lift; heels do not need to reach the floor.','ACE · Downward-facing dog','https://www.acefitness.org/resources/everyone/exercise-library/18/downward-facing-dog/');
form(['dead','glute','bird','warrior','child','opener'],'Use a level, non-slip mat. Set up slowly and use a smaller range or support whenever needed. Keep breathing through holds.','NHS · Pilates and yoga instruction','https://www.nhs.uk/live-well/exercise/pilates-and-yoga/');
form(['walk','jog','runFast','rowanJog'],'Choose a clear route or set up your treadmill before starting. Start with an easy walk and use a pace appropriate to your running experience.','NHS · Gradual running progression','https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/');
form(['rideEasy','rideSteady','rideBrisk'],'Adjust the saddle to allow a slight knee bend at the bottom of the pedal stroke without rocking your hips. Keep a relaxed reach and soft elbows. Check brakes and helmet for outdoor rides; choose a route where efforts will not compete with traffic.','British Cycling · Bike position','https://www.britishcycling.org.uk/news/article/20110629-Perfecting-your-bike-position%E2%80%93-Our-top-tips-0');
research.bike.url=movements.rideEasy.source.url;

for(const m of Object.values(movements)){const ref=reviewedForms[m.art.move];if(ref){m.cue=ref.cue;m.easy=ref.tip;if(!m.source)m.source={title:ref.label,url:ref.url};}}
for(const w of collection)for(const e of w.entries){const m=movements[e.key];if(!m.source)m.source=research[w.sources.includes('ace')?'ace':w.sources[0]];}

movements.plank.art={kind:'gym',move:'launch-rowan-plank'};
movements.plank.cue='Hands under shoulders. Keep a straight line from head to heels and breathe steadily.';
movements.plank.easy='Lower your knees while keeping your trunk supported.';
// The index reads the exact prescriptions of the three existing workout players.
for(const w of collection.filter(w=>w.route)){const course=gymWorkouts.find(c=>c.id==='ironwood-'+(w.id==='legs'?'legs':w.id));w.warmup=300;w.cooldown=180;w.estimate=course.estimate;for(const e of w.entries){const actual=course.exercises.find(x=>x.id===movements[e.key].art.move);Object.assign(e,{sets:actual.sets,reps:actual.min+'–'+actual.max,rest:actual.rest});}}
form(['mountain','lowLunge','tree','twist','butterfly','matRest'],'Use a level mat and move slowly into each position. Use support and stay within a comfortable range.','NHS · Yoga instruction','https://www.nhs.uk/live-well/exercise/pilates-and-yoga/');
form(['hundred','proneLeg','frontSupport'],'Keep breathing throughout. Use a small controlled range and stop the effort before losing support.','CHT physiotherapy · Pilates','https://www.cht.nhs.uk/services/clinical-services/physiotherapy-outpatients/the-low-back/pilates');
for(const m of Object.values(movements)){m.brief=m.cue.split(/(?<=[.!?])\s+/)[0];}

// Reviewed full-body Kai cycles replace the older two-pose atlas.
movements.kaiSquat.art={kind:'gym',move:'launch-kai-squat'};
movements.kaiLunge.art={kind:'gym',move:'launch-kai-lunge'};
movements.jack.art={kind:'gym',move:'launch-kai-jack'};
movements.pushup.art={kind:'gym',move:'launch-kai-pushup'};
movements.climber.art={kind:'gym',move:'launch-kai-climber'};
movements.front.cue='Keep both feet planted from heel to toe. Hold the dumbbells at your shoulders, brace, and lower between your hips with knees following your toes. Stand smoothly without jumping or lifting your heels.';
movements.front.brief='Keep both feet planted. Lower slowly, then stand.';

movements.bbBench.brief="Lower to your chest. Press smoothly above your shoulders.";
movements.bbRow.brief="Center your grip. Keep your torso steady as you row.";
movements.bbPress.brief="Brace, press close, and finish stacked overhead.";
