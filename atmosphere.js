// Screen-space ambience. Cosmetic only: weather never damages the village.
export function drawAtmosphere(ctx,{width,height,time,sky,motion,world,lights,inside}){
 const t=motion?time:0;
 if(!inside&&sky.daylight>.1){for(let i=0;i<3;i++){const x=((t*.008+i*width*.53)%(width+650))-300,y=height*(.2+i*.27);const g=ctx.createRadialGradient(x,y,30,x,y,330);g.addColorStop(0,'#18362b14');g.addColorStop(1,'#18362b00');ctx.fillStyle=g;ctx.save();ctx.translate(0,y);ctx.scale(1,.45);ctx.translate(0,-y);ctx.fillRect(x-350,y-350,700,700);ctx.restore();}}
 ctx.fillStyle=`rgba(12,22,49,${sky.darkness*(inside?.65:1)})`;ctx.fillRect(0,0,width,height);
 if(sky.warmth){ctx.fillStyle=`rgba(235,140,64,${sky.warmth})`;ctx.fillRect(0,0,width,height);}
 if(!inside&&sky.daylight>.25&&!['rain','snow'].includes(sky.weather)){ctx.save();ctx.globalCompositeOperation='screen';const strength=sky.daylight*(sky.weather==='mist'?.06:.095)*(motion?.8+Math.sin(t*.00031)*.2:1);for(let i=0;i<4;i++){const x=width*(.05+i*.27)+(motion?Math.sin(t*.00013+i)*32:0);const g=ctx.createLinearGradient(x,0,x+height*.55,height);g.addColorStop(0,`rgba(255,231,154,${strength})`);g.addColorStop(.55,`rgba(255,224,133,${strength*.65})`);g.addColorStop(1,'rgba(255,235,173,0)');ctx.fillStyle=g;for(let band=5;band>=1;band--){ctx.globalAlpha=.18;const spread=band/3;ctx.beginPath();ctx.moveTo(x-18*spread,0);ctx.lineTo(x+18*spread,0);ctx.lineTo(x+height*.65+65*spread,height);ctx.lineTo(x+height*.65-65*spread,height);ctx.fill();}ctx.globalAlpha=1;}ctx.restore();}
 if(!inside&&sky.weather==='mist'){const fog=ctx.createLinearGradient(0,0,width,height);fog.addColorStop(0,'#cedad13b');fog.addColorStop(.5,'#a5bbba12');fog.addColorStop(1,'#dce6d43a');ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);}
 for(const p of lights){const flicker=motion?1+Math.sin(t*.005+p.x)*.06:1,r=p.radius*flicker;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,p.blue?'#b1eeff70':'#ffe7a96e');g.addColorStop(.35,p.blue?'#7fb4e52c':'#f0b45928');g.addColorStop(1,'#edc67900');ctx.fillStyle=g;ctx.globalCompositeOperation='screen';ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.globalCompositeOperation='source-over';}
 if(inside||!motion)return;
 if(sky.daylight>.4&&sky.weather==='clear'){for(let i=0;i<22;i++){const x=(i*137+t*.004)%(width+20),y=(i*91+t*.002+Math.sin(t*.0006+i)*9)%height;ctx.fillStyle=`rgba(255,241,179,${.12+.18*(1+Math.sin(t*.001+i))/2})`;ctx.fillRect(x,y,i%4===0?2:1,1);}}
 ctx.save();ctx.globalAlpha=sky.weatherOpacity??1;
 if(sky.weather==='rain'){ctx.strokeStyle='#c5dfdf66';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<115;i++){const x=(i*97+t*.12)%(width+100)-50,y=(i*173+t*.37)%(height+100)-50;ctx.moveTo(x,y);ctx.lineTo(x-4,y+13);}ctx.stroke();}
 if(sky.weather==='snow'){ctx.fillStyle='#e9f1e9bd';for(let i=0;i<80;i++){const y=(i*127+t*.026)%(height+40)-20,x=(i*131+t*.011+Math.sin(t*.001+i)*20)%(width+40)-20;const size=i%3===0?3:2;ctx.fillRect(Math.round(x),Math.round(y),size,size);}}
 ctx.restore();
 // Intermittent wind gusts: a quiet interval follows each moving seed/petal group.
 const cycle=28000,phase=t%cycle,gust=phase<11500;
 if(gust&&sky.weather!=='snow'){const colors=world.season==='autumn'?['#ba803f','#d2a450','#c48c50']:world.season==='spring'?['#e7bfce','#e1d6a8','#c6d28b']:['#d6ce95','#b9c980','#dcbac1'];for(let i=0;i<17;i++){const delay=i*340,age=phase-delay;if(age<0)continue;const x=-50+age*.075+(i%4)*17,y=height*(.15+((i*37)%73)/100)+Math.sin(age*.003+i)*17-age*.009;if(x>width+40)continue;ctx.fillStyle=colors[i%3];ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(age*.004+i)*1.3);ctx.fillRect(-2,-1,i%3===0?6:3,i%3===0?1:2);ctx.restore();}}
 if(sky.daylight<.25&&sky.weather!=='snow'&&sky.weather!=='rain'){for(let i=0;i<18;i++){const x=width*(i*83%97)/97+Math.sin(t*.0005+i)*14,y=height*(.25+(i*31%65)/100)+Math.cos(t*.0008+i)*10,alpha=.2+.45*(1+Math.sin(t*.002+i))/2;ctx.fillStyle=`rgba(229,237,154,${alpha})`;ctx.fillRect(x,y,2,2);}}
}
