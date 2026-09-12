// Cosmetic landscape only. Never writes objects, saves, rewards or collision data.
const CHUNK=256, MAX_CHUNKS=80;
export function landscapeChunkSize(rect){return CHUNK*2**Math.max(0,Math.ceil(Math.log2(Math.max(rect.right-rect.left,rect.bottom-rect.top)/1536)));}
export function grain(x,y,s=0){let n=Math.imul(x+131,374761393)^Math.imul(y+719,668265263)^s;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function smooth(v){return v*v*(3-2*v);}
function noise(x,y){const a=Math.floor(x),b=Math.floor(y),u=smooth(x-a),v=smooth(y-b);return(grain(a,b)*(1-u)+grain(a+1,b)*u)*(1-v)+(grain(a,b+1)*(1-u)+grain(a+1,b+1)*u)*v;}
export function outsideDistance(x,y,b){return Math.max(b.min-x,x-b.max,b.min-y,y-b.max,0);}
export function brookDistance(x,y,b){return Math.abs(x-(b.max+5.5+Math.sin(y*.19)*1.4+Math.sin(y*.43)*.4));}
export function sceneryAt(x,y,b){
 const distance=outsideDistance(x+.5,y+.5,b),n=grain(x,y,91);
 if(distance<2.5||distance>13||brookDistance(x+.5,y+.5,b)<1.2)return null;
 const cluster=noise(x*.24,y*.24);
 if(cluster<.48||n>.15)return null;
 // Low plants and stones preserve views; no automatic perimeter trees.
 return {type:n<.024?'stones':n<.058?'fern':n<.09?'grass':n<.12?'shrub':'lavender',x,y};
}
export function createLandscape(){
 const chunks=new Map();let signature='',span=CHUNK;
 const stats={generated:0,lastFrameGenerated:0,cached:0};
 function chunk(cx,cy,b,season){
  const key=`${cx},${cy}`;if(chunks.has(key)){const c=chunks.get(key);chunks.delete(key);chunks.set(key,c);return c;}
  const c=document.createElement('canvas');c.width=c.height=CHUNK;const g=c.getContext('2d');
  const palette=season==='winter'?[[170,186,164],[209,217,194]]:season==='autumn'?[[111,119,65],[158,156,83]]:season==='spring'?[[91,125,65],[150,169,85]]:[[94,120,66],[149,158,82]];
  const pixels=g.createImageData(CHUNK,CHUNK);
  for(let py=0;py<CHUNK;py+=2)for(let px=0;px<CHUNK;px+=2){
   const wx=cx*span+px*span/CHUNK,wy=cy*span+py*span/CHUNK,x=(wx/32+wy/16+128)/2,y=(wy/16+128-wx/32)/2;
   const patch=noise(wx/165,wy/120)*.7+noise(wx/43,wy/37)*.3, speck=grain(wx,wy),v=Math.max(0,Math.min(1,patch+(speck-.5)*.16));
   let rgb=palette[0].map((a,i)=>a+(palette[1][i]-a)*v);
   const bank=brookDistance(x,y,b);
   if(x>b.max+2&&bank<.9){const edge=bank>.65;rgb=edge?(season==='winter'?[173,184,155]:[135+speck*15,128+speck*12,83]):[65+patch*23,106+patch*23,107+patch*19];if(bank>.83)rgb=season==='winter'?[194,204,181]:[102,120,66];}
   else if(speck>.973&&noise(wx/83,wy/67)>.6)rgb=season==='winter'?[216,222,203]:[161,164,103];
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=((py+dy)*CHUNK+px+dx)*4;pixels.data[i]=rgb[0];pixels.data[i+1]=rgb[1];pixels.data[i+2]=rgb[2];pixels.data[i+3]=255;}
  }
  g.putImageData(pixels,0,0);
  // Irregular clusters of tiny blades, clover and blooms, without tile seams.
  if(season!=='winter')for(let i=0;i<440;i++){
   const px=Math.floor(grain(cx,cy,i+10)*CHUNK),py=Math.floor(grain(cx,cy,i+810)*CHUNK),wx=cx*span+px*span/CHUNK,wy=cy*span+py*span/CHUNK,x=(wx/32+wy/16+128)/2,y=(wy/16+128-wx/32)/2;
   if(brookDistance(x,y,b)<1.05||noise(wx/95,wy/75)<.46)continue;
   g.fillStyle=i%3?'#5f7e43':'#9cae64';g.fillRect(px,py,1,3);g.fillRect(px+2,py+1,1,2);
   if(i%17===0){g.fillStyle=season==='autumn'?'#d6b075':i%2?'#d9c49e':'#caa7b7';g.fillRect(px,py-1,2,2);}
  }
  chunks.set(key,c);stats.generated++;stats.lastFrameGenerated++;if(chunks.size>MAX_CHUNKS)chunks.delete(chunks.keys().next().value);stats.cached=chunks.size;return c;
 }
 return {draw(ctx,rect,b,season,time){
  span=landscapeChunkSize(rect);stats.lastFrameGenerated=0;
  const next=`${b.min}:${b.max}:${season}:${span}`;if(next!==signature){chunks.clear();signature=next;stats.cached=0;}
  const pending=[];
  for(let cy=Math.floor(rect.top/span);cy<=Math.floor(rect.bottom/span);cy++)for(let cx=Math.floor(rect.left/span);cx<=Math.floor(rect.right/span);cx++)pending.push({cx,cy});
  const midX=(rect.left+rect.right)/2,midY=(rect.top+rect.bottom)/2;
  pending.sort((a,b)=>Math.hypot((a.cx+.5)*span-midX,(a.cy+.5)*span-midY)-Math.hypot((b.cx+.5)*span-midX,(b.cy+.5)*span-midY));
  for(const {cx,cy}of pending){
   const key=`${cx},${cy}`;
   // Never regenerate an entire viewport in one animation frame.
   if(chunks.has(key)||stats.lastFrameGenerated<2)ctx.drawImage(chunk(cx,cy,b,season),cx*span,cy*span,span,span);
   else{ctx.fillStyle=season==='winter'?'#bdc9ad':season==='autumn'?'#858945':'#7c914b';ctx.fillRect(cx*span,cy*span,span,span);}
  }
  // Animated stream highlights use world coordinates, so panning never moves the water.
  ctx.fillStyle=season==='winter'?'#d8e5d090':'#d2ddbc85';
  const minY=Math.floor((rect.top/16+128-rect.right/32)/2)-2,maxY=Math.ceil((rect.bottom/16+128-rect.left/32)/2)+2;
  for(let y=minY;y<maxY;y+=.4){const yy=y+(time*.00012)% .4,x=b.max+5.5+Math.sin(yy*.19)*1.4+Math.sin(yy*.43)*.4,px=(x-yy)*32,py=(x+yy-128)*16;ctx.fillRect(Math.round(px+Math.sin(y*12)*9),Math.round(py),3+grain(Math.floor(y*10),2)*5,1);}
 },stats,clear(){chunks.clear();stats.cached=0;}};
}
