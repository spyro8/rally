// Complete gait/revolution cycles advance forward; they never play in reverse.
const full=[[0,0],[512,0],[512,512],[0,512]];
const common={registered:true,mode:'loop',frameCount:6,columns:4,rows:2,machineCell:7,sequence:[0,1,2,3,4,5],spriteScale:.9,breathAmount:0,foreground:[],bodyPolygons:[full],origin:[256,480],breathAnchor:[256,480],offsets:Array.from({length:6},()=>[0,0])};
const tempo=period=>Array(6).fill(period/6);
const run={...common,file:'cardio-kai-run',durations:tempo(.9),offsets:[[0,0],[0,0],[0,0],[0,0],[12,8],[12,8]]};
const bike={...common,file:'cardio-sage-bike-front',origin:[256,496],machineCell:0,frameRect:[64,0,384,512],machineRect:[64,0,384,512],machinePolygons:[[[0,432],[512,432],[512,512],[0,512]]],bodyPolygons:[[[0,0],[512,0],[512,432],[0,432]]],durations:tempo(.9)};
export const cardioMotions={
 'cardio-jog':{...run,durations:tempo(1)},
 'cardio-run':{...run,durations:tempo(.8)},
 'cardio-spin-easy':{...bike,durations:tempo(1.1)},
 'cardio-spin':{...bike,durations:tempo(.9)},
 'cardio-spin-brisk':{...bike,durations:tempo(.75)}
};
