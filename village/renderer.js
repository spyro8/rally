import {meadowLife,waterfallLife,canopyLight} from './living-nature.js';
import {CROPS} from './economy.js';
import {itemById,footprint,bounds,isGround,canPlace,cropStatus,ROOM_THEMES} from './core.js';
import {paintSprite,paintShadow,sprites,opaqueAt} from './art.js';
import {createResidents,VILLAGER_SIZE} from './residents.js';
import {paintTerrain} from './terrain.js';
import {planPlacement} from './placement.js';
import {layoutObjects,canStampLayout} from './layouts.js';
import {atmosphere} from './environment.js';
import {drawAtmosphere} from './atmosphere.js';
import {createLandscape,sceneryAt} from './landscape.js';
export const project=(x,y)=>({x:(x-y)*32,y:(x+y-128)*16});
export function createRenderer(canvas,get){const ctx=canvas.getContext('2d');let width=0,height=0,frame,last=0;const residents=createResidents();let groundMap=new Map(),activeTime=0,activeWorld=null,activeSky=null,residentView=[],pickables=[],peopleBoxes=[];const camera={x:0,y:0,zoom:1};const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const landscape=createLandscape();
function resize(){width=canvas.clientWidth;height=canvas.clientHeight;const d=Math.min(2,devicePixelRatio||1);canvas.width=width*d;canvas.height=height*d;}
function fit(room=false){camera.x=0;camera.y=room?80:Math.max(20,Math.round((height-560)/4));camera.zoom=Math.min(room?1.35:1.15,Math.max(.65,width/(room?700:900)));}
function screen(x,y){const p=project(x,y);return{x:width/2+camera.x+p.x*camera.zoom,y:height*.46+camera.y+p.y*camera.zoom};}
function tile(x,y){const a=(x-width/2-camera.x)/camera.zoom/32,b=(y-height*.46-camera.y)/camera.zoom/16+128;return{x:Math.floor((a+b)/2),y:Math.floor((b-a)/2)};}
function diamond(x,y,color,stroke){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+32,y+16);ctx.lineTo(x,y+32);ctx.lineTo(x-32,y+16);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function hash(x,y,n){let a=Math.imul(x+1927,y+719)^Math.imul(n+39,83492791);return (a>>>0)%997/997;}
function ground(x,y,id='meadow',grid=false){paintTerrain(ctx,x,y,id,activeWorld?.season||'summer',activeTime,grid);if(['water','stream'].includes(id)){const p=project(x,y),edges=[[-1,0,0,0,-32,16],[0,-1,0,0,32,16],[1,0,32,16,0,32],[0,1,-32,16,0,32]];for(const[dx,dy,ax,ay,bx,by]of edges){if(['water','stream'].includes(groundMap.get(`${x+dx},${y+dy}`)))continue;ctx.beginPath();ctx.moveTo(p.x+ax,p.y+ay);ctx.lineTo(p.x+bx,p.y+by);ctx.strokeStyle='#b8a271';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#dce6c08c';ctx.lineWidth=1;ctx.stroke();}}}
function object(o,alpha=1,state){const d=itemById(o.type),f=footprint(o),p=project(o.x+f.w/2,o.y+f.h/2);if(d.ground&&!d.sprite){ground(o.x,o.y,o.type);return;}let size=d.size;if(o.type==='crop'){const status=cropStatus(state,o);if(status==='empty'){ground(o.x,o.y,'farmland');return;}size=status==='ready'?58:status==='growing'?48:36;}
const plants=['Trees','Greenery','Flowers'].includes(d.group),gust=Math.max(0,Math.sin(activeTime*.00022));
const sway=plants&&activeTime?(Math.sin(activeTime*.0012+o.x*.4+o.y*.2)*.009+gust*.011):0;
const spriteKey=o.type==='crop'&&o.crop?`crops:${Math.max(0,CROPS.findIndex(c=>c.id===o.crop.kind))*2+(cropStatus(state,o)==='ready'?1:0)}`:d.variants?.[o.variant||0]||d.sprite;paintSprite(ctx,spriteKey,p.x,p.y,size,{flip:o.rotation===1,alpha:o.open?.55:alpha,sway});
if(o.id&&alpha===1){const img=sprites.get(spriteKey);if(img){const anchor=screen(o.x+f.w/2,o.y+f.h/2),w=size*camera.zoom,h=w*img.height/img.width;pickables.push({o,key:spriteKey,x:anchor.x-w/2,y:anchor.y-h+8*camera.zoom,w,h,flip:o.rotation===1});}}
if(d.activity==='restore'){const stage=o.restoration||0;paintSprite(ctx,'nature:8',p.x-35,p.y-6,42-stage*7,{alpha:.9});if(stage===0)paintSprite(ctx,'nature:10',p.x+35,p.y-3,45,{alpha:.85});ctx.fillStyle='#e8d599';for(let i=0;i<3;i++){ctx.globalAlpha=i<stage?1:.25;ctx.fillRect(p.x-10+i*8,p.y+12,5,3);}ctx.globalAlpha=1;}
if(activeTime&&o.type==='sprinkler'){ctx.fillStyle='#c3edff85';for(let i=0;i<8;i++){const phase=(activeTime*.0006+i/8)%1;ctx.fillRect(p.x+Math.cos(i)*phase*22,p.y-20+phase*phase*18,2,2);}}
if(['waterfall','cascade'].includes(o.type))waterfallLife(ctx,p.x,p.y,size,activeTime,activeSky.daylight);
if(activeTime&&d.home){for(let i=0;i<3;i++){const life=(activeTime*.00012+i*.33)%1;ctx.fillStyle=`rgba(206,211,195,${(1-life)*.17})`;ctx.fillRect(p.x+12+Math.sin(life*4)*9,p.y-size*.7-life*36,5+life*6,4+life*4);}}
}
function draw(time){frame=requestAnimationFrame(draw);if(document.hidden||time-last<33)return;const delta=Math.min(80,time-last);last=time;pickables=[];peopleBoxes=[];const {state,scope,room,placing,moving,rotation,cursor,selection,brushSize=1,layoutId,sandbox,roomId}=get(),b=bounds(scope);groundMap=new Map(scope.objects.filter(isGround).map(o=>[`${o.x},${o.y}`,o.type]));activeWorld=state.world;activeSky=atmosphere(state.world);const motion=!reduced&&state.world.motion;activeTime=motion?time:0;const dpr=Math.min(2,devicePixelRatio||1);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=room?'#23382f':'#4c6350';ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(width/2+camera.x,height*.46+camera.y);ctx.scale(camera.zoom,camera.zoom);ctx.imageSmoothingEnabled=false;const corners=[tile(-160,-160),tile(width+160,-160),tile(0,height+180),tile(width+160,height+180)];const minX=room?b.min:Math.max(0,Math.min(...corners.map(p=>p.x))-3),maxX=room?b.max-1:Math.min(127,Math.max(...corners.map(p=>p.x))+3),minY=room?b.min:Math.max(0,Math.min(...corners.map(p=>p.y))-3),maxY=room?b.max-1:Math.min(127,Math.max(...corners.map(p=>p.y))+3);
if(room){for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)ground(x,y,room.floor,!!placing);}
else{
 const left=(-width/2-camera.x)/camera.zoom,top=(-height*.46-camera.y)/camera.zoom;
 landscape.draw(ctx,{left,top,right:left+width/camera.zoom,bottom:top+height/camera.zoom},b,state.world.season,activeTime);
 if(placing||layoutId){for(let y=Math.max(b.min,minY);y<Math.min(b.max,maxY+1);y++)for(let x=Math.max(b.min,minX);x<Math.min(b.max,maxX+1);x++){const p=project(x,y);diamond(p.x,p.y,'#00000000','#101b16b3');}}
}
if(room){residentView=[];const a=project(b.min,b.min),l=project(b.min,b.max),r=project(b.max,b.min);ctx.fillStyle=ROOM_THEMES[room.wall];ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(a.x,a.y);ctx.lineTo(r.x,r.y);ctx.lineTo(r.x,r.y-105);ctx.lineTo(a.x,a.y-105);ctx.lineTo(l.x,l.y-105);ctx.closePath();ctx.fill();ctx.strokeStyle='#e0d7b28c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(l.x,l.y-8);ctx.lineTo(a.x,a.y-8);ctx.lineTo(r.x,r.y-8);ctx.stroke();}
for(const o of scope.objects)if(isGround(o)&&o.id!==moving)object(o,1,state);
if(!room){for(let y=Math.max(b.min,minY);y<=Math.min(b.max-1,maxY);y++)for(let x=Math.max(b.min,minX);x<=Math.min(b.max-1,maxX);x++)meadowLife(ctx,x,y,groundMap.get(`${x},${y}`)||'meadow',activeTime,state.world.season);for(const o of scope.objects){const d=itemById(o.type);if(!d.home&&d.group!=='Trees')continue;const f=footprint(o),p=project(o.x+f.w/2,o.y+f.h/2),v=screen(o.x,o.y);if(v.x< -220||v.x>width+220||v.y< -180||v.y>height+220)continue;paintShadow(ctx,d.variants?.[o.variant||0]||d.sprite,p.x,p.y,d.size,{daylight:activeSky.daylight,hour:activeSky.hour,flip:o.rotation===1});if(d.group==='Trees')canopyLight(ctx,p,d.size,activeTime,activeSky);}}
const drawables=scope.objects.filter(o=>!isGround(o)&&!itemById(o.type).resident&&o.id!==moving).map(o=>({o,depth:o.x+o.y+(footprint(o).w+footprint(o).h)/2}));
if(room){residentView=residents(state,time,delta,!motion);let index=0;for(const actor of residentView.filter(a=>a.placed&&a.hidden&&a.homeId===roomId)){drawables.push({...actor,hidden:false,x:62.5+index%4,y:63.5+Math.floor(index/4),depth:126+index%4+Math.floor(index/4)});index++;}}
if(!room){
for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const o=sceneryAt(x,y,b);if(o){const d=itemById(o.type),p=project(x+.5,y+.5);paintShadow(ctx,d.sprite,p.x,p.y,d.size*.8,{daylight:activeSky.daylight,hour:activeSky.hour});drawables.push({o:{...o,rotation:0},depth:x+y+1,scenery:true});}}
residentView=residents(state,time,delta,!motion);drawables.push(...residentView.filter(p=>!p.hidden&&p.id!==moving));
}

drawables.sort((a,b)=>a.depth-b.depth);for(const e of drawables){if(e.person){const p=project(e.x,e.y);paintSprite(ctx,e.key,p.x,p.y+(e.bob||0),e.size,{flip:e.flip});const at=screen(e.x,e.y);peopleBoxes.push({id:e.id,placed:e.placed,x:at.x,y:at.y-18*camera.zoom,r:25*camera.zoom});continue;}const p=screen(e.o.x,e.o.y);if(p.x< -220||p.x>width+220||p.y< -50||p.y>height+260)continue;object(e.o,e.scenery?.82:1,state);}
if(layoutId){const objects=layoutObjects(layoutId,cursor.x,cursor.y),valid=canStampLayout(state,scope,layoutId,cursor.x,cursor.y,sandbox);for(const o of objects){const f=footprint(o);for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){const p=project(o.x+x,o.y+y);diamond(p.x,p.y,valid?'#d8ed9970':'#e0808670');}object(o,.55,state);}}
if(placing){const o={type:placing,x:cursor.x,y:cursor.y,rotation},valid=planPlacement(scope,{...o,id:'ghost'},brushSize,moving).valid,f=isGround(o)&&!room?{w:brushSize,h:brushSize}:footprint(o);for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){const p=project(o.x+x,o.y+y);diamond(p.x,p.y,valid?'#e0ebaa75':'#e7858c88',valid?'#e4eeb7':'#ffb0b0');}object(o,.6,state);}else if(selection){const o=scope.objects.find(o=>o.id===selection);if(o){const f=footprint(o),actor=residentView.find(a=>a.id===o.id),p=actor&&!room?project(actor.x,actor.y):project(o.x+f.w/2,o.y+f.h/2);ctx.strokeStyle='#f6d996';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+7,23,10,0,0,Math.PI*2);ctx.stroke();}}
ctx.restore();
const lights=scope.objects.filter(o=>{const d=itemById(o.type);return d.home||d.glow||['lantern','fireplace'].includes(o.type);}).map(o=>{const f=footprint(o),p=screen(o.x+f.w/2,o.y+f.h/2);return{x:p.x,y:p.y-(itemById(o.type).home?42:25)*camera.zoom,radius:(itemById(o.type).home?65:45)*camera.zoom,blue:o.type==='crystal'};}).filter(p=>p.x>-100&&p.x<width+100&&p.y>-100&&p.y<height+100);
drawAtmosphere(ctx,{width,height,time,sky:activeSky,motion,world:state.world,lights,inside:!!room});}
resize();fit();window.addEventListener('resize',resize);frame=requestAnimationFrame(draw);return{camera,screen,tile,fit,resize,focus(x,y){const p=screen(x,y);camera.x+=width/2-p.x;camera.y+=height*.48-p.y;},getResidents:()=>residentView,pickResident(x,y){return [...peopleBoxes].reverse().find(p=>p.placed&&Math.hypot(x-p.x,y-p.y)<p.r)?.id||null;},pickObject(x,y){return [...pickables].reverse().find(p=>opaqueAt(p.key,p.flip?1-(x-p.x)/p.w:(x-p.x)/p.w,(y-p.y)/p.h))?.o||null;},destroy(){cancelAnimationFrame(frame);window.removeEventListener('resize',resize);}};}
