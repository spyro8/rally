// One continuous field moves the complete illustration, anchored at the pelvis.
const clamp=n=>Math.max(0,Math.min(1,n));
export function bodyBreath(time,active,period){if(!active)return {inhale:0,effort:0};const phase=2*Math.PI*Math.max(0,Number.isFinite(time)?time:0)/period;return {inhale:(1+Math.cos(phase))/2,effort:(1-Math.cos(phase))/2};}
export function bodyPoint(point,anchor,breath){const [x,y]=point,hipY=anchor[1]-85,hipX=anchor[0]-90,height=Math.max(0,hipY-y);if(!height)return [x,y];const upper=clamp(height/125),rib=Math.sin(Math.PI*clamp(height/155));
 return [x-height*.035*(breath.inhale+breath.effort)+(x-hipX)*.045*breath.inhale*rib,y-4.5*breath.inhale*upper-1.5*breath.effort*upper];}
const surfaces=new WeakMap();
export function drawBreathingFigure(ctx,frame,anchor,breath){if(!breath.inhale&&!breath.effort){ctx.drawImage(frame.canvas,0,0);return;}
 let surface=surfaces.get(frame.canvas);if(!surface){const canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;const context=canvas.getContext('2d');surface={canvas,context,source:frame.canvas.getContext('2d').getImageData(0,0,frame.width,frame.height).data,output:context.createImageData(frame.width,frame.height)};surfaces.set(frame.canvas,surface);}
 const {source,output}=surface,w=frame.width,h=frame.height,hipY=anchor[1]-85,lift=4.5*breath.inhale+1.5*breath.effort;
 // Inverse sampling avoids cracks or overlapping strips at deformation boundaries.
 for(let y=0;y<h;y++){
  const sy=y>=hipY?y:y<hipY-125-lift?y+lift:(y+lift*hipY/125)/(1+lift/125);
  const [offset]=bodyPoint([0,sy],anchor,breath),[unit]=bodyPoint([1,sy],anchor,breath),scale=unit-offset;
  const y0=Math.floor(sy),fy=sy-y0;
  for(let x=0;x<w;x++){
   const sx=(x-offset)/scale,x0=Math.floor(sx),fx=sx-x0,out=(y*w+x)*4;
   let alpha=0,r=0,g=0,b=0;
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const xx=x0+dx,yy=y0+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const i=(yy*w+xx)*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy)*source[i+3];alpha+=weight;r+=source[i]*weight;g+=source[i+1]*weight;b+=source[i+2]*weight;}
   output.data[out]=alpha?r/alpha:0;output.data[out+1]=alpha?g/alpha:0;output.data[out+2]=alpha?b/alpha:0;output.data[out+3]=alpha;
  }
 }
 surface.context.putImageData(output,0,0);ctx.drawImage(surface.canvas,0,0);
}
