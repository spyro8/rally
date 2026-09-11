import {prepareRegisteredMotion,drawRegisteredMotion} from './registered-motion.js';
const contacts=[[272,253],[244,257],[191,265],[173,273],[161,275],[149,275]];
const outline=right=>[[20,105],[right+2,105],[right+2,301],[347,301],[350,335],[342,361],[328,387],[308,406],[289,405],[281,391],[263,386],[219,372],[195,350],[166,355],[142,360],[82,360],[55,351],[20,331]];
export const rowMotion={file:'ironwood-row-aligned',wholeRow:true,mode:'loop',frameCount:6,columns:4,rows:2,machineCell:6,
 anchors:Array.from({length:6},()=>[95,359]),origin:[256,450],spriteScale:.92,breathAnchor:[184,444],breathAmount:.22,
 sequence:[0,1,2,3,4,5,4,3,2,1],durations:[.26,.26,.26,.26,.22,.5,.36,.36,.36,.36],contacts,pulley:[389,249],bodyPolygons:contacts.map(p=>outline(p[0])),foreground:[]};
export const rowPeriod=rowMotion.durations.reduce((a,b)=>a+b,0);
export function rowFrame(time,active){let t=active?Math.max(0,Number.isFinite(time)?time:0)%rowPeriod:0;for(let i=0;i<rowMotion.sequence.length;i++){if(t<rowMotion.durations[i]-1e-9)return rowMotion.sequence[i];t-=rowMotion.durations[i];}return 0;}
export function prepareRowMotion(image,machine,rasterCell){return prepareRegisteredMotion(image,rowMotion,rasterCell);}
export function drawRowMotion(ctx,animation,time,active,x,floor,scale){drawRegisteredMotion(ctx,animation,rowFrame(time,active),time,active,x,floor,scale,rowPeriod);}
