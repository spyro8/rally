import {CROPS} from './economy.js';
export const nearby=(s,o,type,radius)=>s.objects.some(p=>p.type===type&&Math.max(Math.abs(p.x-o.x),Math.abs(p.y-o.y))<=radius);
export function growthTime(s,o){const seed=CROPS.find(c=>c.id===o.crop?.kind)||CROPS[0];return Math.max(1,seed.grow-(nearby(s,o,'greenhouse',4)?1:0));}
export function harvestBonus(s,o){return Number(nearby(s,o,'sprinkler',2))+Number(!!o.compost);}
export function farmPlots(s){const remaining=new Map(s.objects.filter(o=>o.type==='crop').map(o=>[`${o.x},${o.y}`,o])),plots=[];while(remaining.size){const first=remaining.values().next().value,queue=[first],group=[];remaining.delete(`${first.x},${first.y}`);for(let i=0;i<queue.length;i++){const o=queue[i];group.push(o);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const key=`${o.x+dx},${o.y+dy}`,n=remaining.get(key);if(n){queue.push(n);remaining.delete(key);}}}plots.push(group);}return plots;}
