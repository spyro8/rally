// Complete Sage poses; all apparatus stays registered in room coordinates.
const sequence=[0,1,2,3,4,5,4,3,2,1],durations=[.45,.3,.3,.3,.3,.4,.3,.3,.3,.3];
const common={registered:true,mode:'loop',frameCount:6,columns:4,rows:2,machineCell:6,sequence,durations,spriteScale:.9,breathAmount:.15,foreground:[]};
const full=[[0,0],[512,0],[512,512],[0,512]];
const ellipse=(x,y,rx,ry)=>Array.from({length:32},(_,i)=>[x+rx*Math.cos(i*Math.PI/16),y+ry*Math.sin(i*Math.PI/16)]);
const barY=[151,166,187,206,226,234];
export const legsMotions={
 'leg-extension':{...common,file:'ironwood-legextension-aligned',origin:[250,459],breathAnchor:[245,391],breathAmount:.12,sequence:[5,4,3,2,1,0,1,2,3,4],durations:[.4,.24,.24,.24,.24,.55,.38,.38,.38,.38],anchors:Array.from({length:6},()=>[294,276]),offsets:[[0,0],[0,0],[0,0],[0,0],[0,8],[0,8]],bodyPolygons:[
 [[505,385],[431,385],[410,349],[308,308]],
 [[505,423],[389,423],[374,378],[303,313]],
 [[488,438],[373,438],[365,392],[300,315]],
 [[410,450],[299,450],[293,388],[288,318]],
 [[366,440],[261,440],[260,360],[282,308]],
 [[366,440],[261,440],[260,360],[282,308]]
 ].map((leg,i)=>[[128,15],[505,15],...leg,[294,289],[229,303],[211,316],[210,333],[165,342],[156,321],[145,300],[145,280],[128,252]].map(([x,y])=>[x,y-(i>=4?8:0)])),foreground:[[250,214,70,44],[276,254,45,43]]},
 'back-squat':{...common,file:'ironwood-squat-aligned',origin:[256,478],breathAnchor:[285,520],breathAmount:0,anchors:Array.from({length:6},()=>[260,471]),bodyPolygons:[[[163,40],[366,40],[366,474],[163,474]]],extraPolygons:barY.map(y=>[ellipse(101,y,52,53),ellipse(421,y,53,53),[[28,y-12],[484,y-12],[484,y+12],[28,y+12]]])},
 'db-rdl':{...common,file:'ironwood-rdl-aligned',spriteScale:.82,origin:[232,497],breathAnchor:[270,510],anchors:Array.from({length:6},()=>[232,497]),offsets:[[0,0],[0,0],[0,0],[0,0],[0,44],[0,44]],bodyPolygons:[full]},
 'reverse-crunch':{...common,file:'ironwood-core-aligned',spriteScale:.9,origin:[256,429],breathAnchor:[420,500],breathAmount:.12,anchors:Array.from({length:6},()=>[435,414]),offsets:[[0,0],[0,0],[0,0],[0,0],[0,13],[0,13]],bodyPolygons:[full]}
};
