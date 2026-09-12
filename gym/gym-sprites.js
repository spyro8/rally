import {launchMotions} from './launch-motion.js';
import {legsMotions} from './legs-motion.js';
import {rowMotion,prepareRowMotion,drawRowMotion} from './row-motion.js';
import {pushMotions,pushFrame} from './push-motion.js';
import {prepareRegisteredMotion,drawRegisteredMotion} from './registered-motion.js';
import {latMotion,prepareLatMotion,drawLatMotion} from './lat-motion.js';
import {correctedRigs,prepareCorrectedRig,drawCorrectedRig} from './gym-rig.js';
// Original-style raster animation. Equipment is drawn once in fixed world space.
// Per-frame registration aligns the body's contact points, never the moving hands.
export const gymSpriteSpecs={
 'back-squat':{file:'motion-back-squat',gear:'rack',mode:'loop',spriteScale:.72,anchors:[[287,504],[287,504],[287,504],[287,474],[287,474],[287,474]],gearRect:[-161,-390,326,394]},
 'db-rdl':{file:'motion-db-rdl',mode:'loop',spriteScale:.72,anchors:[[270,496],[252,496],[272,496],[266,496],[268,496],[264,496]]},
 'leg-press':{file:'motion-leg-press',gear:'legPress',mode:'loop',spriteScale:.7,anchors:[[235,567],[235,567],[235,567],[235,555],[235,555],[235,555]],gearRect:[-213,-332,355,336],attachment:'footplate',contacts:[[473,211],[450,282],[392,290],[447,258],[479,219],[479,219]]},
 'leg-curl':{file:'motion-leg-curl',gear:'legCurl',mode:'loop',spriteScale:.78,anchors:[[275,638],[275,638],[275,638],[275,598],[275,598],[275,598]],gearRect:[-206,-324,385,328],attachment:'ankleRoller',contacts:[[88,447],[97,356],[111,325],[105,333],[90,390],[66,413]]},
 'calf-raise':{file:'motion-calf-raise',mode:'loop',frameSeconds:.32,spriteScale:.82,anchors:[[303,508],[266,508],[268,508],[301,496],[268,496],[268,496]],sequence:[1,3,0,4,5,4,0,3]},
 'leg-raise':{file:'motion-leg-raise',mode:'loop',spriteScale:.78,anchors:[[263,445],[263,445],[263,445],[263,405],[263,405],[263,405]]},
 'db-bench':{file:'motion-db-bench',gear:'flatBench',mode:'loop',spriteScale:.78,gearRect:[-168,-121,302,123],anchors:[[270,508],[274,508],[276,508],[270,478],[274,478],[276,478]]},
 'db-overhead':{file:'motion-db-overhead',gear:'shoulderBench',mode:'pingpong',spriteScale:.76,anchors:[[277,482],[265,482],[266,482],[277,492],[265,492],[266,492]],gearRect:[-96,-278,212,283]},
 'lateral-raise':{file:'motion-lateral-raise',mode:'pingpong',spriteScale:.74,anchors:[[252,492],[253,492],[251,492],[252,488],[253,488],[251,488]]},
 'rear-delt':{file:'motion-rear-delt',mode:'pingpong',spriteScale:.74,anchors:[[247,467],[247,467],[247,467],[247,467],[247,467],[247,467]]},
 'db-curl':{file:'motion-db-curl',mode:'pingpong',spriteScale:.74,anchors:[[242,490],[247,490],[250,490],[242,490],[247,490],[250,490]]},
 'hammer-curl':{file:'motion-hammer-curl',mode:'pingpong',spriteScale:.74,anchors:[[266,490],[246,490],[246,490],[266,490],[246,490],[246,490]]}
};
for(const [id,rig] of Object.entries(correctedRigs))gymSpriteSpecs[id]={file:'corrected-'+rig.art,extra:'corrected-'+rig.art+'-base',rig:true,anchors:Array.from({length:6},()=>[rig.center,rig.floor])};
gymSpriteSpecs['lat-pulldown']=latMotion;
gymSpriteSpecs['cable-row']=rowMotion;
Object.assign(gymSpriteSpecs,pushMotions,legsMotions,launchMotions);
gymSpriteSpecs['lateral-raise'].frameSeconds=.32;
// Reuse complete Ash figures; omit the curl pose that reverses the ascent.
gymSpriteSpecs['db-curl'].sequence=[0,1,2,4,5,4,2,1];
gymSpriteSpecs['db-curl'].frameSeconds=.34;
gymSpriteSpecs['rear-delt'].frameSeconds=.32;
export const equipmentSpecs={pressTower:{sheet:2,cell:0},rack:{sheet:0,cell:0},flatBench:{sheet:0,cell:1},inclineBench:{sheet:0,cell:2},shoulderBench:{sheet:0,cell:3},latTower:{sheet:0,cell:4},rowStation:{sheet:0,cell:5},legPress:{sheet:1,cell:0},legCurl:{sheet:1,cell:1},footplate:{sheet:1,cell:2},ankleRoller:{sheet:1,cell:3}};
const equipmentCache=new WeakMap();
const create=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function rasterCell(image,col,row,cols=3,rows=2,rect=null){
 const [sx,sy,w,h]=rect??[Math.round(col*image.width/cols),Math.round(row*image.height/rows),Math.round(image.width/cols),Math.round(image.height/rows)],c=create(w,h),x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,sx,sy,w,h,0,0,w,h);
 const d=x.getImageData(0,0,w,h),p=d.data;let left=w,right=0,top=h,bottom=0;
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const i=(y*w+xx)*4,r=p[i],g=p[i+1],b=p[i+2];if((r+b>80&&r>g*1.5+15&&b>g*1.5+15)||(r>220&&g<40&&b<40))p[i+3]=0;if(p[i+3]>120){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 const seen=new Uint8Array(w*h),parts=[];for(let q=0;q<w*h;q++){if(seen[q]||p[q*4+3]<120)continue;const stack=[q],part=[];seen[q]=1;while(stack.length){const k=stack.pop();part.push(k);const xx=k%w,yy=Math.floor(k/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=xx+dx,ny=yy+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;const n=ny*w+nx;if(!seen[n]&&p[n*4+3]>=120){seen[n]=1;stack.push(n);}}}parts.push(part);}const limit=Math.max(40,Math.max(0,...parts.map(a=>a.length))*.003);for(const part of parts)if(part.length<limit)for(const k of part)p[k*4+3]=0;
 x.putImageData(d,0,0);return {canvas:c,left,right,top,bottom,width:w,height:h};
}
export function animationFrame(time,mode='pingpong',count=6){const sequence=mode==='loop'?Array.from({length:count},(_,i)=>i):[...Array.from({length:count},(_,i)=>i),...Array.from({length:Math.max(0,count-2)},(_,i)=>count-2-i)];return sequence[Math.floor(Math.max(0,time)/(.4))%sequence.length];}
export function prepareGymSprite(id,image,equipmentImages,extraImage=null){
 const spec=gymSpriteSpecs[id];if(!spec)throw Error('No animation for '+id);
 if(spec.registered)return {id,spec,registered:prepareRegisteredMotion(image,spec,rasterCell)};
 if(spec.wholeRow)return {id,spec,wholeRow:prepareRowMotion(image,extraImage,rasterCell)};
 if(spec.fullBody)return {id,spec,fullBody:prepareLatMotion(image,extraImage,rasterCell)};
 if(spec.rig)return {id,spec,rig:prepareCorrectedRig(id,image,extraImage,rasterCell)};
 const frames=Array.from({length:6},(_,i)=>rasterCell(image,i%3,Math.floor(i/3),3,2,spec.rects?.[i]));
 if(extraImage)frames[3]=rasterCell(extraImage,0,0,1,1);const gears={};for(const [name,entry] of Object.entries(equipmentSpecs)){const im=equipmentImages[entry.sheet];if(im){let cache=equipmentCache.get(im);if(!cache){cache=new Map();equipmentCache.set(im,cache);}if(!cache.has(name))cache.set(name,rasterCell(im,entry.cell%(entry.sheet?2:3),Math.floor(entry.cell/(entry.sheet?2:3)),entry.sheet?2:3,2,entry.sheet===2?[0,0,im.width,im.height]:entry.rect??(entry.sheet?[[0,0,640,680],[640,0,614,680],[0,700,750,554],[832,950,370,170]][entry.cell]:[(entry.cell%3)*512,entry.cell<3?0:500,512,entry.cell<3?500:524])));gears[name]=cache.get(name);}}
 return {id,spec,frames,gears};
}
export function drawGymSprite(ctx,animation,time,active,x,floor,scale){
 if(animation.registered){const spec=animation.spec;drawRegisteredMotion(ctx,animation.registered,pushFrame(spec,time,active),time,active,x,floor,scale,spec.durations.reduce((a,b)=>a+b,0));return;}
 if(animation.wholeRow){drawRowMotion(ctx,animation.wholeRow,time,active,x,floor,scale);return;}
 if(animation.fullBody){drawLatMotion(ctx,animation.fullBody,time,active,x,floor,scale);return;}
 if(animation.rig){drawCorrectedRig(ctx,animation.rig,time,active,x,floor,scale);return;}
 const {spec,frames,gears}=animation,index=active?spec.sequence?spec.sequence[Math.floor(Math.max(0,time)/(spec.frameSeconds??.4))%spec.sequence.length]:animationFrame(time*.4/(spec.frameSeconds??.4),spec.mode):0,frame=frames[index];
 ctx.save();ctx.translate(x,floor);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#051b2240';ctx.beginPath();ctx.ellipse(0,3,spec.gear?130:70,7,0,0,Math.PI*2);ctx.fill();
 if(spec.gear==='legPress'){for(const [a,b] of [[[12,-82],[229,-299]],[[41,-66],[258,-283]]]){ctx.strokeStyle='#22282d';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.strokeStyle='#8b9295';ctx.lineWidth=4;ctx.stroke();}}
 if(spec.gear&&gears[spec.gear]){const g=gears[spec.gear],r=spec.gearRect??[-170,-340,340,340];ctx.drawImage(g.canvas,g.left,g.top,g.right-g.left+1,g.bottom-g.top+1,...r);}
 const a=spec.anchors?.[index]??[frame.width/2,frame.bottom];const size=(spec.spriteScale??1)*(spec.frameScales?.[index]??1);
 if(spec.cableFrom&&spec.contacts){const pt=spec.contacts[index];ctx.strokeStyle='#b7c2c1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...spec.cableFrom);ctx.lineTo((pt[0]-a[0])*size,(pt[1]-a[1])*size);ctx.stroke();}
 if(spec.attachment==='footplate'&&gears.footplate){const pt=spec.contacts[index],g=gears.footplate;ctx.drawImage(g.canvas,g.left,g.top,g.right-g.left+1,g.bottom-g.top+1,(pt[0]-a[0])*size-43,(pt[1]-a[1])*size-65,170,132);}
 ctx.save();ctx.translate(-a[0]*size,-a[1]*size);ctx.scale(size,size);if(spec.affines?.[index])ctx.transform(...spec.affines[index]);ctx.drawImage(frame.canvas,0,0);ctx.restore();if(spec.attachment==='ankleRoller'&&gears.ankleRoller){const pt=spec.contacts[index],g=gears.ankleRoller,px=(pt[0]-a[0])*size,py=(pt[1]-a[1])*size;ctx.strokeStyle='#6c7479';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-94,-127);ctx.lineTo(px,py);ctx.stroke();ctx.drawImage(g.canvas,g.left,g.top,g.right-g.left+1,g.bottom-g.top+1,px-31,py-13,68,31);}ctx.restore();
}
