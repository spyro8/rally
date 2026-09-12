import {canPlace,itemById,available} from './core.js';
export const LAYOUTS=[
{id:'pastelborder',name:'Soft cottage flower border',space:'outside',pieces:[['sagefern',0,0],['peonies',1,0],['cosmos',2,0],['bluebells',3,0],['hosta',4,0],['flowermeadow',1,0],['flowermeadow',2,0]]},
{id:'lushborder',name:'Lush emerald planting',space:'outside',pieces:[['bamboo',0,0],['emeraldfern',1,0],['limefern',2,0],['ivytrellis',3,0],['orchids',0,1],['clover',1,1],['mossmound',2,1],['variegated',3,1]]},
{id:'farmplot',name:'Kitchen garden · 9 beds',space:'outside',pieces:[...Array.from({length:9},(_,i)=>['crop',i%3,Math.floor(i/3)]),['sprinkler',3,1],['fence',0,4],['gate',2,4]]},
{id:'falls',name:'Waterfall garden',space:'outside',pieces:[['waterfall',0,0],['flowermeadow',0,4],['flowermeadow',1,4],['flowermeadow',4,5],['steppath',4,4],...Array.from({length:5},(_,i)=>['stream',3,i]),['bridge',2,3],['reeds',4,1],['fern',0,4],['shrub',1,4],['bench',4,5],['fairylamp',5,2]]},
{id:'millrestoration',name:'An old mill by the brook',space:'outside',pieces:[['oldmill',0,0],...Array.from({length:5},(_,i)=>['stream',3,i]),['reeds',4,1],['stones',4,3],['path',1,3],['path',1,4]]},
{id:'herbs',name:'Herbalist garden',space:'outside',pieces:[['fence',0,0],['fence',3,0],['fern',0,2],['lavender',1,2],['berry',3,2],['well',0,3],['bench',3,4],['lantern',4,2]]},
{id:'brook',name:'A stream to cross',space:'outside',pieces:[...Array.from({length:5},(_,y)=>['stream',2,y]),['bridge',1,2],['reeds',1,0],['lilies',2,4],['stones',3,0],['shrub',0,3]]},
{id:'glade',name:'Quiet woodland glade',space:'outside',pieces:[['pine',0,0],['redwood',4,0],['bench',2,3],['shrub',0,4],['mushroom',4,4],['rabbit',3,5]]},
{id:'tea',name:'Tea in the garden',space:'outside',pieces:[['pergola',1,1],['bench',1,4],['fairylamp',4,1],['shrub',4,4],['path',3,1],['path',3,2],['path',3,3],['path',3,4]]},
{id:'reading',name:'A reading corner',space:'inside',pieces:[['bookcase',0,0],['chair',2,1],['pot',3,0],['rug',1,1]]},
{id:'kitchen',name:'Cottage kitchen',space:'inside',pieces:[['kitchen',0,0],['chest',3,0],['table',1,2],['chair',3,2],['pot',0,3]]}
];
export function layoutObjects(id,x,y){const l=LAYOUTS.find(l=>l.id===id);if(!l)throw Error('Unknown layout.');return l.pieces.map(([type,dx,dy],i)=>({id:`preview-${i}`,type,x:x+dx,y:y+dy,rotation:0}));}
export function canStampLayout(state,scope,id,x,y,sandbox=false){const objects=layoutObjects(id,x,y),target={...scope,objects:[...scope.objects]};for(const o of objects){if(!available(state,itemById(o.type),sandbox)||!canPlace(target,o))return false;target.objects.push(o);}return true;}
