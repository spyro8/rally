// Separate movement libraries: shared preparation does not change a course's working lineup.
import {moves as preparation} from './citadel-data.js';
import {trainerForWorkout} from './trainer-roster.js';
const base={march:{...preparation.march,asset:'trainer02-march'},squat:{...preparation.squat,asset:'trainer02-squat'},lunge:{...preparation.lunge,asset:'trainer02-lunge'},calf:{...preparation.calf,asset:'trainer02-march'},hip:{...preparation.hip,asset:'trainer02-march'},chest:{...preparation.chest,asset:'trainer02-march'}};
const boxing={
 jab:{name:'Easy jab practice',asset:'t02-box-jab',cue:'Take a comfortable staggered stance. Punch forward with your lead hand and return to guard. Keep the elbow soft at the end.',easy:'Slow the punches and shorten your reach.'},
 weave:{name:'Bob & weave',asset:'t02-box-weave',cue:'Hands at your cheeks. Make a small U-shaped dip using your hips and knees, then return to guard. Keep your back comfortably long.',easy:'Use a very shallow dip; there is no need to squat deeply.'},
 oneTwo:{name:'Double jab · cross',asset:'t02-box-jab',combo:['t02-box-jab','t02-box-jab','t02-box-cross'],cue:'Two lead-hand jabs, then one rear-hand cross. Turn through the hip on the cross and return both hands to guard.',easy:'Slow down or choose single jab practice.',alternative:'jab'},
 fourPunch:{name:'Jab · cross · hook · uppercut',asset:'t02-box-jab',combo:['t02-box-jab','t02-box-cross','t02-box-hook','t02-box-uppercut'],cue:'Build four punches in order: lead jab, rear cross, lead hook, rear uppercut. Reset before repeating.',easy:'Keep the punches compact and the pace comfortable.',alternative:'jab'},
 kneeCombo:{name:'Jab · cross · rear knee',asset:'t02-box-jab',combo:['t02-box-jab','t02-box-cross','t02-box-knee'],cue:'Throw a jab and cross, then drive the rear knee forward and up. Place the foot down before starting the next combination.',easy:'Lift the knee only as high as feels steady.',alternative:'oneTwo'},
 hooks:{name:'Two hooks · two uppercuts',asset:'t02-box-hook',combo:['t02-box-hook','t02-box-hook','t02-box-uppercut','t02-box-uppercut'],cue:'Two compact lead hooks followed by two rear uppercuts. Keep your feet grounded and turn your hips with each punch.',easy:'Use smaller punches with relaxed shoulders.',alternative:'jab'},
 kickKnee:{name:'Front kick · knee drive',asset:'t02-box-frontkick',combo:['t02-box-frontkick','t02-box-knee'],cue:'Lift the rear knee, extend into a low front kick, retract and step down. Follow with a controlled rear knee drive.',easy:'Keep the kick low, or use jab practice for a standing option.',alternative:'jab'},
 upperKnee:{name:'Jab · uppercut · two knees',asset:'t02-box-jab',combo:['t02-box-jab','t02-box-uppercut','t02-box-knee','t02-box-knee'],cue:'One lead jab and a rear uppercut, followed by two rear knee drives. Reset your stance between knee lifts.',easy:'Use a slower rhythm and a smaller knee lift.',alternative:'oneTwo'},
 slipCombo:{name:'Jab · cross · weave',asset:'t02-box-jab',combo:['t02-box-jab','t02-box-cross','t02-box-weave'],cue:'Jab, cross, then make a small weave under an imaginary rope. Rise back into your guard.',easy:'Make the weave shallow or keep only the punches.',alternative:'oneTwo'},
 kickPunch:{name:'Front kick · jab · cross',asset:'t02-box-frontkick',combo:['t02-box-frontkick','t02-box-jab','t02-box-cross'],cue:'Throw a low rear front kick, bring the foot back to your stance, then jab and cross. Keep each movement controlled.',easy:'Omit the kick by choosing double jab–cross.',alternative:'oneTwo'}
};
const kettlebells={
 swing:{name:'Two-hand kettlebell swing',asset:'t02-kb-swing',cue:'Hinge the bell back between your legs, then drive through your hips to stand tall. Let the bell float no higher than chest-to-shoulder level. Keep your arms long.',easy:'Use a lighter bell. Choose around-the-waist passes if you have not learned swings.',alternative:'around'},
 halo:{name:'Kneeling kettlebell halo',asset:'t02-kb-halo',cue:'Kneel tall on a mat. Hold a light bell with both hands and guide it around your head without arching your back. Alternate directions.',easy:'Use a very light bell, or choose around-the-waist passes.',alternative:'around'},
 clean:{name:'Single-arm dead clean',asset:'t02-kb-clean',cue:'Start the bell between your feet. Use your legs and hips to bring it into a soft rack position beside your shoulder, then return it to the floor with control.',easy:'Keep the load light while learning; choose a simple waist pass if the catch is not familiar.',alternative:'around'},
 lateral:{name:'Kettlebell lateral lunge',asset:'t02-kb-lateral',cue:'Hold the bell at your chest. Step to the indicated side, sit back into that hip, and push through the stepping foot to return.',easy:'Use a lighter bell and a shorter side step.'},
 press:{name:'Single-arm push press',asset:'t02-kb-pushpress',cue:'From a comfortable shoulder rack, make a small knee dip and drive up to press the bell overhead. Lower back to the rack with control.',easy:'Use a light bell. For an option without overhead loading, choose around-the-waist passes.',alternative:'around'},
 drag:{name:'Kettlebell plank pull-through',asset:'t02-kb-drag',cue:'In a high plank with feet wide, reach across with the opposite hand and drag the bell beneath your chest. Alternate hands while keeping your hips steady.',easy:'Set both knees down, or choose standing waist passes.',alternative:'around'},
 around:{name:'Around-the-waist kettlebell pass',asset:'t02-kb-around',cue:'Stand tall with a light bell. Pass it carefully from hand to hand around your waist, keeping your torso still. Reverse direction on the next interval.',easy:'Slow the transfer and keep the bell close. Set it down to rest whenever needed.'}
};
function chapter(name,short,asset,pair,mission,verbs,states,extra={}){return {name,short,asset,pair,mission,verbs,states,ground:.72,...extra};}
export const catalog=[
 {id:'tide',title:'Windward Temple',tag:'BODYWEIGHT / CARDIO KICKBOXING',trainerId:'02',workoutNumber:3,type:'Kickboxing & coordination',image:'wind-dojo-floor',equipment:'No equipment',description:'Train in an open-air Japanese dojo beneath the cedars. Eight kickboxing combinations, both leads, one complete session.',work:40,rest:20},
 {id:'forge',title:'The Ember Engine',tag:'KETTLEBELL / POWER & CONTROL',trainerId:'02',workoutNumber:4,type:'Kettlebell intervals',image:'forge-foundry-floor',equipment:'Kettlebell + mat',description:'Train on a volcanic foundry floor with swings, cleans, lateral work and controlled passes. Power efforts with longer recovery.',work:30,rest:30}
];
export function makeCourse(id='tide'){
 const meta=catalog.find(c=>c.id===id)||catalog[0];const isBox=meta.id==='tide';const moves={...base,...(isBox?boxing:kettlebells)};
 const environment=isBox?{name:'The Cedar Dojo',asset:'wind-dojo-floor',ground:.80,camera:.18}:{name:'The Foundry Floor',asset:'forge-foundry-floor',ground:.80,camera:.2};
 const pairs=isBox?[['oneTwo','fourPunch'],['kneeCombo','hooks'],['kickKnee','upperKnee'],['slipCombo','kickPunch']]:[['swing','halo'],['clean','around'],['lateral','drag'],['press','around']];
 const names=isBox?['Punch foundations','Knees & hooks','Kicks & knee drives','Weave & flow']:['Swing & halo','Clean & pass','Lateral & core','Press & control'];
 const chapters=pairs.map((pair,i)=>chapter(names[i],names[i],environment.asset,pair,
  `${moves[pair[0]].name} and ${moves[pair[1]].name.toLowerCase()}. Four rounds in ${isBox?'the cedar dojo':'the foundry'}.`,
  pair.map(id=>moves[id].name),['Settle into your training space','Round 1 complete','Round 2 complete','Round 3 complete','Block complete'],{ground:environment.ground}));
 const warmup=isBox?['march','jab','weave','jab','march']:['march','squat','lunge','march','squat'];
 const finale=isBox?[{move:'fourPunch',side:'Left lead'},{move:'fourPunch',side:'Right lead'},{move:'slipCombo',side:'Left lead'}]:[{move:'swing'},{move:'halo'},{move:'around'}];
 const plan=[];const add=(kind,seconds,move,chapter,extra={})=>plan.push({id:plan.length,kind,seconds,move,chapter,...extra});
 warmup.forEach(move=>{add('warmup',45,move,0);add('rest',15,'march',0,{warmup:true});});
 chapters.forEach((c,i)=>{for(let round=1;round<=4;round++)c.pair.forEach((move,slot)=>{let side='';if(isBox)side=round%2?'Left lead':'Right lead';else if(['clean','lateral','press'].includes(move))side=round%2?'Right side':'Left side';else if(move==='around')side=round%2?'Clockwise':'Counterclockwise';add('work',meta.work,move,i,{round,slot,side});add('rest',meta.rest,'march',i,{round,slot});});});
 finale.forEach(({move,side=''})=>{add('finale',meta.work,move,3,{side});add('rest',meta.rest,'march',3,{finale:true});});
 [['calf','Left leg back'],['calf','Right leg back'],['hip','Left knee down'],['hip','Right knee down'],['chest','Easy breathing']].forEach(([m,side])=>add('cooldown',60,m,3,{side}));
 return {...meta,environment,trainerId:trainerForWorkout(meta.workoutNumber).id,idleAsset:'trainer02-march',moves,chapters,plan,total:plan.reduce((n,s)=>n+s.seconds,0),mainCount:isBox?8:7,
  missionTitle:isBox?'Follow the wind.':'Wake the mountain.',finaleTitle:isBox?'Complete the wind form.':'Ignite the engine.',success:isBox?'Your dojo session is complete.':'Your foundry session is complete.',
  equipmentNote:isBox?'Clear room for low kicks and small steps. Contactless combinations; no bag or gloves.':'A manageable bell, plus a lighter one for halos and passes if available. Leave clear space around you.',
  pacing:isBox?'40 sec combinations / 20 sec recovery. Alternate left and right lead each round. Build accuracy before speed.':'30 sec power / 30 sec recovery. Alternate working sides each round. Set the bell down between efforts; technique comes before pace.',
  finaleCopy:isBox?'Four-punch combination on each lead, then jab–cross–weave. Three 40-second efforts with 20-second resets.':'Swings, kneeling halos, then around-the-waist passes. Three 30-second efforts with 30-second resets.',
  sources:isBox?[
   {title:'Fitness Blender · Bodyweight Cardio Kickboxing',url:'https://www.fitnessblender.com/videos/bodyweight-cardio-kickboxing-low-and-moderate-impact-combos'},
   {title:'Fitness Blender · Cardio Kickboxing and Abs',url:'https://www.fitnessblender.com/videos/cardio-kickboxing-and-abs-workout-kickboxing-for-stress-and-cardio-benefits'}
  ]:[
   {title:'SELF · Lacee Lazoff’s full-body kettlebell workout',url:'https://www.self.com/gallery/20-minute-total-body-kettlebell-workout'},
   {title:'Nourish Move Love · Kettlebell pyramid',url:'https://www.nourishmovelove.com/7-calorie-torching-kettlebell-moves-hiit-workout/'},
   {title:'Nourish Move Love · Kettlebell core',url:'https://www.nourishmovelove.com/kettlebell-ab-exercises/'}
  ],
  adaptation:isBox?'Spyr selects and simplifies published punch-and-kick combinations, adds a weave combination, removes jumping drills and floor-core sets, and uses its own 45-minute, 40/20 schedule. This is a separate adaptation, not a reproduction of either video.':'Spyr selects swings, cleans, lateral lunges, push presses and halos from published kettlebell sessions. It simplifies the push-up/pass to a plank pull-through and isolates waist passes from a longer combination. Its 45-minute, 30/30 chapter schedule is original; it is not the source pyramid.',
 };
}
