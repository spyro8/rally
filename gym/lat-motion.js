import {prepareRegisteredMotion,drawRegisteredMotion} from './registered-motion.js';
const contacts=[[213,117],[215,145],[216,176],[225,241],[226,267],[222,272]];
const outline=top=>[[105,100],[246,100],[246,311],[258,345],[294,351],[301,365],[298,390],[288,426],[288,451],[314,463],[319,480],[306,487],[272,487],[247,482],[241,474],[248,447],[254,424],[257,400],[267,383],[245,389],[211,390],[171,388],[158,378],[150,342],[111,298]];
export const latMotion={file:'ironwood-lat-aligned',fullBody:true,mode:'loop',frameCount:6,columns:4,rows:2,machineCell:6,
 anchors:Array.from({length:6},()=>[211,390]),origin:[290,488],spriteScale:.9,breathAnchor:[295,475],breathAmount:.2,
 sequence:[0,1,2,3,4,5,4,3,2,1],durations:[.26,.26,.26,.26,.22,.5,.36,.36,.36,.36],contacts,pulley:[224,44],bodyPolygons:contacts.map(p=>outline(p[1]-9)),erase:contacts.map(p=>[[p[0]-9,0,20,p[1]-6]]),foreground:[[253,319,53,35]]};
export const latPeriod=latMotion.durations.reduce((a,b)=>a+b,0);
export function latFrame(time,active){let t=active?Math.max(0,Number.isFinite(time)?time:0)%latPeriod:0;for(let i=0;i<latMotion.sequence.length;i++){if(t<latMotion.durations[i]-1e-9)return latMotion.sequence[i];t-=latMotion.durations[i];}return 0;}
export function prepareLatMotion(image,machine,rasterCell){return prepareRegisteredMotion(image,latMotion,rasterCell);}
export function drawLatMotion(ctx,animation,time,active,x,floor,scale){drawRegisteredMotion(ctx,animation,latFrame(time,active),time,active,x,floor,scale,latPeriod);}
