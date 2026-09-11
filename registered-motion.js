import {bodyBreath,drawBreathingFigure} from './lat-breath.js';

// All coordinates belong to one assembled scene. The illustrated body is a
// complete cutout; apparatus is sampled once and never changes with the pose.
function surface(){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;return canvas;}
export function prepareRegisteredMotion(image,spec,rasterCell){
 const cell=i=>{const n=spec.cells?.[i]??i;return rasterCell(image,n%spec.columns,Math.floor(n/spec.columns),spec.columns,spec.rows,spec.rects?.[i]);};
 const machine=surface(),mc=machine.getContext('2d'),base=spec.machineCell==null?null:cell(spec.machineCell);
 mc.save();if(spec.machinePolygons){mc.beginPath();for(const outline of spec.machinePolygons){outline.forEach(([x,y],n)=>n?mc.lineTo(x,y):mc.moveTo(x,y));mc.closePath();}mc.clip();}
 if(base)mc.drawImage(base.canvas,0,0,base.width,base.height,...(spec.machineRect??[0,0,512,512]));
 mc.restore();
 for(const patch of spec.machinePatches??[]){const source=cell(patch.cell);mc.drawImage(source.canvas,...patch.source.map(n=>n*source.width/512),...patch.target);}
 const frames=Array.from({length:spec.frameCount},(_,i)=>{
  const source=cell(i),canvas=surface(),ctx=canvas.getContext('2d'),polygon=spec.bodyPolygons[i]??spec.bodyPolygons[0];
  ctx.beginPath();for(const outline of [polygon,...(spec.extraPolygons?.[i]??[])]){outline.forEach(([x,y],n)=>n?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}ctx.clip();
  ctx.drawImage(source.canvas,0,0,source.width,source.height,...(spec.frameRects?.[i]??spec.frameRect??[0,0,512,512]));
  for(const rect of spec.erase?.[i]??[])ctx.clearRect(...rect);
  return {canvas,width:512,height:512};
 });
 const offsets=spec.autoGround?frames.map((f,i)=>{const pixels=f.canvas.getContext('2d').getImageData(0,0,512,512).data;let bottom=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(pixels[(y*512+x)*4+3]>100)bottom=y+1;return [spec.offsets?.[i]?.[0]??0,spec.origin[1]-bottom];}):spec.offsets;
 return {spec,machine,frames,offsets};
}
export function drawRegisteredMotion(ctx,animation,index,time,active,x,floor,scale,period){
 const {spec,machine,frames}=animation,offset=animation.offsets?.[index]??spec.offsets?.[index]??[0,0];
 ctx.save();ctx.translate(x,floor);ctx.scale(scale*spec.spriteScale,scale*spec.spriteScale);ctx.translate(-spec.origin[0],-spec.origin[1]);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(machine,0,0);
 if(spec.pulley&&spec.contacts){const hand=spec.contacts[index];ctx.beginPath();ctx.moveTo(...spec.pulley);ctx.lineTo(hand[0]+offset[0],hand[1]+offset[1]);ctx.strokeStyle='#18201d';ctx.lineWidth=2.8;ctx.stroke();ctx.strokeStyle='#9da8a1';ctx.lineWidth=1;ctx.stroke();}
 ctx.save();ctx.translate(...offset);
 const breath=bodyBreath(time,active,period);
 // Gentle respiration acts on the whole torso/head, with the seat and feet fixed.
 breath.inhale*=spec.breathAmount??.3;breath.effort*=spec.breathAmount??.3;
 drawBreathingFigure(ctx,frames[index],spec.breathAnchor,breath);ctx.restore();
 for(const [sx,sy,w,h] of spec.foreground??[])ctx.drawImage(machine,sx,sy,w,h,sx,sy,w,h);
 ctx.restore();
}
