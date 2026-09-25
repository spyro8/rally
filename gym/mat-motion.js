// A common world scale for Ember. Pose height never determines zoom.
const full=[[0,0],[512,0],[512,512],[0,512]];
const common={registered:true,mode:'loop',columns:4,rows:2,machineCell:null,spriteScale:.9,breathAmount:0,bodyPolygons:[full],origin:[256,480],autoGround:true,foreground:[],breathAnchor:[256,480]};
const yoga=(cell,extra={})=>({...common,file:'ember-yoga-diversity',cells:[cell],frameCount:1,sequence:[0],durations:[5],offsets:[[0,0]],...extra});
const atlasRects=Array.from({length:12},(_,i)=>[(i%3)*362,[0,360,670,985][Math.floor(i/3)],362,[360,310,315,463][Math.floor(i/3)]]);
function retained(indices,hold=false){const rects=indices.map(i=>atlasRects[i]);return {...common,file:'trainer-04',frameCount:indices.length,rects,frameRects:rects.map(([, ,w,h])=>[(512-w*1.15)/2,0,w*1.15,h*1.15]),offsets:indices.map(()=>[0,0]),sequence:hold?[0]:indices.map((_,i)=>i),durations:hold?[5]:indices.map(()=>1.2)};}
const cycle=file=>({...common,file,frameCount:6,sequence:[0,1,2,3,4,5],durations:Array(6).fill(.5),offsets:Array.from({length:6},()=>[0,0])});
export const matMotions={
 'mat-mountain':yoga(0), 'mat-low-lunge':yoga(1), 'mat-tree':yoga(2),
 'mat-twist':yoga(3), 'mat-butterfly':yoga(4), 'mat-rest':yoga(5,{rects:[[425,443,462,444]],frameRect:[25,0,462,444]}),
 'mat-deadbug':retained([0,1]), 'mat-bridge':retained([2,3]),
 'mat-bird':retained([4,5]), 'mat-warrior':retained([6],true),
 'mat-child':retained([8],true), 'mat-opener':retained([10,11]),
 'mat-front-support':{...common,file:'launch-dog-plank',cells:[0],frameCount:1,sequence:[0],durations:[5],offsets:[[0,0]]},
 'mat-hundred':cycle('ember-pilates-hundred'), 'mat-prone-leg':cycle('ember-pilates-prone-leg')
};
