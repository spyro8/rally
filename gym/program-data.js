import {moves as strength} from './citadel-data.js';
import {makeCourse} from './journey-data.js';
export const trainers=[
{id:'05',name:'Rowan',look:'Cream shirt · forest shorts',specialty:'Strength'},
{id:'02',name:'Mika',look:'Forest tank · orange leggings',specialty:'Boxing & kettlebells'},
{id:'01',name:'Kai',look:'Teal shirt · dark joggers',specialty:'Conditioning'},
{id:'04',name:'Ember',look:'Auburn ponytail · burgundy jacket',specialty:'Pilates & mobility'},
{id:'03',name:'Ash',look:'Black tank · olive shorts',specialty:'Calisthenics'},
{id:'06',name:'Sage',look:'Forest turban · orange shirt',specialty:'Low-impact cardio'}];
const m=(name,slot,cue,easy,extra={})=>({name,slot,cue,easy,...extra});
const athletic={
 march:m('March in place',0,'Stand tall and alternate knees. Let your arms move naturally.','Keep your knees low.'),
 squat:m('Bodyweight squat',1,'Sit your hips back, bend your knees comfortably, then stand tall.','Use a smaller range.'),
 lunge:m('Alternating reverse lunge',2,'Step back, lower with control, then return. Alternate legs evenly.','Use a shallow split stance with a stable support.'),
 jack:m('Jumping jack',3,'Open arms and legs together. Land softly and keep your pace sustainable.','Choose marching for a grounded option.',{alternative:'march'}),
 pushup:m('Push-up',4,'Keep your body in a straight line. Lower your chest with control, then press up.','Use a secure raised surface or put your knees down.'),
 climber:m('Mountain climber',5,'From a high plank, bring one knee toward your chest, replace it, and alternate. Keep your hips steady.','Move slowly, or use standing marches.',{alternative:'march'})};
const bodyweight={...athletic,pushup:{...athletic.pushup,slot:3},tap:m('Plank shoulder tap',4,'From a high plank with feet apart, touch the opposite shoulder and replace your hand. Alternate sides without rocking.','Use knees down or choose marching.',{alternative:'march'}),bridge:m('Glute bridge',5,'Lie on your back with feet planted. Lift your hips with control, then lower slowly.','Use a smaller lift.')};
const flow={
 deadbug:m('Dead bug',0,'Lie on your back, knees bent and arms up. Extend opposite arm and leg slowly, then alternate. Keep your lower back comfortably supported.','Move one leg at a time with your arms resting.'),
 bridge:m('Glute bridge',1,'With feet planted, lift your hips gently, then lower. Keep breathing through each repetition.','Lift a little less.'),
 bird:m('Bird dog',2,'From hands and knees, reach opposite arm and leg long. Return, then switch sides. Keep your hips level.','Move only one arm or leg at a time.'),
 warrior:m('Warrior II · alternate sides',3,'Take a wide stance. Turn one foot out, bend that knee, and open your arms. Change sides halfway through the timer.','Shorten your stance and keep the knee bend shallow.',{hold:true}),
 child:m('Child’s pose',4,'From kneeling, sit your hips back toward your heels and reach forward. Breathe into a comfortable stretch.','Place support under your hips or stay upright on your knees.',{hold:true}),
 chest:m('Standing chest opener',5,'Stand comfortably. Open your arms gently and breathe slowly without arching your back.','Keep your arms low.',{hold:true})};
const low={
 march:athletic.march,
 step:m('Side step & touch',1,'Step to one side and bring your other foot in. Repeat the other way. Stay light and comfortable.','Take smaller steps.'),
 squat:{...athletic.squat,slot:2,name:'Shallow squat'},
 heel:m('Alternating heel dig',3,'Reach one heel forward with toes lifted. Step back and alternate. Keep a soft supporting knee.','Reach a shorter distance.'),
 punch:m('Standing cross punches',4,'Alternate gentle forward punches with a small torso turn. Keep elbows soft and feet grounded.','Keep punches short and slow.'),
 calf:m('Standing calf raise',5,'Rise onto the balls of your feet and lower with control. Use a stable support if needed.','Lift less and keep a hand supported.')};
export const sources={
 conditioning:[{title:'INSANITY · program reference',url:'https://www.bodi.com/blog/insanity-faq'}],
 strength:[{title:'P90X · mixed training reference',url:'https://shop.bodi.com/products/p90x'},{title:'Caroline Girvan · strength programs',url:'https://carolinegirvan.com/programs'}],
 calisthenics:[{title:'Bodyweight Fitness · recommended routine',url:'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine/'}],
 low:[{title:'Body Project · low-impact cardio',url:'https://www.youtube.com/watch?v=50kH47ZztHs'}],
 pilates:[{title:'Move With Nicole · Pilates',url:'https://www.youtube.com/watch?v=C2HX2pNbUCM'}],
 mobility:[{title:'Yoga With Adriene · 30-day journey',url:'https://yogawithadriene.com/30-days-of-yoga-01/'}]
};
// Original Spyr routines. References inform the training styles; these are not copies of branded programs.
export const workouts=[
{id:'ironwood',title:'Ironwood Foundations',type:'Dumbbell strength',family:'strength',trainer:'05',room:'Woodland gym',background:'woodland-gym',ground:.85,equipment:'Dumbbells + mat',level:'Build your base',work:35,rest:25,moves:strength,sequence:['frontsquat','bentrow','rdl','floorpress','deadbug','carry'],warm:['march','squat','lunge'],cool:['calf','hip','chest'],final:['carry','march'],summary:'A full-body circuit of squats, rows, hinges, presses and core work.'},
{id:'citadel-strength',title:'Citadel Strength',type:'Dumbbell strength',family:'strength',trainer:'05',room:'Water garden terrace',background:'citadel-water-floor',ground:.80,equipment:'Dumbbells + mat',level:'Steady challenge',work:40,rest:20,moves:strength,sequence:['rdl','floorpress','bentrow','frontsquat','offset','deadbug'],warm:['march','squat','lunge'],cool:['calf','hip','chest'],final:['carry','bridge'],summary:'Controlled resistance work with offset holds and a core finish.'},
{id:'windward',title:'Windward Temple',type:'Cardio kickboxing',family:'boxing',trainer:'02',room:'Cedar dojo',background:'wind-dojo-floor',ground:.80,equipment:'No equipment',level:'Build your rhythm',work:40,rest:20,moves:makeCourse('tide').moves,sequence:['oneTwo','fourPunch','kneeCombo','hooks','slipCombo','kickPunch'],warm:['march','jab','weave'],cool:['chest','calf','hip'],final:['fourPunch','oneTwo'],summary:'Punch combinations, low kicks and knee drives, alternating your lead.',sources:makeCourse('tide').sources},
{id:'ember-engine',title:'The Ember Engine',type:'Kettlebell strength',family:'kettlebell',trainer:'02',room:'Volcanic foundry',background:'forge-foundry-floor',ground:.80,equipment:'Kettlebell + mat',level:'Experienced',work:30,rest:30,moves:makeCourse('forge').moves,sequence:['swing','halo','clean','lateral','press','around'],warm:['march','squat','lunge'],cool:['chest','calf','hip'],final:['around','around'],summary:'Hip power, controlled cleans and presses, with equal work and recovery.',sources:makeCourse('forge').sources},
{id:'meadow-pulse',title:'Meadow Pulse',type:'Bodyweight conditioning',family:'conditioning',trainer:'01',room:'Windward meadow',background:'wind-meadows-floor',ground:.78,equipment:'Mat',level:'Steady challenge',work:35,rest:25,moves:athletic,sequence:['squat','jack','lunge','pushup','march','climber'],warm:['march','squat','lunge'],cool:['march','march','march'],final:['jack','march'],summary:'Standing and floor intervals with grounded alternatives to jumping.'},
{id:'summit-surge',title:'Summit Surge',type:'Bodyweight conditioning',family:'conditioning',trainer:'01',room:'Summit training platform',background:'citadel-summit-floor',ground:.78,equipment:'Mat',level:'Experienced',work:45,rest:15,moves:athletic,sequence:['jack','climber','squat','pushup','lunge','march'],warm:['march','squat','lunge'],cool:['march','march','march'],final:['climber','march'],summary:'Longer work intervals with deliberate recovery and a final floor sequence.'},
{id:'tidal-control',title:'Tidal Control',type:'Pilates & core',family:'pilates',trainer:'04',room:'Coastal studio',background:'coastal-studio',ground:.80,equipment:'Mat',level:'Build your base',work:40,rest:20,moves:flow,sequence:['deadbug','bridge','bird','deadbug','bridge','bird'],warm:['chest','bird','bridge'],cool:['child','chest','child'],final:['bridge','child'],summary:'Slow, controlled mat work for your trunk, hips and coordination.'},
{id:'glasshouse-flow',title:'Glasshouse Flow',type:'Yoga & mobility',family:'mobility',trainer:'04',room:'Mountain conservatory',background:'mountain-conservatory',ground:.80,equipment:'Mat',level:'Gentle',work:45,rest:15,moves:flow,sequence:['chest','warrior','bird','child','bridge','child'],warm:['chest','bird','child'],cool:['child','chest','child'],final:['chest','child'],summary:'A gentle sequence of supported floor movements, standing poses and breathing.'},
{id:'mosswood-basics',title:'Mosswood Basics',type:'Calisthenics',family:'calisthenics',trainer:'03',room:'Forest clearing',background:'citadel-forest-floor',ground:.80,equipment:'Mat',level:'Build your base',work:30,rest:30,moves:bodyweight,sequence:['squat','pushup','lunge','bridge','tap','march'],warm:['march','squat','lunge'],cool:['march','march','march'],final:['bridge','march'],summary:'Bodyweight fundamentals with generous recovery between sets.'},
{id:'vault-control',title:'Vault Control',type:'Calisthenics',family:'calisthenics',trainer:'03',room:'Ancient training vault',background:'citadel-vault-floor',ground:.80,equipment:'Mat',level:'Steady challenge',work:40,rest:20,moves:bodyweight,sequence:['pushup','lunge','tap','squat','bridge','march'],warm:['march','squat','lunge'],cool:['march','march','march'],final:['tap','bridge'],summary:'Push, stabilize and strengthen your legs through controlled bodyweight sets.'},
{id:'mosswood-rhythm',title:'Mosswood Rhythm',type:'Low-impact cardio',family:'low',trainer:'06',room:'Mosswood outdoor deck',background:'mosswood-panorama-floor',ground:.80,equipment:'No equipment',level:'Gentle',work:40,rest:20,moves:low,sequence:['march','step','heel','punch','calf','squat'],warm:['march','step','heel'],cool:['march','step','march'],final:['step','march'],summary:'All-standing movement: step, march, reach and find a comfortable rhythm.'},
{id:'iceworks-energy',title:'Iceworks Energy',type:'Low-impact cardio',family:'low',trainer:'06',room:'Alpine iceworks gym',background:'forge-iceworks-floor',ground:.80,equipment:'No equipment',level:'Build your base',work:45,rest:15,moves:low,sequence:['step','punch','squat','heel','march','calf'],warm:['march','step','heel'],cool:['march','step','march'],final:['punch','march'],summary:'A lively standing circuit with no jumping and easy pace adjustments.'}
];
export const programs=[
{id:'foundation',name:'Find your rhythm',copy:'Low-impact cardio with mobility between training days.',workouts:['mosswood-rhythm','iceworks-energy','glasshouse-flow'],schedule:[0,null,1,null,2,null,null]},
{id:'strength',name:'Build your strength',copy:'Two resistance sessions and controlled core work each week.',workouts:['ironwood','citadel-strength','tidal-control'],schedule:[0,null,2,null,1,null,null]},
{id:'conditioning',name:'Raise your endurance',copy:'Bodyweight conditioning, boxing and a gentle recovery session.',workouts:['meadow-pulse','windward','glasshouse-flow'],schedule:[0,null,1,null,2,null,null]},
{id:'bodyweight',name:'Master the basics',copy:'Calisthenics practice, core control and planned recovery.',workouts:['mosswood-basics','vault-control','tidal-control'],schedule:[0,null,2,null,1,null,null]}
];
export const weekNotes=['Learn the movements. Choose a manageable pace and range.','Repeat the sessions and aim for consistent, controlled movement.','If the sessions feel comfortable, try a little more range or load. Keep the rest.','Repeat your first session and compare how it feels. Finish with recovery.'];
export function makeWorkout(id,minutes=45){
 const w=workouts.find(w=>w.id===id);if(!w)throw new RangeError('Unknown workout');if(![20,30,45].includes(minutes))throw new RangeError('Choose 20, 30 or 45 minutes');
 const shape={20:{warm:3,rounds:2,cool:3,final:2},30:{warm:3,rounds:4,cool:2,final:1},45:{warm:4,rounds:6,cool:3,final:2}}[minutes];
 const plan=[];const add=(kind,seconds,move,round=0)=>plan.push({id:plan.length,kind,seconds,move,chapter:Math.max(0,round-1),round,side:w.family==='boxing'&&['work','finale'].includes(kind)?(round%2?'Left lead':'Right lead'):w.family==='kettlebell'&&['clean','lateral','press'].includes(move)?(round%2?'Right side':'Left side'):''});
 for(let i=0;i<shape.warm;i++){add('warmup',45,w.warm[i%w.warm.length]);add('rest',15,w.warm[0]);}
 for(let round=1;round<=shape.rounds;round++)for(const move of w.sequence){add('work',w.work,move,round);add('rest',w.rest,w.warm[0],round);}
 for(let i=0;i<shape.final;i++){add('finale',w.work,w.final[i%w.final.length],shape.rounds);add('rest',w.rest,w.warm[0],shape.rounds);}
 for(let i=0;i<shape.cool;i++)add('cooldown',60,w.cool[i%w.cool.length],shape.rounds);
 return {...w,courseId:`${id}-${minutes}`,id:`${id}-${minutes}`,workoutId:id,minutes,plan,rounds:shape.rounds,total:plan.reduce((n,s)=>n+s.seconds,0),sources:w.sources??sources[w.family]??[],atlas:['01','03','04','06'].includes(w.trainer)?`trainer-${w.trainer}`:null,idleSlot:w.trainer==='04'?5:0};
}
export function rewardFor(session){const timed=session.records.filter(r=>['work','finale'].includes(r.kind)&&r.status==='timed').length;return timed*5;}
