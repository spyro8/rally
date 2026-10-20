/** Layered sanctuary renderer. Asset locations and pivots are in scene-space pixels.
 * Generated clean plate has no monk, cherry canopy, hanging lantern or streams.
 * Water, candle flames and weather are independent procedural animation layers.
 */
export const ASSETS = {
  background: 'art/garden-clean.webp',
  cat: 'art/cat.webp',
  koi: 'art/koi.webp',
  monk: 'art/monk.webp',
  foliage: 'art/cherry-canopy.webp',
  lantern: 'art/hanging-lantern.webp'
};
export const LAYERS = ['background', 'fish', 'water', 'foliage', 'cat', 'monk', 'lanterns', 'lighting', 'weather'];
export class SanctuaryScene {
  constructor(canvas) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d');
    canvas.width=1536;canvas.height=1024;
    this.images={};this.ready=false;this.hidden=new Set();
    this.state={night:false,raining:false,reduced:false};
    let seed=42;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
    this.petals=Array.from({length:44},()=>({x:840+rand()*430,y:rand()*1024,s:0.5+rand(),phase:rand()*6.28}));
    this.rain=Array.from({length:220},()=>({x:rand()*1660,y:rand()*1100,s:0.65+rand()*.8}));
    this.loaded=Promise.all(Object.entries(ASSETS).map(([id,src])=>new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>{this.images[id]=img;resolve()};img.onerror=()=>reject(new Error('Could not load '+src));img.src=src;
    }))).then(()=>{this.ready=true;this.render(0,this.state)});
  }
  render(ms,state=this.state) {
    this.state=state;if(!this.ready)return;
    const c=this.ctx; c.imageSmoothingEnabled=false;c.clearRect(0,0,1536,1024);
    const t=state.reduced?0:ms/1000;
    for(const layer of LAYERS)if(!this.hidden.has(layer))this[layer](c,t,state);
  }
  pixel(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
  background(c){c.drawImage(this.images.background,0,0,1536,1024)}
  fish(c,t,{reduced}){
    // Pond contour, then foreground lily-pad holes: fish remain under the plants.
    c.save();c.beginPath();c.moveTo(238,840);c.lineTo(833,820);c.lineTo(922,858);
    c.lineTo(914,911);c.lineTo(843,965);c.lineTo(746,995);c.lineTo(380,983);c.lineTo(256,931);c.closePath();
    c.clip();
    const fish=[{cx:696,cy:907,rx:145,ry:46,speed:.23,phase:0,size:87},
      {cx:638,cy:918,rx:153,ry:42,speed:-.19,phase:2.3,size:72},
      {cx:583,cy:862,rx:145,ry:23,speed:.16,phase:4.1,size:66}];
    // Exclude overlapping pads separately so intersecting holes cannot cancel.
    for(const [x,y,rx,ry] of [[337,860,40,37],[294,879,58,20],[405,876,55,18],[388,939,64,25],[516,954,64,27],[588,924,63,26],[516,899,48,36],[871,876,47,20]]){
      c.beginPath();c.rect(0,0,1536,1024);c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip('evenodd');
    }
    for(let i=0;i<fish.length;i++){
      const f=fish[i],a=t*f.speed+f.phase;
      const x=f.cx+Math.cos(a)*f.rx,y=f.cy+Math.sin(a)*f.ry;
      const heading=Math.atan2(Math.cos(a)*f.ry*f.speed,-Math.sin(a)*f.rx*f.speed);
      c.save();c.translate(x,y);c.rotate(heading);c.scale(1,.77);c.globalAlpha=.82;
      const unit=f.size/1466,tailSwing=reduced?0:Math.sin(t*5.4+i*1.8)*.25;
      // The narrow tail root at source x585 is the swimming pivot.
      c.save();c.translate(-f.size/2+460*unit,0);c.rotate(tailSwing);
      c.drawImage(this.images.koi,125,246,470,444,-460*unit,-222*unit,470*unit,444*unit);c.restore();
      c.drawImage(this.images.koi,585,246,1006,444,-f.size/2+460*unit,-222*unit,1006*unit,444*unit);
      c.restore();
    }
    c.restore();
  }
  cat(c,t,{reduced}){
    const img=this.images.cat,scale=.155;
    c.save();c.translate(1280,537);c.scale(scale,scale);c.translate(-500,-160);
    // Transparent sprite sections: tail pivots over the porch edge; paws stay fixed.
    c.save();c.translate(555,620);c.rotate(reduced?0:Math.sin(t*1.15)*.16+Math.sin(t*.38)*.04);c.translate(-555,-620);
    c.beginPath();for(const [i,p]of [[493,605],[552,582],[625,612],[650,699],[720,762],[759,813],[767,876],[744,923],[692,925],[630,884],[572,847],[530,795],[500,718]].entries())i?c.lineTo(...p):c.moveTo(...p);c.closePath();c.clip();
    c.drawImage(img,485,580,290,355,485,580,290,355);c.restore();
    c.save();c.translate(780,660);c.scale(1,reduced?1:1+Math.sin(t*1.1)*.018);c.translate(-780,-660);
    c.beginPath();for(const [i,p]of [[505,593],[514,520],[543,451],[638,392],[682,365],[724,251],[750,175],[780,161],[877,244],[1007,198],[1037,215],[1013,291],[1022,377],[1056,432],[1041,476],[966,495],[980,612],[955,659],[914,669],[832,664],[789,667],[698,666],[639,654],[580,623]].entries())i?c.lineTo(...p):c.moveTo(...p);c.closePath();c.clip();
    c.drawImage(img,490,155,580,520,490,155,580,520);c.restore();c.restore();
  }
  water(c,t,{reduced}){
    // Two continuous gravity-fed streams, with independently travelling ribbons.
    const stream=(x,y,length,width,drift)=>{
      for(let row=0;row<length;row+=3){
        const phase=row*.21-t*19,dx=Math.sin(phase)*2.1;
        const xx=x+row*drift+dx;
        this.pixel(c,xx,y+row,width,4,'#83a5a4');
        this.pixel(c,xx+width*.3,y+row,Math.max(2,width*.36),3,Math.sin(phase)>.05?'#fff2cb':'#c0d4c6');
        if(Math.sin(phase+1.5)>.5)this.pixel(c,xx+width-1,y+row,2,3,'#e5e7c9');
      }
    };
    stream(254,591,78,10,.13);stream(281,685,87,12,.12);
    // Landing splash particles and repeating expanding elliptical rings.
    const splash=(x,y,r)=>{
      for(let i=0;i<3;i++){
        const phase=(t*.9+i/3)%1;c.strokeStyle=`rgba(220,235,218,${(1-phase)*.85})`;c.lineWidth=2;
        c.beginPath();c.ellipse(x,y,r*phase+2,phase*5+1,0,0,Math.PI*2);c.stroke();
      }
      for(let i=0;i<7;i++){const phase=(t*1.5+i*.143)%1;const dx=(i-3)*5*phase;this.pixel(c,x+dx,y-Math.sin(phase*Math.PI)*(8+i%3*5),3,3,'#e7efd4')}
    };
    splash(267,670,28);splash(295,773,27);
    // Refracted light flows through an irregular pond region. The lotus remains still.
    c.save();c.beginPath();c.moveTo(556,830);c.lineTo(851,830);c.lineTo(922,867);c.lineTo(889,930);c.lineTo(776,989);c.lineTo(620,986);c.lineTo(652,934);c.lineTo(585,879);c.closePath();c.clip();
    for(let i=0;i<35;i++){
      const y=835+i*4.4,x=620+Math.sin(i*.81+t*1.5)*22;
      c.globalAlpha=.36+(Math.sin(t*2.1+i*.7)+1)*.19;
      this.pixel(c,x,y,23+Math.sin(i*2)*14,3,i%3?'#f5a252':'#ffe0a0');
      this.pixel(c,790+Math.sin(i*.63+t*1.2)*25,y,22+Math.sin(i)*16,3,'#df9154');
      c.globalAlpha=.30;this.pixel(c,570+(i*47)%320+Math.sin(t*1.3+i)*12,y,13+i%4*8,2,'#b1ced0');
    }
    c.restore();
  }
  foliage(c,t,{reduced}){
    // Separate transparent canopy; pivot aligns with the reconstructed trunk.
    c.save();c.translate(1228,267);c.rotate(reduced?0:Math.sin(t*.85)*.040+Math.sin(t*.32)*.009);
    c.drawImage(this.images.foliage,27,12,1778,841,-393,-220,434,244);c.restore();
  }
  monk(c,t,{reduced}){
    const img=this.images.monk;
    // Feet stay grounded; torso extends on inhale and carries the separate head band.
    // These bands sample the transparent character asset, never the garden image.
    const breath=reduced?0:(1-Math.cos(t*Math.PI/4))*.5;
    const lift=breath*11,bodyWidth=146+breath*5.5;
    c.save();c.globalAlpha=.28;c.fillStyle='#33251b';c.beginPath();c.ellipse(771,660,68,6,0,0,Math.PI*2);c.fill();c.restore();
    c.drawImage(img,163,1042,807,202,698,626,146,36);
    c.drawImage(img,163,724,807,318,771-bodyWidth/2,570-lift,bodyWidth,57+lift);
    c.drawImage(img,163,227,807,498,698,482-lift,146,89);
  }
  lanterns(c,t,{reduced}){
    // The hanging lantern is an alpha sprite suspended from its roof attachment.
    c.save();c.translate(1280,61);c.rotate(reduced?0:Math.sin(t*.95)*.065);
    c.drawImage(this.images.lantern,195,0,846,1202,-62,0,124,200);
    this.flame(c,0,151,20,31,t);c.restore();
    this.flame(c,419,481,13,22,t+.7);
    this.flame(c,1033,477,12,20,t+1.5);
    this.flame(c,1428,856,24,38,t+2.4);
  }
  flame(c,x,y,w,h,t){
    c.save();c.globalCompositeOperation='screen';
    const sway=Math.sin(t*3.4)*w*.22,pulse=.8+Math.sin(t*4.7)*.22;
    c.globalAlpha=.35;this.pixel(c,x-w/2,y-h/2,w,h,'#ffad31');
    c.globalAlpha=.6;this.pixel(c,x-w/5+sway,y-h*pulse/2,w*.4,h*pulse,'#fff2ae');
    c.restore();
  }
  lighting(c,t,{night,reduced}){
    if(night){c.fillStyle='rgba(7,20,51,.36)';c.fillRect(0,0,1536,1024)}
    for(const [x,y,r]of [[419,478,80],[1032,473,80],[1280,207,94],[1427,849,112]]){
      const flicker=.13+(night?.16:0)+(reduced?0:Math.sin(t*2.4+x)*.055);
      const g=c.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,`rgba(255,180,55,${flicker})`);g.addColorStop(1,'rgba(255,160,30,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }
  }
  weather(c,t,{raining,reduced}){
    if(!reduced)for(const p of this.petals){
      const travel=(t*29*p.s+p.y)%1080;
      const x=p.x-travel*.18+Math.sin(t*.95+p.phase)*35,y=travel-25;
      c.save();c.translate(x,y);c.rotate(Math.sin(t+p.phase)*.8);c.globalAlpha=.85;
      this.pixel(c,-3,-1,7,4,'#eaa0ad');this.pixel(c,0,-4,3,4,'#f5bdc1');c.restore();
    }
    if(raining){
      c.fillStyle='rgba(29,52,72,.13)';c.fillRect(0,0,1536,1024);
      c.save();c.strokeStyle='rgba(191,216,226,.38)';c.lineWidth=2;
      for(const p of this.rain){let y=(p.y+t*370*p.s)%1100-40,x=(p.x-y*.13+1660)%1660-60;c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y+17*p.s);c.stroke()}
      if(!reduced)for(let i=0;i<12;i++){let phase=(t*.8+i*.17)%1;c.globalAlpha=(1-phase)*.35;c.beginPath();c.ellipse(570+i*27,853+(i*31)%85,phase*9+1,phase*2+1,0,0,Math.PI*2);c.stroke()}
      c.restore();
    }
  }
}
