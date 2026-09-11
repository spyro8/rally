export const DEFAULT_WORLD={time:'cycle',weather:'auto',season:'summer',motion:true,sound:false};
export const TIME_MODES=['cycle','realtime','dawn','day','dusk','night'];
export const WEATHER_MODES=['auto','clear','rain','snow','mist'];
export const SEASONS=['spring','summer','autumn','winter'];
export function atmosphere(world,now=Date.now()){
 const hour=world.time==='realtime'?new Date(now).getHours()+new Date(now).getMinutes()/60:world.time==='cycle'?((now/1000)%480)/20:({dawn:6,day:12,dusk:18,night:0}[world.time]??12);
 const daylight=Math.max(0,Math.sin((hour-6)/12*Math.PI));
 const transition=Math.max(0,1-Math.min(Math.abs(hour-6),Math.abs(hour-18))/2);
 const phase=Math.floor(now/180000)%7;
 const weather=world.weather==='auto'?(['clear','clear',world.season==='winter'?'snow':'rain','mist','clear',world.season==='winter'?'snow':'rain','clear'][phase]):world.weather;
 const phaseTime=now%180000,weatherOpacity=world.weather==='auto'?Math.min(1,phaseTime/12000,(180000-phaseTime)/12000):1;
 return{hour,daylight,weatherOpacity,darkness:.58*(1-daylight),warmth:transition*.13,weather};
}
