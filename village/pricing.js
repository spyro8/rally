/* Village prices (copper). Buy a piece once, then place it as often as you like.
   Ground, floors, farm beds and restoration sites are always free. Habit thresholds
   still gate what can be bought; copper (10 SPYR points = 1 copper) paces it. */
const FREE=new Set(['Land','Floors','Farming','Restore & discover']);
const round5=n=>Math.max(5,Math.round(n/5)*5);
export function priceOf(d){
  if(!d||d.recipe||d.frontierOnly||FREE.has(d.group))return 0;
  const u=d.unlock||0;
  switch(d.group){
    case'Greenery':case'Flowers':return round5(5+u);
    case'Boundaries':return 10;
    case'Trees':return round5(15+u*1.5);
    case'Furniture':case'Furnishings':return round5(20+u*2);
    case'Garden':case'Magic':case'Wild places':case'Water & banks':case'Farmyard':return round5(25+u*3);
    case'Animals':return round5(30+u*3);
    case'Residents':return 40;
    case'Village trades':return round5(100+u*5);
    case'Stone & walls':return 120;
    case'Homes':return round5(150+u*4);
    default:return round5(20+u*2);
  }
}
export const owns=(s,d)=>priceOf(d)===0||(s.owned||[]).includes(d.id);
/* Everything a save already contains counts as bought, so no existing village loses anything. */
export function ownedFrom(s){const types=new Set();for(const o of s.objects||[])types.add(o.type);for(const r of Object.values(s.rooms||{}))for(const o of r.objects||[])types.add(o.type);return [...types];}
