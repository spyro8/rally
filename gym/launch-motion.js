import {matMotions} from './mat-motion.js';
import {cardioMotions} from './cardio-motion.js';
import {heavyTempo} from './heavy-tempo.js';
import {legsMotions} from './legs-motion.js';
const full=[[0,0],[512,0],[512,512],[0,512]];
const P=points=>points.map(([x,y])=>[x*512/443.5,y*512/443.5]);
const rect=(x,y,w,h)=>P([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
const common={registered:true,mode:'loop',frameCount:6,columns:4,rows:2,machineCell:6,sequence:[0,1,2,3,4,5,4,3,2,1],durations:[.65,.35,.35,.35,.35,.65,.4,.4,.4,.4],spriteScale:.9,breathAmount:0,foreground:[],bodyPolygons:[full],origin:[256,480],breathAnchor:[256,500]};
const ground=(name,anchors,extra={})=>({...common,file:name,anchors,autoGround:true,offsets:anchors.map(([x,y])=>[256-x,480-y]),...extra});
export const launchMotions={
 ...cardioMotions,
 ...matMotions,
 'launch-kai-climber':ground('launch-kai-climber',Array.from({length:6},()=>[256,480]),{spriteScale:1,sequence:[0, 1, 2, 1, 3, 4, 5, 4],durations:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]}),

 'launch-kai-pushup':ground('launch-kai-pushup',Array.from({length:6},()=>[256,480]),{spriteScale:1,sequence:[0, 1, 2, 3, 4, 1, 5],durations:[0.42857142857142855, 0.42857142857142855, 0.42857142857142855, 0.42857142857142855, 0.42857142857142855, 0.42857142857142855, 0.42857142857142855]}),

 'launch-kai-jack':ground('launch-kai-jack',Array.from({length:6},()=>[256,480]),{spriteScale:1,sequence:[0, 1, 2, 3, 4, 1, 5],durations:[0.2285714285714286, 0.2285714285714286, 0.2285714285714286, 0.2285714285714286, 0.2285714285714286, 0.2285714285714286, 0.2285714285714286],autoGround:false}),

 'launch-kai-lunge':ground('launch-kai-lunge',Array.from({length:6},()=>[256,480]),{spriteScale:1,sequence:[0, 1, 2, 1, 3, 4, 5, 4],durations:[0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75]}),

 'launch-kai-squat':ground('launch-kai-squat',Array.from({length:6},()=>[256,480]),{spriteScale:1,sequence:[0, 1, 2, 3, 4, 5],durations:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5]}),

 'launch-rowan-plank':ground('launch-rowan-plank',Array.from({length:6},()=>[256,440]),{spriteScale:1.05,sequence:[0,1,2,3,4,5],durations:[1,1,1,1,1,1]}),
 'exp-ash-squat':{...legsMotions['back-squat'],file:'exp-ash-squat',bodyPolygons:[rect(136,40,171,366)],extraPolygons:[134,144,158,179,198,201].map(y=>[rect(21,y-47,403,96)]),anchors:Array.from({length:6},()=>[260,471])},
 'launch-row':ground('heavy-row-v4',Array.from({length:6},()=>[256,480]),{breathAmount:0,...heavyTempo.row}),
 'launch-press':ground('heavy-press-v2',Array.from({length:6},()=>[256,499]),{spriteScale:.84,breathAmount:0,...heavyTempo.press}),
 'launch-deadlift':ground('launch-deadlift',[[253,480],[253,480],[253,480],[253,480],[253,480],[253,480]],{spriteScale:.86}),
 'launch-bench':{...common,...heavyTempo.bench,file:'heavy-bench-v4',origin:[256,444],machineCell:6,bodyPolygons:[P([[70,0],[444,0],[444,387],[356,387],[353,275],[70,275]])],offsets:Array.from({length:6},()=>[0,0]),breathAnchor:[400,420],breathAmount:0},
 'exp-chest-machine':{...common,file:'exp-chest-machine',origin:[250,479],machineCell:0,machinePolygons:[rect(20,78,156,331),rect(172,308,128,104)],sequence:[0,1,2,1],durations:[.75,.7,.7,1.05],bodyPolygons:[P([[120,40],[440,40],[440,425],[294,425],[294,309],[200,309],[181,280],[152,155]])],breathAmount:.06,breathAnchor:[280,385]},
 'exp-shoulder-machine':{...common,file:'exp-shoulder-machine',origin:[256,474],machineCell:0,machinePolygons:[rect(40,276,245,134),P([[99,155],[123,156],[155,300],[99,299]])],sequence:[0,1,2,3,2,1],durations:[.6,.4,.4,.6,.5,.5],bodyPolygons:[P([[20,15],[440,15],[440,418],[286,418],[281,303],[173,303],[132,260],[132,181],[20,181]])],breathAmount:.05,breathAnchor:[310,390]},
 'exp-leg-press':{...common,file:'exp-leg-press',origin:[256,452],machineRect:[0,48,512,512],sequence:[0,1,2,1],durations:[.8,.7,.6,1],bodyPolygons:[P([[20,70],[430,70],[430,251],[352,250],[280,325],[209,357],[179,350],[133,303],[83,251],[20,221]])],breathAnchor:[175,420],breathAmount:.04},
 'launch-heel-slide':ground('heel-slide-v2',Array.from({length:4},()=>[256,390]),{frameCount:4,machineCell:7,spriteScale:.9,sequence:[0,1,2,3,2,1],durations:[.7,.5,.5,.7,.5,.5]}),
 'launch-clam':ground('launch-clam',Array.from({length:6},()=>[256,410]),{spriteScale:.9}),
 'launch-catcow':ground('launch-catcow',Array.from({length:6},()=>[256,410]),{spriteScale:.72,sequence:[0,1,2,1,0,4,5,4],durations:[.8,.55,.8,.55,.8,.55,.8,.55]}),
 'launch-dog-plank':ground('launch-dog-plank',Array.from({length:6},()=>[256,440]),{spriteScale:.9,sequence:[0,1,2,3,4,5],durations:[.8,.6,.8,.8,.6,.8]})
};
