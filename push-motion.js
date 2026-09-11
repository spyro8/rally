// Whole illustrated poses registered to one stationary apparatus per movement.
const sequence=[0,1,2,3,4,5,4,3,2,1],durations=[.26,.26,.26,.26,.22,.5,.36,.36,.36,.36];
const common={registered:true,mode:'loop',frameCount:6,columns:4,rows:2,machineCell:6,sequence,durations,spriteScale:.9,breathAmount:.2,foreground:[]};
const benchOutline=[[25,30],[320,30],[320,243],[433,248],[451,276],[454,389],[500,413],[505,447],[450,451],[406,440],[388,431],[386,405],[395,389],[388,361],[382,331],[306,331],[282,328],[240,330],[227,330],[219,340],[195,344],[170,341],[158,335],[117,322],[79,322],[41,320],[25,307]];
const shoulderOutline=[[100,0],[420,0],[420,481],[328,481],[322,452],[325,428],[322,396],[321,364],[313,346],[297,351],[260,347],[248,350],[253,383],[244,430],[271,463],[269,485],[205,485],[207,455],[212,431],[213,403],[215,369],[217,348],[194,337],[182,329],[185,300],[184,280],[180,262],[179,243],[161,241],[144,246],[126,239],[107,207]];
const pressContacts=[[247,207],[235,239],[224,269],[216,300],[209,310],[201,322]];
export const pushMotions={
 'db-bench':{...common,file:'ironwood-bench-aligned',origin:[256,449],machineRect:[0,56,512,495],breathAnchor:[325,419],anchors:Array.from({length:6},()=>[312,328]),offsets:[[0,0],[0,0],[0,0],[0,0],[0,46],[0,46]],bodyPolygons:Array.from({length:6},(_,i)=>benchOutline.map(([x,y])=>[x,y-(i>=4?46:0)]))},
 'db-overhead':{...common,file:'ironwood-shoulder-aligned',origin:[256,483],machineRect:[-3,11,512,494],breathAnchor:[300,423],anchors:Array.from({length:6},()=>[241,338]),bodyPolygons:[shoulderOutline]},
 'pressdown':{...common,file:'ironwood-pressdown-aligned',origin:[280,493],breathAnchor:[235,420],anchors:Array.from({length:6},()=>[157,490]),contacts:pressContacts,pulley:[306,49],bodyPolygons:[[[85,48],[264,48],[264,439],[198,441],[198,493],[87,493]]],erase:pressContacts.map(p=>[[p[0]-7,0,45,p[1]-6]])}
};
export function pushFrame(spec,time,active){let t=active?Math.max(0,Number.isFinite(time)?time:0)%spec.durations.reduce((a,b)=>a+b,0):0;for(let i=0;i<spec.sequence.length;i++){if(t<spec.durations[i]-1e-9)return spec.sequence[i];t-=spec.durations[i];}return 0;}
