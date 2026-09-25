// Raster limb rigs: one stationary illustrated body/equipment plate per movement.
// All points are in the original 768 × 1024 artwork coordinates.
const poly=(...points)=>points;
export const correctedRigs={
 'pullover':{art:'dumbbell-pullover',scale:.53,floor:750,center:384,period:5.2,
  limbs:[{pivot:[298,519],angle:-1.35,mask:poly([243,220],[365,210],[365,510],[362,529],[352,545],[336,557],[316,561],[293,558],[274,547],[260,531],[253,510],[245,493])}]},
 'db-fly':{art:'dumbbell-fly',scale:.51,floor:826,center:384,period:4.8,
  limbs:[{behind:true,pivot:[271,502],angle:-1.12,mask:poly([216,211],[393,211],[393,307],[327,307],[318,431],[293,508],[237,520],[234,472],[253,379],[266,306],[216,306])},
   {pivot:[354,562],angle:1.10,mask:poly([332,211],[503,211],[503,312],[444,312],[453,464],[432,533],[406,590],[372,612],[332,600],[313,572],[327,519],[373,478],[387,400],[397,306],[332,306])}]},
 'pressdown':{art:'triceps-pressdown',scale:.47,floor:904,center:420,period:4.2,cable:{from:[523,131],offset:[62,-68]},
  arm:{shoulder:[207,357],elbow:[213,465],wrist:[318,485],end:[237,569],fixedElbow:true,
   upper:poly([161,327],[226,318],[253,352],[242,416],[252,458],[226,489],[193,481],[174,426],[162,380]),
   lower:poly([181,440],[225,440],[251,462],[298,465],[343,470],[348,505],[319,516],[271,497],[219,496],[192,481])},
  prop:{anchor:[318,485],mask:poly([307,465],[347,465],[363,444],[370,417],[391,414],[397,434],[379,466],[389,484],[385,506],[348,507],[321,520],[307,507])}},
 'cable-row':{art:'cable-row',scale:.52,floor:828,center:384,period:4.6,cable:{from:[553,514],offset:[70,0]},
  arm:{shoulder:[151,454],elbow:[239,494],wrist:[354,514],end:[231,522],bend:1,
   upper:poly([105,425],[159,414],[198,436],[223,462],[265,475],[268,511],[242,525],[206,511],[161,494],[124,487],[105,462]),
   lower:poly([220,472],[252,472],[288,489],[335,489],[365,486],[388,503],[385,530],[357,540],[309,531],[270,530],[229,518])},
  prop:{anchor:[354,514],mask:poly([347,475],[406,473],[428,487],[430,531],[407,552],[349,552],[347,536],[384,531],[385,497],[347,497])}},
 'incline-db':{art:'incline-press',scale:.49,floor:851,center:384,period:4.8,
  arms:[{behind:true,shoulder:[368,454],elbow:[371,337],wrist:[374,201],end:[394,430],bend:1,
   upper:poly([335,443],[345,380],[345,326],[381,313],[399,344],[395,431],[383,464]),
   lower:poly([343,334],[344,243],[347,203],[374,181],[396,206],[399,273],[393,345]),
   prop:{anchor:[374,201],mask:poly([323,150],[399,153],[440,170],[438,235],[390,237],[347,228],[322,204])}},
   {shoulder:[275,474],elbow:[300,344],wrist:[312,200],end:[343,431],bend:1,
   upper:poly([227,432],[263,412],[273,340],[317,320],[340,349],[337,422],[323,491],[303,531],[272,546],[239,528],[221,495]),
   lower:poly([267,342],[268,280],[277,209],[307,177],[336,193],[338,237],[338,301],[322,357]),
   prop:{anchor:[312,200],mask:poly([229,141],[300,139],[322,159],[350,148],[377,167],[381,211],[364,235],[325,230],[298,222],[264,231],[233,208])}}]},

};
const create=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function cut(image,points){const c=create(768,1024),ctx=c.getContext('2d');ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(image,0,0);return c;}
export function prepareCorrectedRig(id,image,base,rasterCell){const spec=correctedRigs[id],source=rasterCell(image,0,0,2,1).canvas,plate=rasterCell(base,0,0,2,1).canvas;
 const prepareArm=a=>({...a,upperImage:cut(source,a.upper),lowerImage:cut(source,a.lower),prop:a.prop?{...a.prop,image:cut(source,a.prop.mask)}:null});
 return {spec,plate,limbs:spec.limbs?.map(l=>({...l,image:cut(source,l.mask)})),arms:(spec.arms??(spec.arm?[spec.arm]:[])).map(prepareArm),prop:spec.prop?{...spec.prop,image:cut(source,spec.prop.mask)}:null};}
export function repetition(time,period){return (1-Math.cos(2*Math.PI*Math.max(0,time)/period))/2;}
export function solveElbow(shoulder,wrist,upper,lower,bend=1){const dx=wrist[0]-shoulder[0],dy=wrist[1]-shoulder[1],d=Math.max(.001,Math.hypot(dx,dy)),a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));return [shoulder[0]+a*dx/d-bend*h*dy/d,shoulder[1]+a*dy/d+bend*h*dx/d];}
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
function segment(ctx,image,from,to,targetFrom,targetTo){const a=Math.atan2(to[1]-from[1],to[0]-from[0]),b=Math.atan2(targetTo[1]-targetFrom[1],targetTo[0]-targetFrom[0]);ctx.save();ctx.translate(...targetFrom);ctx.rotate(b);ctx.scale(distance(targetFrom,targetTo)/distance(from,to),1);ctx.rotate(-a);ctx.translate(-from[0],-from[1]);ctx.drawImage(image,0,0);ctx.restore();}
function prop(ctx,p,position,width=1){ctx.save();ctx.translate(...position);ctx.scale(width,1);ctx.translate(-p.anchor[0],-p.anchor[1]);ctx.drawImage(p.image,0,0);ctx.restore();}

export function rigPose(rig,time,active){const t=active?repetition(time,rig.spec.period):0;return {t,arms:rig.arms.map(a=>{let wrist,elbow;if(a.fixedElbow){const start=Math.atan2(a.wrist[1]-a.elbow[1],a.wrist[0]-a.elbow[0]),end=Math.atan2(a.end[1]-a.elbow[1],a.end[0]-a.elbow[0]),angle=start+(end-start)*t,length=distance(a.elbow,a.wrist);elbow=a.elbow;wrist=[elbow[0]+Math.cos(angle)*length,elbow[1]+Math.sin(angle)*length];}else{wrist=mix(a.wrist,a.end,t);elbow=solveElbow(a.shoulder,wrist,distance(a.shoulder,a.elbow),distance(a.elbow,a.wrist),a.bend);}return {...a,targetWrist:wrist,targetElbow:elbow};})};}
export function drawCorrectedRig(ctx,rig,time,active,x,floor,scale){const {spec}=rig,{t,arms}=rigPose(rig,time,active);ctx.save();ctx.translate(x,floor);ctx.scale(scale*spec.scale,scale*spec.scale);ctx.translate(-spec.center,-spec.floor);ctx.imageSmoothingEnabled=false;
 const limb=l=>{ctx.save();ctx.translate(...l.pivot);ctx.rotate(l.angle*t);ctx.translate(-l.pivot[0],-l.pivot[1]);ctx.drawImage(l.image,0,0);ctx.restore();};
 const arm=a=>{segment(ctx,a.upperImage,a.shoulder,a.elbow,a.shoulder,a.targetElbow);segment(ctx,a.lowerImage,a.elbow,a.wrist,a.targetElbow,a.targetWrist);if(a.prop)prop(ctx,a.prop,a.targetWrist);};
 rig.limbs?.filter(l=>l.behind).forEach(limb);arms.filter(a=>a.behind).forEach(arm);ctx.drawImage(rig.plate,0,0);
 let grip;if(spec.cable){grip=arms.length>1?[(arms[0].targetWrist[0]+arms[1].targetWrist[0])/2,(arms[0].targetWrist[1]+arms[1].targetWrist[1])/2]:arms[0].targetWrist;ctx.strokeStyle='#252a2b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(...spec.cable.from);ctx.lineTo(grip[0]+spec.cable.offset[0],grip[1]+spec.cable.offset[1]);ctx.stroke();}
 rig.limbs?.filter(l=>!l.behind).forEach(limb);arms.filter(a=>!a.behind).forEach(arm);if(rig.prop)prop(ctx,rig.prop,grip,spec.barProjection?.width??1);ctx.restore();}
