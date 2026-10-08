import { makeLook, frame as genFrame } from './villagers.js';
import { cloudSprite, cloudColor, hashId } from './clouds.js';
// SPYR MIND · world renderer. Pure view of the task data: the app calls sync() whenever tasks change.
// Inbox → loose on the Ideas island · Focus → the stage · list tasks → queue at their building · done (7 days) → the pond.

/* ===================== layout (pixel coords inside each terrace image) ===================== */
const TER = [
  {img:'art/t1.webp', stairTop:[1420,790], foot:[1535,1050],
   nodes:[[470,360],[860,330],[1560,300],[1800,440],[1660,580],[1320,650],[950,660],[600,580],[420,470],[820,520],[1480,530],[1150,600]],
   stage:[1150,470], board:[640,300]},
  {img:'art/t2.webp', landing:[1000,380], stairTop:[1060,830], foot:[1190,1095],
   nodes:[[760,650],[1000,560],[1250,700],[1430,640],[1650,720],[1830,780],[880,790]],
   plots:[[560,520],[1330,450],[1890,660]]},
  {img:'art/t3.webp', landing:[1000,380], stairTop:[1255,750], foot:[1385,1005],
   nodes:[[760,640],[1000,560],[1180,680],[1430,630],[1650,700],[1810,750],[900,760]],
   plots:[[560,520],[1320,450],[1890,640]]},
  {img:'art/t4.webp', landing:[1030,420],
   nodes:[[820,480],[660,700],[700,820],[920,890],[1300,905],[1700,860],[1880,670],[1580,520],[1270,480]],
   gazebo:[470,560], ring:true,
   seats:[[1160,925],[960,915],[470,505],[400,470],[1380,925],[1600,895],[860,520],[1640,500],[1360,470],[780,860],[1790,830],[1910,700],[640,760],[1890,560]]},
];
const DECOR = [ // [tier, key, x, y]
  [1,'lamp',330,640],[1,'lamp',1580,520],[1,'lamp',1660,760],[1,'planter',1110,470],[1,'flowerbed',300,800],[1,'bench',1480,860],
  [2,'lamp',330,630],[2,'lamp',1560,520],[2,'lamp',1660,740],[2,'planter',1100,470],[2,'flowerbed',1450,830],[2,'bench',560,780],
  [0,'flowerbed',1700,330],[0,'planter',380,560],[0,'lamp',1000,240],[0,'lamp',1300,240],
  [3,'dock',1640,700],[3,'lily',1180,690],[3,'lily',930,620],[3,'bench-r',660,620],[3,'bench-l',1760,900],[3,'lamp',1300,450],[3,'flowerbed',1880,560],
];
const GAP = 150, DIM = .3, PXS = 3.4;
const tierMode = [0,1,1,2];

/* ===================== module state ===================== */
let canvas, ctx, labelsEl, opts, W = 0, H = 0, DPR = 1, VP = {x0:0, y0:0, x1:0, y1:0};
let worldBox, STAGE, GAZ, SEATS = [], PLOTS = [], BOARD, BMETA, PMETA, IMG = {}, BIMG = {}, PIMG = {};
const nodes = [], agents = new Map(), puffs = [], tierA = [1,1,1,1], gradeCache = {};
let model = {lists:[], items:[]}, listPlot = new Map(), counts = {};
let mode = 0, follow = null, hl = null, theme = 'meadow', T = 0, ready = false;
let hoverTier = -1, hoverPlot = -1, hoverStage = false, filterList = null;
const cam = {x:0, y:0, s:.4}; let fly = null;

/* ===================== helpers ===================== */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const pick = a => a[Math.floor(Math.random()*a.length)];
const addN = (x,y,tier,kind) => { const n = {x,y,tier,kind,adj:[]}; nodes.push(n); return n; };
const link = (a,b) => { if (a && b && a!==b && !a.adj.includes(b)){ a.adj.push(b); b.adj.push(a); } };
const nearestOf = (list, p) => list.reduce((b,n) => dist(n,p) < dist(b,p) ? n : b);
const nearestNode = (x,y,f) => { let best=null, bd=1e9; for (const n of nodes){ if (f && !f(n)) continue; const d = Math.hypot(n.x-x, n.y-y); if (d<bd){ bd=d; best=n; } } return best; };
function route(from, to){ const prev = new Map([[from,null]]); const q = [from]; while (q.length){ const n = q.shift(); if (n===to) break; for (const m of n.adj) if (!prev.has(m)){ prev.set(m,n); q.push(m); } }
  if (!prev.has(to)) return [to]; const out = []; for (let n=to; n && n!==from; n=prev.get(n)) out.unshift(n); return out; }
const vcx = () => (VP.x0+VP.x1)/2, vcy = () => (VP.y0+VP.y1)/2;
const w2s = (x,y) => [(x-cam.x)*cam.s + vcx(), (y-cam.y)*cam.s + vcy()];
const s2w = (x,y) => [(x-vcx())/cam.s + cam.x, (y-vcy())/cam.s + cam.y];
const narrow = () => (VP.x1-VP.x0) < 700;

/* ===================== world build ===================== */
function buildWorld(){
  let ox = 0, oy = 0;
  TER.forEach((t,i) => { if (i){ const p = TER[i-1]; ox = p.off[0] + p.foot[0] - t.landing[0]; oy = p.off[1] + p.foot[1] - t.landing[1] + GAP; } t.off = [ox, oy]; t.w = t.im.width; t.h = t.im.height; });
  const minX = Math.min(...TER.map(t=>t.off[0])), maxX = Math.max(...TER.map(t=>t.off[0]+t.w)); const shift = -(minX+maxX)/2; TER.forEach(t => t.off[0] += shift);
  worldBox = {x0:Math.min(...TER.map(t=>t.off[0])), x1:Math.max(...TER.map(t=>t.off[0]+t.w)), y0:0, y1:Math.max(...TER.map(t=>t.off[1]+t.h))};
  TER.forEach((t,i) => {
    const [ox,oy] = t.off; const P = ([x,y]) => ({x:ox+x, y:oy+y});
    t.wp = t.nodes.map(([x,y]) => addN(ox+x, oy+y, i, 'wp'));
    if (t.landing){ t.landN = addN(ox+t.landing[0], oy+t.landing[1], i, 'land'); t.wp.push(t.landN); }
    if (t.stairTop){ t.topN = addN(ox+t.stairTop[0], oy+t.stairTop[1], i, 'top'); t.wp.push(t.topN); }
    if (t.ring){ const ring = t.wp.filter(n => n.kind==='wp'); ring.forEach((n,k) => link(n, ring[(k+1)%ring.length])); if (t.landN) [...ring].sort((p,q)=>dist(t.landN,p)-dist(t.landN,q)).slice(0,2).forEach(n => link(t.landN, n)); }
    else for (const a of t.wp) t.wp.filter(b=>b!==a).sort((p,q)=>dist(a,p)-dist(a,q)).slice(0,3).forEach(b => link(a,b));
    const attach = (n, k=2) => t.wp.filter(b=>b.kind==='wp'||b.kind==='land').sort((p,q)=>dist(n,p)-dist(n,q)).slice(0,k).forEach(b => link(n,b));
    (t.plots||[]).forEach(pl => { const p = P(pl); const n = addN(p.x, p.y+110, i, 'plot'); attach(n); PLOTS.push({x:p.x, y:p.y, tier:i, node:n}); });
    if (t.stage){ const c = P(t.stage); const m = PMETA['stage-day']; const tl = {x:c.x-m.anchor[0], y:c.y-m.anchor[1]}; const n = addN(c.x, c.y+80, i, 'stage'); attach(n);
      const spots = [[204,306],[311,288],[413,271]].map(([x,y]) => ({x:tl.x+x, y:tl.y+y+6}));
      STAGE = {x:c.x, y:c.y, tier:i, node:n, spots}; }
    if (t.board){ const c = P(t.board); BOARD = {x:c.x, y:c.y, tier:i}; }
    if (i===0){ const sm = PMETA['stage-day']; const bm = PMETA.board; const sc = P(t.stage), bc = P(t.board);
      IDEX = [[sc.x-sm.w/2-30, sc.y-sm.h, sc.x+sm.w/2+30, sc.y+40], [bc.x-bm.w/2-20, bc.y-bm.h, bc.x+bm.w/2+20, bc.y+30]]; }
    if (t.gazebo){ const c = P(t.gazebo); GAZ = {x:c.x, y:c.y, tier:i}; }
    if (t.seats) SEATS = t.seats.map(s => { const p = P(s); return {x:p.x, y:p.y, node:nearestOf(t.wp.filter(n=>n.kind==='wp'), p)}; });
    t.center = {x: ox + t.w/2, y: oy + t.h*.42};
    const mc = document.createElement('canvas'); mc.width = Math.ceil(t.w/8); mc.height = Math.ceil(t.h/8); const mg = mc.getContext('2d'); mg.drawImage(t.im, 0, 0, mc.width, mc.height); t.mask = mg.getImageData(0,0,mc.width,mc.height);
  });
  // benches on the pond become the first seats
  const pondBenches = DECOR.filter(d => d[0]===3 && d[1].startsWith('bench')).map(d => ({x:TER[3].off[0]+d[2], y:TER[3].off[1]+d[3]}));
  const benchSeats = []; for (const b of pondBenches) for (const dx of [-30, 30]){ const p = {x:b.x+dx, y:b.y-24}; benchSeats.push({...p, node:nearestOf(TER[3].wp.filter(n=>n.kind==='wp'), p), bench:true}); }
  SEATS = [...benchSeats, ...SEATS];
  for (let i=0;i<TER.length-1;i++){ const t = TER[i]; const f = addN(t.off[0]+t.foot[0], t.off[1]+t.foot[1], i, 'foot'); link(t.topN, f); link(f, TER[i+1].landN); }
}
const IDEA = {cx:1110, cy:640, rx:730, ry:280}; let IDEX = [];
function inIdeas(x, y){ const t = TER[0]; const lx = x-t.off[0], ly = y-t.off[1]; if (((lx-IDEA.cx)/IDEA.rx)**2 + ((ly-IDEA.cy)/IDEA.ry)**2 > 1) return false;
  for (const r of IDEX) if (x>r[0] && x<r[2] && y>r[1] && y<r[3]) return false; return true; }
function segClear(x0,y0,x1,y1){ for (let i=1;i<=10;i++){ const t = i/10; if (!inIdeas(x0+(x1-x0)*t, y0+(y1-y0)*t)) return false; } return true; }
function roamPoint(a, near){ const t = TER[0];
  for (let i=0;i<24;i++){ const ang = Math.random()*Math.PI*2, rr = Math.sqrt(Math.random());
    let x = t.off[0]+IDEA.cx+Math.cos(ang)*IDEA.rx*rr, y = t.off[1]+IDEA.cy+Math.sin(ang)*IDEA.ry*rr;
    if (near && i < 18){ const ang2 = Math.random()*Math.PI*2, d = 120 + Math.random()*320; x = a.x + Math.cos(ang2)*d; y = a.y + Math.sin(ang2)*d*.55; }
    if (!inIdeas(x,y)) continue; if (!near || segClear(a.x,a.y,x,y)) return {x,y}; } return null; }
function tierAt(wx, wy){ for (let i=0;i<TER.length;i++){ const t = TER[i]; const lx = Math.floor((wx-t.off[0])/8), ly = Math.floor((wy-t.off[1])/8); if (lx<0||ly<0||lx>=t.mask.width||ly>=t.mask.height) continue; if (t.mask.data[(ly*t.mask.width+lx)*4+3] > 40) return i; } return -1; }

/* ===================== themes (colour grading of terraces) ===================== */
const THEMES = {
  meadow: null,
  autumn: (r,g,b) => { if (g > r && g > b*1.05){ const k = Math.min(1, (g - Math.max(r,b))/40); return [r+(Math.min(255, g*1.12+28)-r)*k, g+((r*.55+g*.42)-g)*k, b+(b*.55-b)*k]; } return [r*1.03, g*.98, b*.92]; },
  frost:  (r,g,b) => { const l = r*.3+g*.59+b*.11; if (g > r && g > b){ const k = Math.min(1, (g-Math.max(r,b))/30)*.78; return [r+(l*1.05+46-r)*k, g+(l*1.05+52-g)*k, b+(l*1.12+66-b)*k]; } return [r*.94+l*.06+4, g*.95+l*.05+8, b*1.02+l*.04+16]; },
  blossom:(r,g,b) => { if (g > r && g > b){ const k = Math.min(1, (g-Math.max(r,b))/45)*.55; return [r+(Math.min(255,g*1.1+40)-r)*k, g+((g*.72+r*.2)-g)*k, b+(Math.min(255,g*.95+50)-b)*k]; } return [r*1.02,g,b*1.02]; },
};
function graded(i){ const key = theme+'|'+i; if (theme==='meadow') return TER[i].im; if (gradeCache[key]) return gradeCache[key];
  const t = TER[i], c = document.createElement('canvas'); c.width = t.w; c.height = t.h; const g = c.getContext('2d'); g.drawImage(t.im, 0, 0);
  const d = g.getImageData(0,0,t.w,t.h), a = d.data, f = THEMES[theme];
  for (let p=0;p<a.length;p+=4){ if (!a[p+3]) continue; const o = f(a[p],a[p+1],a[p+2]); a[p] = o[0]; a[p+1] = o[1]; a[p+2] = o[2]; }
  g.putImageData(d,0,0); gradeCache[key] = c; return c; }

/* ===================== pixel villagers ===================== */
const SKINS = ['#f6cfae','#e8b48f','#c98e66','#8d5b3f','#f9dcc4'];
const SHIRTS = ['#e8604c','#4f86c6','#f2c14e','#4caf8f','#e07aa8','#8f6fd1','#f08a3c','#7cc46b','#f5f1e6','#3f51a8'];
const PANTS = ['#2f3a4a','#4a3b30','#2a3550','#5b4466','#3d4a3a'];
const HAIRS = ['#3b2416','#1f1a17','#7a4a2a','#d9a35b','#3a3a48','#a8442f','#e8d6b0'];
const shade = (hex, f) => { const n = parseInt(hex.slice(1),16); const r=(n>>16)&255, g=(n>>8)&255, b=n&255; const m = v => Math.max(0,Math.min(255,Math.round(v*f))); return `rgb(${m(r)},${m(g)},${m(b)})`; };
function hashLook(id){ let h = 2166136261; for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); const r = n => { h = Math.imul(h ^ (h>>>13), 1274126177); return ((h>>>0) % n); };
  return {id:String(id), skin:SKINS[r(SKINS.length)], shirt:SHIRTS[r(SHIRTS.length)], pants:PANTS[r(PANTS.length)], hair:HAIRS[r(HAIRS.length)], style:r(3)}; }
const spriteCache = new Map();
/* chibi sheet: 4 rows (front, right, back, left) x 7 cols (idle, walk 1-4, wave, sit), 64x96 frames */
let CHIBI = null; const chibiCache = new Map();
const CH = {idle:0, walk0:1, walk1:2, walk2:3, walk3:4, wave:5, sit:6};
const SHIRT_H = [212, 4, 152, 32, 268, 330, 188, 96];
const SKIN_K = [[1,1,1],[.9,.86,.84],[.76,.68,.62],[.58,.48,.42]];
const HAIR = [null, [1.7,1.25,1.0,46,20,6], [2.1,1.85,1.2,120,92,40], [1.5,1.5,1.55,70,70,74]];
function rgb2hsv(r,g,b){ r/=255; g/=255; b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; let h=0; if (d){ if (mx===r) h=((g-b)/d)%6; else if (mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if (h<0) h+=360; } return [h, mx?d/mx:0, mx]; }
function hsv2rgb(h,s,v){ const c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c; let r=0,g=0,b=0; if (h<60){r=c;g=x;} else if (h<120){r=x;g=c;} else if (h<180){g=c;b=x;} else if (h<240){g=x;b=c;} else if (h<300){r=x;b=c;} else {r=c;b=x;} return [(r+m)*255,(g+m)*255,(b+m)*255]; }
function chibiFor(v){ let c = chibiCache.get(v); if (c) return c; c = document.createElement('canvas'); c.width = CHIBI.width; c.height = CHIBI.height; const g = c.getContext('2d'); g.drawImage(CHIBI,0,0);
  const id = g.getImageData(0,0,c.width,c.height), d = id.data; const sh = SHIRT_H[v % SHIRT_H.length], sk = SKIN_K[Math.floor(v/2) % 4], hr = HAIR[Math.floor(v/3) % 4];
  for (let i=0;i<d.length;i+=4){ if (!d[i+3]) continue; const r=d[i], gg=d[i+1], b=d[i+2]; const [h,s,val] = rgb2hsv(r,gg,b);
    if (h>195 && h<255 && s>.2){ const o = hsv2rgb(sh, Math.min(1, s*1.05), Math.min(1, val*1.08)); d[i]=o[0]; d[i+1]=o[1]; d[i+2]=o[2]; }
    else if (h>8 && h<42 && s>.16 && s<.62 && val>.55){ d[i]=r*sk[0]; d[i+1]=gg*sk[1]; d[i+2]=b*sk[2]; }
    else if (hr && val<.3 && s<.5 && !(h>195 && h<255)){ d[i]=Math.min(255,r*hr[0]+hr[3]); d[i+1]=Math.min(255,gg*hr[1]+hr[4]); d[i+2]=Math.min(255,b*hr[2]+hr[5]); } }
  g.putImageData(id,0,0); chibiCache.set(v, c); return c; }
function chibiVariant(id){ let h = 2166136261; for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h>>>0) % 24; }
function sprite(look, pose, back){
  const key = look.id+'|'+pose+'|'+(back?1:0); let c = spriteCache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = 16; c.height = 28; const g = c.getContext('2d');
  const P = (x,y,w,h,col) => { g.fillStyle = col; g.fillRect(x+1, y+3, w, h); };
  const sit = pose==='sit' || pose==='sleep', up = pose==='panic0' || pose==='panic1', wave = pose==='wave', cheer = pose==='cheer';
  const legH = sit ? 3 : 5; let lA = legH, rA = legH; if (pose==='walk1'){ lA = legH+1; rA = legH-1; } if (pose==='walk3'){ lA = legH-1; rA = legH+1; }
  const shirtD = shade(look.shirt,.78), sk = look.skin;
  P(5,16,2,lA,look.pants); P(7,16,2,rA,shade(look.pants,.85)); P(5,16+lA,2,1,'#1f2733'); P(7,16+rA,2,1,'#1f2733');
  P(4,9,6,7,look.shirt); P(8,9,2,7,shirtD); P(4,15,6,1,shade(look.pants,1.1));
  if (up || cheer){ const o = pose==='panic1' ? 1 : 0; P(2,4+o,1,6,look.shirt); P(11,4+o,1,6,shirtD); P(2,3+o,1,1,sk); P(11,3+o,1,1,sk); }
  else if (sit){ P(3,10,1,4,look.shirt); P(10,10,1,4,shirtD); P(4,14,1,1,sk); P(9,14,1,1,sk); }
  else if (wave){ P(3,10,1,5,look.shirt); P(3,15,1,1,sk); P(11,4,1,6,shirtD); P(11,3,1,1,sk); }
  else { let aL=0, aR=0; if (pose==='walk1'){ aL=-1; aR=1; } if (pose==='walk3'){ aL=1; aR=-1; } P(3,10+aL,1,5,look.shirt); P(10,10+aR,1,5,shirtD); P(3,15+aL,1,1,sk); P(10,15+aR,1,1,sk); }
  P(3,1,8,8,sk); P(9,2,2,6,shade(sk,.9));
  const hr = look.hair, hd = shade(hr,.75);
  if (back){ P(3,0,8,8,hr); P(8,1,3,7,hd); if (look.style===1){ P(2,3,1,7,hr); P(11,3,1,7,hd); P(3,8,8,2,hr); } }
  else { P(3,0,8,3,hr); P(3,3,1,2,hr); P(10,3,1,2,hd); P(8,0,3,2,hd); if (look.style===1){ P(2,2,1,8,hr); P(11,2,1,8,hd); }
    if (pose==='sleep'){ P(5,5,2,1,'#1f2733'); P(8,5,2,1,'#1f2733'); } else { P(5,4,1,2,'#1f2733'); P(8,4,1,2,'#1f2733'); P(5,4,1,1,'#ffffff'); P(8,4,1,1,'#ffffff'); }
    P(4,6,1,1,'#f2a0a8'); P(9,6,1,1,'#f2a0a8'); if (up) P(6,7,2,1,'#7a3a3a'); if (cheer) P(6,7,2,1,'#c0504a'); }
  if (look.style===2){ P(5,-2,4,2,hr); P(7,-2,2,2,hd); }
  const id = g.getImageData(0,0,16,28), d = id.data, op = i => d[i*4+3] > 0, out = [];
  for (let y=0;y<28;y++) for (let x=0;x<16;x++){ const i = y*16+x; if (op(i)) continue; if ((x>0&&op(i-1))||(x<15&&op(i+1))||(y>0&&op(i-16))||(y<27&&op(i+16))) out.push(i); }
  for (const i of out){ d[i*4]=31; d[i*4+1]=39; d[i*4+2]=51; d[i*4+3]=255; }
  g.putImageData(id,0,0); spriteCache.set(key, c); return c;
}

/* ===================== agents ===================== */
function makeAgent(item, arriving){
  const a = {id:item.id, item, look:hashLook(item.id), cv:chibiVariant(item.id), gl:makeLook(item.id), dir:0, x:0, y:0, node:null, prev:null, route:[], tgt:null, planKey:null, plan:null, timer:0, phase:Math.random()*4, face:1, back:false, moving:false,
    slot:Math.random(), slot2:Math.random(), drop:arriving ? 1 : 0, dragging:false, train:[], hist:[], el:null, hidden:false, lw:0, cnt:0, shown:false};
  agents.set(item.id, a);
  const el = document.createElement('div'); el.className = 'wl';
  el.innerHTML = '<div class="in"><div class="note"><i class="d"></i><span class="t"></span><b class="n"></b><b class="plus"></b></div><div class="slist"></div><div class="tail"></div></div>';
  el.querySelector('.note').addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target.classList.contains('plus')){ follow = null; flyTo(a.x, a.y-80, Math.min(1.4, cam.s*1.9)); return; } opts.onSelect && opts.onSelect(a.id); });
  labelsEl.appendChild(el); a.el = el; a.note = el.querySelector('.note'); a.plusEl = el.querySelector('.plus');
  return a;
}
function refreshAgent(a){ const it = a.item; a.note.querySelector('.t').textContent = it.title; const L = model.lists.find(l => l.id===it.listId);
  a.note.style.setProperty('--cc', L ? L.color : '#c9cbe0'); a.ccol = cloudColor(it, L && L.color, a.id); a.seed = a.seed ?? hashId(a.id);
  const nb = a.note.querySelector('.n'); const tot = it.stepsTotal||0; nb.textContent = tot ? `${tot-(it.subsOpen||0)}/${tot}` : ''; nb.style.display = tot ? '' : 'none';
  a.note.className = 'note ' + it.state + (it.overdue ? ' late' : '') + (hl===a.id ? ' hl' : '');
  a.natW = 0;
  const steps = it.steps||[]; const ids = new Set(steps.map(x => x.id));
  for (let i=a.train.length-1;i>=0;i--){ const m = a.train[i]; if (!ids.has(m.sid)){ puff(m.x, m.y, L ? L.color : '#fff'); if (m.el) m.el.remove(); a.train.splice(i,1); } }
  for (const st of steps){ let m = a.train.find(x => x.sid===st.id);
    if (!m){ const last = a.train[a.train.length-1] || a; m = {sid:st.id, owner:a, seed:hashId(st.id), x:last.x, y:last.y, phase:Math.random()*4, face:1, back:false, moving:false, dir:0, gl:makeLook(a.id+':'+st.id), el:null}; a.train.push(m); }
    m.text = st.text; if (m.el) m.el.querySelector('.t').textContent = st.text; }
  a.el.querySelector('.slist').innerHTML = steps.slice(0, 8).map(x => `<div>${escH(x.text)}</div>`).join('') + (steps.length > 8 ? `<div class="more">+${steps.length-8} more</div>` : '');
  a.train.sort((p,q) => steps.findIndex(x=>x.id===p.sid) - steps.findIndex(x=>x.id===q.sid));
}
const QMAX = 6, LOOSE_MAX = 30;
function assignPlans(){
  const loose = model.items.filter(i => i.state==='loose').sort((a,b) => b.order-a.order); const looseCap = new Set(loose.slice(LOOSE_MAX).map(i => i.id));
  const focus = model.items.filter(i => i.state==='focus').sort((a,b) => a.order-b.order);
  const fIdx = new Map(focus.map((t,i) => [t.id, i]));
  const byList = {}; for (const it of model.items) if (it.state==='planned') (byList[it.listId] = byList[it.listId]||[]).push(it);
  for (const k in byList) byList[k].sort((a,b) => a.order-b.order);
  const done = model.items.filter(i => i.state==='done').sort((a,b) => (b.doneAt||0)-(a.doneAt||0));
  counts = {}; for (const k in byList) counts[k] = byList[k].length;
  for (const a of agents.values()){ const it = a.item; a.cap = looseCap.has(it.id);
    if (it.state==='focus'){ const i = Math.min(fIdx.get(it.id), 2); a.plan = {node:STAGE.node, spot:STAGE.spots[i], key:'stage'+i, hidden:fIdx.get(it.id) > 2}; }
    else if (it.state==='planned'){ const pi = listPlot.get(it.listId); if (pi===undefined){ a.plan = {node:TER[1].landN, spot:TER[1].landN, key:'nolot', hidden:true}; continue; }
      const p = PLOTS[pi]; const i = byList[it.listId].indexOf(it); const j = Math.min(i, QMAX-1);
      a.plan = {node:p.node, spot:{x:p.x + ((j%3)-1)*104 + (j>=3?52:0), y:p.y + 118 + Math.floor(j/3)*70}, key:'q'+pi+'_'+j, hidden:i>=QMAX}; }
    else if (it.state==='done'){ const i = done.indexOf(it); const s = SEATS[i % SEATS.length]; a.plan = {node:s.node, spot:s, key:'seat'+(i%SEATS.length), hidden:i>=SEATS.length, bench:!!s.bench}; }
    else a.plan = null; }
}
export function sync(m){
  if (!ready){ model = m; return; }
  const prevState = new Map([...agents.values()].map(a => [a.id, a.item.state]));
  model = m; listPlot = new Map(); m.lists.slice(0, PLOTS.length).forEach((l,i) => listPlot.set(l.id, i));
  const seen = new Set();
  for (const it of m.items){ seen.add(it.id); let a = agents.get(it.id); if (!a){ a = makeAgent(it, it.state==='loose' && it.fresh); } a.item = it; }
  for (const [id,a] of agents) if (!seen.has(id)){ puff(a.x, a.y, '#ffffff'); a.el.remove(); for (const m of a.train) if (m.el) m.el.remove(); agents.delete(id); if (follow===a) follow = null; }
  assignPlans();
  for (const a of agents.values()){
    if (!a.node){ // place new agents
      const wps = TER[0].wp.filter(n=>n.kind==='wp');
      if (a.drop){ const q = roamPoint(a) || pick(wps); a.node = nearestNode(q.x, q.y, n => n.tier===0 && n.kind==='wp'); a.x = q.x; a.y = q.y; a.roam = true; }
      else if (a.plan){ a.node = a.plan.node; a.x = a.plan.spot.x; a.y = a.plan.spot.y; a.planKey = a.plan.key; a.hidden = !!a.plan.hidden; }
      else { const q = roamPoint(a) || pick(wps); a.node = nearestNode(q.x, q.y, n => n.tier===0 && n.kind==='wp'); a.x = q.x; a.y = q.y; a.roam = true; }
    }
    const was = prevState.get(a.id); if (was && was!==a.item.state && a.item.state==='done' && !reducedMotion) { chime(); confetti(a.x, a.y-70, 34); a.cheer = 1.4;
      for (const b of agents.values()) if (b!==a && !b.dragging && b.drop===0 && tierOf(b)===tierOf(a) && Math.hypot(b.x-a.x, b.y-a.y) < 520) b.cheer = .9 + Math.random()*.6; }
    refreshAgent(a);
  }
}

function stepAgent(a, dt){
  if (a.drop > 0){ a.drop = Math.max(0, a.drop - dt*1.2); if (a.drop===0){ puff(a.x, a.y, '#ffffff'); ping(520); } return; }
  if (a.dragging){ a.phase += dt*10; return; }
  if (a.cheer > 0){ a.cheer -= dt; a.phase += dt*6; return; }
  if (!a.node){ a.node = nearestNode(a.x, a.y, n => n.kind!=='foot'); a.route = []; a.tgt = {x:a.node.x, y:a.node.y}; a.planKey = null; }
  const p = a.plan;
  if (p){
    if (a.planKey !== p.key){ if (a.roam){ a.node = nearestNode(a.x, a.y, n => n.tier===0 && n.kind!=='foot'); a.roam = false; } a.planKey = p.key; a.route = route(a.node, p.node); a.tgt = null; a.hidden = false; }
    if (!a.tgt){ if (a.route.length){ const n = a.route.shift(); a.prev = a.node; a.node = n; a.tgt = {x:n.x+(a.slot-.5)*36, y:n.y+(a.slot2-.5)*20}; }
      else if (Math.hypot(a.x-p.spot.x, a.y-p.spot.y) > 3) a.tgt = {x:p.spot.x, y:p.spot.y};
      else if (p.hidden) a.hidden = true; }
  } else {
    if (a.planKey){ a.planKey = null; a.route = []; a.tgt = null; a.hidden = false; }
    if (a.node.tier !== 0 && !a.route.length && !a.tgt) a.route = route(a.node, pick(TER[0].wp.filter(n=>n.kind==='wp')));
    if (!a.tgt){ if (a.route.length){ const n = a.route.shift(); a.prev = a.node; a.node = n; a.tgt = {x:n.x+(a.slot-.5)*40, y:n.y+(a.slot2-.5)*24}; }
      else if (a.node.tier===0){ a.timer -= dt; if (a.timer <= 0){ if (!inIdeas(a.x, a.y)){ const q = roamPoint(a); if (q) a.tgt = q; } else { const q = roamPoint(a, true); if (q){ a.tgt = q; a.roam = true; } } a.timer = (Math.random()<.45 ? .5+Math.random()*2 : 0) + (a.item.ageDays > 3 ? 2.5 : 0); } } }
  }
  const stair = a.node && (a.node.kind==='foot' || (a.prev && a.prev.kind==='foot'));
  const speed = (a.item.state==='loose' ? (a.item.ageDays > 3 ? 70 : 140) : 125) * (stair ? .6 : 1) * (a.item.overdue ? .8 : 1);
  a.moving = false;
  if (a.tgt){ const dx = a.tgt.x-a.x, dy = a.tgt.y-a.y, d = Math.hypot(dx,dy);
    if (d > 3){ a.moving = true; const s = Math.min(d, speed*dt); a.x += dx/d*s; a.y += dy/d*s; if (Math.abs(dx) > 2) a.face = dx<0 ? -1 : 1; a.back = dy < -Math.abs(dx)*.6; a.dir = Math.abs(dx) > Math.abs(dy)*.75 ? (dx>0 ? 1 : 3) : (dy>0 ? 0 : 2); } else a.tgt = null; }
  if (!a.moving){ a.back = false; if (p) a.dir = 0; if (p && p.key.startsWith('stage')) a.face = 1; }
  a.phase += dt*(a.moving ? (a.item.state==='loose' ? 9 : 7) : 2.5);
  const h = a.hist; if (!h.length || Math.hypot(h[h.length-1].x-a.x, h[h.length-1].y-a.y) > 6){ const dd = h.length ? h[h.length-1].d + Math.hypot(h[h.length-1].x-a.x, h[h.length-1].y-a.y) : 0; h.push({x:a.x, y:a.y, d:dd}); if (h.length > 600) h.splice(0, h.length-600); }
  if (a.train.length){ const end = h.length ? h[h.length-1].d : 0;
    const sp = vStyle==='cloud' ? 1.9 : 1;
    a.train.forEach((m,i) => { const want = end - (i+1)*44*sp;
      if (!h.length || want < h[0].d){ const row = Math.floor(i/2), side = i%2 ? 1 : -1; const tx = a.x + side*(sp>1 ? 84 + 52*row : 30 + 22*row), ty = a.y - (sp>1 ? 26 + 24*row : 16 + 10*row);
        const dx = tx-m.x, dy = ty-m.y, dd = Math.hypot(dx,dy); m.moving = dd > 2; if (m.moving){ const st = Math.min(dd, 140*dt); m.x += dx/dd*st; m.y += dy/dd*st; m.dir = Math.abs(dx) > Math.abs(dy)*.75 ? (dx>0?1:3) : (dy>0?0:2); } else m.dir = 0; m.phase += dt*(m.moving?9:2); return; }
      let q = h[0]||a; for (let j=h.length-1;j>=0;j--) if (h[j].d <= want){ q = h[j]; break; }
      const dx = q.x-m.x, dy = q.y-m.y; m.moving = Math.hypot(dx,dy) > .5; if (m.moving) m.dir = Math.abs(dx) > Math.abs(dy)*.75 ? (dx>0 ? 1 : 3) : (dy>0 ? 0 : 2); if (Math.abs(dx)>.3) m.face = dx<0?-1:1; m.back = dy < -Math.abs(dx)*.6 && m.moving; m.x = q.x; m.y = q.y; m.phase += dt*(m.moving?9:2); }); }
}
const tierOf = a => a.node ? a.node.tier : 0;
function poseOf(a){ const it = a.item;
  if (a.dragging) return 'panic' + (Math.floor(a.phase)%2);
  if (a.cheer > 0) return Math.floor(a.phase*2)%2 ? 'cheer' : 'walk0';
  if (a.moving) return 'walk' + (Math.floor(a.phase)%4);
  if (a.plan && a.plan.key.startsWith('stage')) return (Math.floor(a.phase*.4 + a.slot*7) % 5 === 0) ? 'wave' : 'walk0';
  if (it.state==='loose') return 'panic' + (Math.floor(a.phase*2)%2);
  if (it.state==='done' && tierOf(a)===3) return a.plan && a.plan.bench ? 'sit' : (a.slot < .45 ? 'sleep' : 'sit');
  return 'walk0'; }

/* ===================== camera ===================== */
const minS = () => Math.min((VP.x1-VP.x0)/((worldBox.x1-worldBox.x0)*1.02), (VP.y1-VP.y0)/((worldBox.y1-worldBox.y0)*1.02));
function clampCam(){ if (!worldBox) return; cam.s = Math.max(minS(), Math.min(1.6, cam.s));
  const hw = (VP.x1-VP.x0)/2/cam.s, hh = (VP.y1-VP.y0)/2/cam.s;
  const lx0 = worldBox.x0 + hw*.15, lx1 = worldBox.x1 - hw*.15; cam.x = lx0 < lx1 ? Math.max(lx0, Math.min(lx1, cam.x)) : (worldBox.x0+worldBox.x1)/2;
  const ly0 = worldBox.y0 - 300 + hh*.6, ly1 = worldBox.y1 - hh*.6; cam.y = ly0 < ly1 ? Math.max(ly0, Math.min(ly1, cam.y)) : (worldBox.y0+worldBox.y1)/2; }
function flyTo(x, y, s){ fly = {x0:cam.x, y0:cam.y, s0:cam.s, x1:x, y1:y, s1:s ?? cam.s, t:0}; }
function modeView(m){ const ts = {0:[TER[0]], 1:[TER[1],TER[2]], 2:[TER[3]]}[m];
  const vw = VP.x1-VP.x0, vh = VP.y1-VP.y0;
  if (narrow()){ const t = ts[0]; const s = vw/1300; const cx = m===0 ? STAGE.x+40 : t.off[0]+t.w*.5; const cy = m===0 ? STAGE.y+120 : t.off[1]+t.h*.45; return {x:cx, y:cy, s}; }
  const x0 = Math.min(...ts.map(t=>t.off[0])), x1 = Math.max(...ts.map(t=>t.off[0]+t.w)), y0 = Math.min(...ts.map(t=>t.off[1])), y1 = Math.max(...ts.map(t=>t.off[1]+t.h*.82));
  const s = Math.min(vw/((x1-x0)*1.02), vh/((y1-y0)*1.0)); return {x:(x0+x1)/2, y:(y0+y1)/2, s}; }
export function setMode(m, animate=true){ mode = m; if (!ready) return; const v = modeView(m); if (animate) flyTo(v.x, v.y, v.s); else { cam.x = v.x; cam.y = v.y; cam.s = v.s; clampCam(); } opts.onMode && opts.onMode(m); }
export const getMode = () => mode;
export function setViewport(r){ const first = !VP.x1; VP = r; if (!ready) return; if (first) setMode(mode, false); else clampCam(); }
export function setHighlight(id){ if (hl===id) return; const prev = agents.get(hl); hl = id; if (prev) refreshAgent(prev); const a = agents.get(id); if (a) refreshAgent(a); }
export function setFilter(listId){ filterList = listId; }
export function setTheme(t){ theme = THEMES[t]!==undefined ? t : 'meadow'; }
export function reveal(id, followIt=false){ if (!ready) return; const a = agents.get(id); if (!a) return; const m = tierMode[tierOf(a)]; if (m!==mode){ mode = m; opts.onMode && opts.onMode(m); }
  if (followIt){ follow = a; fly = null; } else flyTo(a.x, a.y-70, Math.max(cam.s, narrow() ? .45 : .55)); }
export function followIfVisible(id){ const a = agents.get(id); if (!a) return; const [sx, sy] = w2s(a.x, a.y); if (sx > VP.x0 && sx < VP.x1 && sy > VP.y0 && sy < VP.y1 && tierA[tierOf(a)] > .6){ follow = a; fly = null; } }

/* ===================== fx ===================== */
function puff(x, y, col){ for (let i=0;i<12;i++){ const ang = Math.random()*Math.PI*2, v = 60+Math.random()*120; puffs.push({x, y:y-30, vx:Math.cos(ang)*v, vy:Math.sin(ang)*v*.6-60, t:0, col, r:6+Math.random()*7}); } }
let actx; function ping(f, dur=.18){ if (!opts || !opts.sound()) return; try { actx = actx || new (window.AudioContext||window.webkitAudioContext)(); const o=actx.createOscillator(), g=actx.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(.0001,actx.currentTime); g.gain.exponentialRampToValueAtTime(.1,actx.currentTime+.015); g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+dur); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime+dur+.02); } catch {} }
function chime(){ ping(660,.25); setTimeout(()=>ping(880,.3),110); setTimeout(()=>ping(1320,.45),220); }
export { ping };
const flies = Array.from({length:70}, () => ({t:Math.floor(Math.random()*4), u:Math.random(), v:Math.random(), p:Math.random()*6}));

/* ===================== draw ===================== */
function fitText(label, maxW, maxH){ ctx.font = `800 100px Geist, Inter, system-ui, sans-serif`; const tw = ctx.measureText(label).width/100; return Math.min(maxH, maxW/tw); }
function drawSprite(img, meta, x, y, alpha, extra){ const s = cam.s; const [sx, sy] = w2s(x - meta.anchor[0], y - meta.anchor[1]); if (alpha <= .01) return [sx, sy];
  ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = s < .7; ctx.drawImage(img, sx, sy, meta.w*s, meta.h*s); ctx.imageSmoothingEnabled = false;
  if (extra) extra(sx, sy); ctx.globalAlpha = 1; return [sx, sy]; }
function pill(x, y, text, alpha){ const [sx, sy] = w2s(x, y); ctx.globalAlpha = alpha; ctx.font = '600 12px Geist, Inter, sans-serif'; const w = ctx.measureText(text).width + 20, h = 24;
  ctx.fillStyle = 'rgba(20,20,22,.86)'; ctx.beginPath(); ctx.roundRect(sx-w/2, sy-h/2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, sx, sy+.5); ctx.globalAlpha = 1; }
function drawSign(sx, sy, g, label, count, s){ ctx.save(); ctx.translate(sx + g.cx*s, sy + g.cy*s); ctx.transform(1, Math.tan(g.angle||0), 0, 1, 0, 0);
  const fs = fitText(label, g.w*.8, g.h*.46); ctx.font = `800 ${fs*s}px Geist, Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillText(label, 1.5*s, 3*s); ctx.fillStyle = '#ffffff'; ctx.fillText(label, 0, 2*s);
  if (count){ const bx = g.w*.5+6, by = -g.h*.32; ctx.fillStyle = '#1f2733'; ctx.beginPath(); ctx.arc(bx*s, by*s, 23*s, 0, 7); ctx.fill(); ctx.fillStyle = '#ffb86b'; ctx.beginPath(); ctx.arc(bx*s, by*s, 19*s, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a1c0b'; ctx.font = `800 ${22*s}px Geist, Inter, sans-serif`; ctx.fillText(count, bx*s, by*s+1*s); }
  ctx.restore(); }
let vStyle = 'gen'; export function setVillagerStyle(v){ vStyle = v; }
function drawPerson(o, look, pose, scale, ring, alpha, star, cv, gl, fx){
  if (vStyle==='cloud') return drawCloud(o, pose, scale, ring, alpha, star, fx);
  if (vStyle==='gen' && gl) return drawChibi(o, cv ?? 0, pose, scale, ring, alpha, star, gl, fx);
  if (CHIBI) return drawChibi(o, cv ?? 0, pose, scale, ring, alpha, star);
  return drawPixel(o, look, pose, scale, ring, alpha, star); }
function drawCloud(o, pose, scale, ring, alpha, star, fx){
  const [sx, sy] = w2s(o.x, o.y); const mini = !!o.owner, it = o.item; const seed = o.seed || 1; const col = mini ? (o.owner.ccol || [235,235,245]) : (o.ccol || [235,235,245]);
  const k = cam.s*scale*1.05; const q = 3.05*k*1.3*(.94 + (seed%5)*.03); ctx.globalAlpha = alpha;
  let hop = 0; if (pose.startsWith('panic')) hop = Math.abs(Math.sin(T*11 + o.x*.01))*7; else if (pose==='cheer') hop = Math.abs(Math.sin(T*9))*11;
  const lift = ((!mini && it.state==='done' ? 22 : 9) + Math.sin(T*2.2 + (seed%628)/100)*3 + hop)*k;
  ctx.fillStyle = 'rgba(16,20,28,.2)'; ctx.beginPath(); ctx.ellipse(sx, sy, 15*q/3.05*(1 - Math.min(.35, hop*.02)), 4.5*q/3.05, 0, 0, 7); ctx.fill();
  if (ring){ ctx.strokeStyle = ring; ctx.lineWidth = Math.max(2, 2.4*k); ctx.beginPath(); ctx.ellipse(sx, sy, 26*k, 9*k, 0, 0, 7); ctx.stroke(); }
  const moving = pose.startsWith('walk');
  let expr = 'calm';
  if (!mini){ if (it.state==='done' || pose==='sleep' || pose==='sit') expr = 'sleepy'; else if (pose==='cheer' || it.state==='focus') expr = 'happy'; else if (fx==='late') expr = 'worried'; else if (fx==='stale') expr = 'sleepy'; else if (it.state==='loose') expr = 'wow'; }
  if ((expr==='calm' || expr==='wow' || expr==='worried') && ((T + (seed%400)/100) % 4.2) < .14) expr = 'blink';
  const dir = o.dir || 0, back = moving && dir===2, look = moving ? (dir===1 ? 1 : dir===3 ? -1 : 0) : 0;
  const spr = cloudSprite(col, seed, expr, look, back, mini);
  const sq = moving ? Math.sin((o.phase||0)*1.6)*.045 : Math.sin(T*2.2 + seed)*.02, w = 30*q*(1+sq), h = 22*q*(1-sq);
  const top = sy - lift - h;
  ctx.imageSmoothingEnabled = q < 1.6; ctx.drawImage(spr, sx - w/2, top, w, h); ctx.imageSmoothingEnabled = false;
  if (star){ const by = top - 9*k - Math.abs(Math.sin(T*3 + o.x))*3*k; ctx.font = `700 ${22*k}px Geist, Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7a5208'; ctx.fillText('★', sx+1*k, by+1.5*k); ctx.fillStyle = '#F5A524'; ctx.fillText('★', sx, by); }
  if (fx==='late'){ const b = Math.sin(T*5 + o.x)*2*k; const x = sx + 12*q, y = top + 5*q + b; ctx.fillStyle = '#9ED8F5'; ctx.beginPath(); ctx.moveTo(x, y-7*k); ctx.quadraticCurveTo(x+5*k, y, x, y+4*k); ctx.quadraticCurveTo(x-5*k, y, x, y-7*k); ctx.fill(); ctx.strokeStyle = '#1b1822'; ctx.lineWidth = Math.max(1, 1.4*k); ctx.stroke(); }
  if (expr==='sleepy' && !mini){ const z = (T*.5 + (seed%100)*.01) % 1; ctx.fillStyle = `rgba(255,255,255,${(1-z)*.95*alpha})`; ctx.strokeStyle = `rgba(27,24,34,${(1-z)*.6*alpha})`; ctx.font = `800 ${(12+z*9)*k}px Geist, Inter, sans-serif`; ctx.textAlign = 'left'; ctx.lineWidth = 2; const zx = sx + 11*q + z*10*k, zy = top + 2*q - z*22*k; ctx.strokeText('z', zx, zy); ctx.fillText('z', zx, zy); }
  ctx.globalAlpha = 1; }
function drawChibi(o, cv, pose, scale, ring, alpha, star, gl, fx){
  const [sx, sy] = w2s(o.x, o.y); const k = cam.s*scale*1.05; ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(16,20,28,.26)'; ctx.beginPath(); ctx.ellipse(sx, sy, 19*k, 6.5*k, 0, 0, 7); ctx.fill();
  if (ring){ ctx.strokeStyle = ring; ctx.lineWidth = Math.max(2, 2.4*k); ctx.beginPath(); ctx.ellipse(sx, sy, 26*k, 9*k, 0, 0, 7); ctx.stroke(); }
  let col = CH.idle, row = o.dir || 0, hop = 0;
  if (pose.startsWith('walk')) col = CH[pose] ?? 1;
  else if (pose==='wave') col = CH.wave;
  else if (pose==='sit' || pose==='sleep'){ col = CH.sit; row = 0; }
  else if (pose.startsWith('panic')){ col = pose==='panic1' ? CH.wave : CH.idle; row = 0; hop = Math.abs(Math.sin(T*11 + o.x*.01))*7; }
  else if (pose==='cheer'){ col = CH.wave; row = 0; hop = Math.abs(Math.sin(T*9))*10; }
  if (gl){ const gp = pose==='sleep' ? 'sit' : pose==='cheer' ? 'wave' : pose.startsWith('panic') || pose.startsWith('walk') || pose==='wave' || pose==='sit' ? pose : 'idle';
    const vw = (pose==='sit' || pose==='sleep' || pose.startsWith('panic') || pose==='cheer') ? 0 : (o.dir || 0); const q = 3.05*k;
    ctx.imageSmoothingEnabled = q < 1.6; ctx.drawImage(genFrame(gl, vw, gp), sx-12*q, sy-(31.5*q)-hop*k, 24*q, 32*q); ctx.imageSmoothingEnabled = false; }
  else { ctx.imageSmoothingEnabled = k < .95;
  ctx.drawImage(chibiFor(cv), col*64, row*96, 64, 96, sx-32*k, sy-(92+hop)*k, 64*k, 96*k); ctx.imageSmoothingEnabled = false; }
  if (star){ const by = sy - (104+hop)*k - Math.abs(Math.sin(T*3 + o.x))*3*k; ctx.font = `700 ${22*k}px Geist, Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7a5208'; ctx.fillText('★', sx+1*k, by+1.5*k); ctx.fillStyle = '#F5A524'; ctx.fillText('★', sx, by); }
  if (fx==='late'){ const b = Math.sin(T*5 + o.x)*2*k; const x = sx + 15*k, y = sy - 84*k + b; ctx.fillStyle = '#9ED8F5'; ctx.beginPath(); ctx.moveTo(x, y-7*k); ctx.quadraticCurveTo(x+5*k, y, x, y+4*k); ctx.quadraticCurveTo(x-5*k, y, x, y-7*k); ctx.fill(); ctx.strokeStyle = '#1b1822'; ctx.lineWidth = Math.max(1, 1.4*k); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(x-1.5*k, y-2*k, 1.5*k, 2*k); }
  if (fx==='stale'){ const z = (T*.45 + o.x*.003) % 1; ctx.fillStyle = `rgba(255,255,255,${(1-z)*.9*alpha})`; ctx.strokeStyle = `rgba(27,24,34,${(1-z)*.6*alpha})`; ctx.font = `800 ${(12+z*8)*k}px Geist, Inter, sans-serif`; ctx.textAlign = 'left'; ctx.lineWidth = 2; ctx.strokeText('z', sx+14*k+z*10*k, sy-74*k-z*20*k); ctx.fillText('z', sx+14*k+z*10*k, sy-74*k-z*20*k); }
  if (pose==='sleep'){ const z = (T*.6 + o.x*.001) % 1; ctx.fillStyle = `rgba(255,255,255,${(1-z)*alpha})`; ctx.font = `700 ${(16+z*12)*k}px Geist, Inter, sans-serif`; ctx.textAlign = 'left'; ctx.fillText('z', sx+16*k+z*14*k, sy-80*k-z*26*k); }
  ctx.globalAlpha = 1; }
function drawPixel(o, look, pose, scale, ring, alpha, star){
  const [sx, sy] = w2s(o.x, o.y); const k = PXS*cam.s*scale; ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(20,24,30,.28)'; ctx.beginPath(); ctx.ellipse(sx, sy, 6.5*k, 2.4*k, 0, 0, 7); ctx.fill();
  if (ring){ ctx.strokeStyle = ring; ctx.lineWidth = Math.max(2, 1*k); ctx.beginPath(); ctx.ellipse(sx, sy, 9*k, 3.6*k, 0, 0, 7); ctx.stroke(); }
  const img = sprite(look, pose, o.back);
  ctx.save(); ctx.translate(sx, sy + (pose==='sit'||pose==='sleep' ? 2*k : 0)); if (o.face < 0) ctx.scale(-1, 1); ctx.drawImage(img, -8*k, -26*k, 16*k, 28*k); ctx.restore();
  if (star){ const by = sy - 30*k - Math.abs(Math.sin(T*3 + o.x))*2*k; ctx.font = `900 ${8*k}px Geist, Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7a5a1a'; ctx.fillText('★', sx+.5*k, by+.5*k); ctx.fillStyle = '#f2c14e'; ctx.fillText('★', sx, by); }
  if (pose==='sleep'){ const z = (T*.6 + o.x*.001) % 1; ctx.fillStyle = `rgba(255,255,255,${(1-z)*alpha})`; ctx.font = `800 ${(7+z*5)*k}px Geist, Inter, sans-serif`; ctx.textAlign = 'left'; ctx.fillText('z', sx+6*k+z*6*k, sy-26*k-z*12*k); }
  ctx.globalAlpha = 1;
}
function draw(){
  const night = opts.night();
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.imageSmoothingEnabled = true; ctx.clearRect(0,0,W,H);
  for (const [img, a] of [[IMG.day, 1], [IMG.night, night]]){ if (a <= 0) continue; ctx.globalAlpha = a;
    const k = Math.max(W/img.width, H/img.height)*1.08; const iw = img.width*k, ih = img.height*k;
    const px = -((cam.x - (worldBox.x0+worldBox.x1)/2)*.04*k) - (iw-W)/2, py = -((cam.y - worldBox.y1/2)*.03*k) - (ih-H)/2; ctx.drawImage(img, px, py, iw, ih); }
  ctx.globalAlpha = 1; ctx.fillStyle = night>.5 ? 'rgba(20,24,60,.3)' : 'rgba(235,244,255,.3)'; ctx.fillRect(0,0,W,H);
  ctx.imageSmoothingEnabled = cam.s < .55;
  for (let i=TER.length-1;i>=0;i--){ const t = TER[i]; const [sx, sy] = w2s(t.off[0], t.off[1]); ctx.globalAlpha = tierA[i]; ctx.drawImage(graded(i), sx, sy, t.w*cam.s, t.h*cam.s); }
  ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
  const list = [], s = cam.s;
  PLOTS.forEach((p, pi) => { const L = model.lists[pi]; if (!L) return; const key = L.bld; list.push({y:p.y+20, f:(nightPass) => {
    const img = nightPass ? BIMG[key+'-night'] : BIMG[key]; const m = BMETA[key]; const a = (nightPass ? Math.min(1, night*1.6) : 1) * tierA[p.tier] * (filterList && filterList!==L.id ? .45 : 1);
    if (!nightPass && hoverPlot===pi){ const [cx, cy] = w2s(p.x, p.y+30); ctx.fillStyle = L.color+'66'; ctx.beginPath(); ctx.ellipse(cx, cy, m.w*.6*s, 90*s, 0, 0, 7); ctx.fill(); }
    drawSprite(img, m, p.x, p.y+40, a, (sx, sy) => { if (hoverPlot===pi && !nightPass){ ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a*.18; ctx.drawImage(img, sx, sy, m.w*s, m.h*s); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a; }
      if (m.sign) drawSign(sx, sy, m.sign, L.name.toUpperCase().slice(0,12), counts[L.id]||0, s); }); }}); });
  list.push({y:GAZ.y+20, f:(n) => drawSprite(n ? BIMG['gazebo-night'] : BIMG.gazebo, BMETA.gazebo, GAZ.x, GAZ.y+40, (n ? Math.min(1,night*1.6) : 1)*tierA[GAZ.tier])});
  list.push({y:STAGE.y-60, f:(n) => { const m = PMETA['stage-day']; const a = (n ? Math.min(1,night*1.6) : 1)*tierA[STAGE.tier];
    if (!n && hoverStage){ const [cx, cy] = w2s(STAGE.x, STAGE.y-60); ctx.fillStyle = 'rgba(242,193,78,.4)'; ctx.beginPath(); ctx.ellipse(cx, cy, 300*s, 110*s, 0, 0, 7); ctx.fill(); }
    drawSprite(n ? PIMG['stage-night'] : PIMG['stage-day'], m, STAGE.x, STAGE.y, a, (sx, sy) => { if (s > .2) drawSign(sx, sy, {...m.sign, angle:-.08}, 'FOCUS', 0, s); }); }});
  list.push({y:BOARD.y-20, f:(n) => { const m = PMETA.board; drawSprite(PIMG.board, m, BOARD.x, BOARD.y, (n ? Math.min(1,night*1.6)*.0 : 1)*tierA[BOARD.tier], (sx, sy) => {
    const c = model.items.filter(i => i.state==='loose').length; if (!c || n) return; const bx = sx + m.w*.82*s, by = sy + 30*s; ctx.fillStyle = '#1f2733'; ctx.beginPath(); ctx.arc(bx, by, 24*s, 0, 7); ctx.fill(); ctx.fillStyle = '#ff8f7a'; ctx.beginPath(); ctx.arc(bx, by, 20*s, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a1012'; ctx.font = `800 ${22*s}px Geist, Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c, bx, by+1*s); }); }});
  for (const d of DECOR){ const t = TER[d[0]]; const x = t.off[0]+d[2], y = t.off[1]+d[3]; const key = d[1]==='lamp' ? 'lamp-day' : d[1]; const flat = d[1]==='lily' || d[1]==='dock' || d[1]==='flowerbed';
    list.push({y: flat ? y-200 : y-8, f:(n) => { if (n && d[1]!=='lamp') return; drawSprite(n ? PIMG['lamp-night'] : PIMG[key], PMETA[key], x, y, (n ? Math.min(1,night*1.6) : 1)*tierA[d[0]]); }}); }
  for (const a of agents.values()){ if (a.drop>0 || a.hidden || a.cap) continue; const ti = tierOf(a); let al = a.dragging || follow===a || hl===a.id ? 1 : Math.max(tierA[ti], .25);
    if (filterList && a.item.listId!==filterList && !a.dragging) al *= .35;
    const star = a.item.state==='focus'; const ring = hl===a.id ? '#ffb86b' : null;
    list.push({y:a.y + (a.dragging?1e5:0) + (vStyle==='cloud' && a.item.state==='done' ? 70 : 0), f:(n) => { if (n && vStyle!=='cloud') return; drawPerson(a, a.look, poseOf(a), 1, n ? null : ring, n ? al*Math.min(.6, night*.75) : al, star && !n, a.cv, a.gl, a.item.overdue && a.item.state!=='done' ? 'late' : a.item.state==='loose' && a.item.ageDays > 3 ? 'stale' : null); }});
    for (const m of a.train) list.push({y:m.y + (vStyle==='cloud' ? 34 : 0), f:(n) => { if (n && vStyle!=='cloud') return; drawPerson(m, a.look, m.moving ? 'walk'+(Math.floor(m.phase)%4) : 'idle', .6, null, n ? al*Math.min(.6, night*.75) : al, false, a.cv, m.gl); }}); }
  PLOTS.forEach((p, pi) => { const L = model.lists[pi]; if (!L) return; const extra = (counts[L.id]||0) - QMAX; if (extra <= 0) return;
    list.push({y:p.y+260, f:(n) => { if (n) return; pill(p.x+210, p.y+215, '+'+extra+' waiting', tierA[p.tier]); }}); });
  { const extra = model.items.filter(i => i.state==='loose').length - LOOSE_MAX; if (extra > 0) list.push({y:BOARD.y+10, f:(n) => { if (n) return; pill(BOARD.x, BOARD.y+44, '+'+extra+' more thoughts', tierA[0]); }}); }
  list.sort((p,q)=>p.y-q.y); for (const l of list) l.f(false);
  for (const a of agents.values()) if (a.drop>0){ const [sx, sy] = w2s(a.x, a.y - a.drop*a.drop*900); ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(T*6+a.slot*9)*.5);
    ctx.fillStyle = '#1f2733'; ctx.fillRect(-26*s, -18*s, 52*s, 36*s); ctx.fillStyle = '#fffaf0'; ctx.fillRect(-23*s, -15*s, 46*s, 30*s); ctx.fillStyle = '#ff8f7a'; ctx.fillRect(-23*s, -15*s, 46*s, 6*s);
    ctx.fillStyle = '#c9c2b0'; for (let i=0;i<3;i++) ctx.fillRect(-17*s, (-3+i*6)*s, (30-i*8)*s, 3*s); ctx.restore(); }
  for (const p of puffs){ const [sx, sy] = w2s(p.x, p.y); ctx.globalAlpha = Math.max(0, 1-p.t*1.4); ctx.fillStyle = p.col; const r = p.r*s*(1-p.t*.6); ctx.fillRect(sx-r, sy-r, r*2, r*2); }
  ctx.globalAlpha = 1;
  if (night > 0){
    const c = night <= .5 ? [255, 255-59*night*2, 255-85*night*2] : [255-175*(night-.5)*2, 196-104*(night-.5)*2, 170-10*(night-.5)*2];
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgb(${c.map(Math.round).join(',')})`; ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation = 'source-over';
    for (const l of list) l.f(true);
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, al, col='255,196,110') => { const [sx, sy] = w2s(x, y); const R = r*s; const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, R); gr.addColorStop(0, `rgba(${col},${al})`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr; ctx.fillRect(sx-R, sy-R, R*2, R*2); };
    for (const d of DECOR) if (d[1]==='lamp'){ const t = TER[d[0]]; glow(t.off[0]+d[2], t.off[1]+d[3]-200, 230, .4*night*tierA[d[0]]); }
    PLOTS.forEach((p, pi) => { if (model.lists[pi]) glow(p.x, p.y-150, 330, .16*night*tierA[p.tier]); });
    glow(STAGE.x, STAGE.y-200, 380, .22*night*tierA[STAGE.tier]);
    for (const f of flies){ const t = TER[f.t]; const x = t.off[0] + t.w*(.15+f.u*.7) + Math.sin(T*.7+f.p)*40, y = t.off[1] + t.h*(.15+f.v*.45) + Math.cos(T*.9+f.p)*25; glow(x, y, 14+3/s, night*tierA[f.t]*(.5+.5*Math.sin(T*3+f.p*3)), '255,240,140'); }
    ctx.globalCompositeOperation = 'source-over';
  }
  drawFX(night);
}

/* ===================== celebrations ===================== */
const conf = [], rockets = [];
const CONF = ['#E5484D','#F5A524','#2F9E6B','#3E63DD','#8E4EC6','#D6409F','#ffffff','#0EA5B7'];
export function confetti(x, y, n=36, spread=1){ const zf = Math.min(2.4, .55/Math.max(.2, cam.s)); for (let i=0;i<n;i++){ const a = -Math.PI/2 + (Math.random()-.5)*2.4*spread, v = (300+Math.random()*380)*Math.max(1, zf)*.85; conf.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, r:Math.random()*6, vr:(Math.random()-.5)*10, t:0, life:1.8+Math.random()*.9, c:CONF[i%CONF.length], w:7+Math.random()*6, h:4+Math.random()*4, zf}); } }
function firework(x, y){ const c = CONF[Math.floor(Math.random()*6)], c2 = CONF[Math.floor(Math.random()*6)]; for (let i=0;i<46;i++){ const a = i/46*Math.PI*2, v = 260+Math.random()*120; conf.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, r:0, vr:0, t:0, life:1.1+Math.random()*.5, c:i%2?c:c2, w:6, h:6, spark:true, g:.35}); } ping(1200,.25); }
export function celebrate(){ if (!ready || reducedMotion) return; const t = TER[0]; const night = opts.night();
  for (let i=0;i<(night > .4 ? 6 : 4);i++) setTimeout(() => { const x = t.off[0]+t.w*(.25+Math.random()*.5), y = t.off[1]+t.h*.55;
    if (night > .4) rockets.push({x, y, vy:-900-Math.random()*300, top:t.off[1]-200-Math.random()*400, t:0}); else confetti(x, t.off[1]+t.h*.15, 50, 1.4); }, i*380);
  for (const a of agents.values()) if (tierOf(a)===0 && !a.dragging) a.cheer = 2; chime(); }
function stepFX(dt){
  for (let i=conf.length-1;i>=0;i--){ const p = conf[i]; p.t += dt; p.vy += (p.g ? 260 : 700*(p.zf||1))*dt*(p.g||1); if (!p.spark){ p.vy = Math.min(p.vy, 150*(p.zf||1)); p.vx += Math.sin(p.t*6 + p.r)*40*dt*(p.zf||1); } p.vx *= Math.pow(p.spark ? .35 : .12, dt); p.x += p.vx*dt; p.y += p.vy*dt; p.r += p.vr*dt; if (p.t > p.life) conf.splice(i,1); }
  for (let i=rockets.length-1;i>=0;i--){ const r = rockets[i]; r.t += dt; r.y += r.vy*dt; r.vy *= Math.pow(.6, dt); if (r.y < r.top || r.t > 1.6){ firework(r.x, r.y); rockets.splice(i,1); } }
}
function drawFX(night){
  const s = cam.s; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  // confetti / sparks (world space)
  for (const p of conf){ const [sx, sy] = w2s(p.x, p.y); const a = Math.max(0, 1 - Math.max(0, p.t - p.life*.6)/(p.life*.4));
    ctx.globalAlpha = a; if (p.spark){ ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.c; const r = Math.max(3, 6*s); ctx.fillRect(sx-r/2, sy-r/2, r, r); ctx.globalCompositeOperation = 'source-over'; }
    else { ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.r); ctx.scale(.35 + .65*Math.abs(Math.cos(p.r*1.7)), 1); ctx.fillStyle = p.c; const cw = Math.max(9, p.w*s*1.4), ch = Math.max(5, p.h*s*1.4); ctx.fillRect(-cw/2, -ch/2, cw, ch); ctx.restore(); } }
  for (const r of rockets){ const [sx, sy] = w2s(r.x, r.y); ctx.globalAlpha = 1; ctx.fillStyle = '#fff6c8'; ctx.fillRect(sx-2, sy-2, 4, 8); ctx.globalAlpha = .4; ctx.fillRect(sx-1, sy+6, 2, 14); }
  ctx.globalAlpha = 1;
}

/* ===================== speech bubbles ===================== */
const bubbles = []; let nextTalk = 3;
const LINES = {
  loose: ['Where do I go?', 'Sort me!', 'Hello? Anyone?', 'Just a thought…', 'Do I belong somewhere?', 'Pick me!', 'I was just an idea…'],
  stale: ['Still here…', 'Forgotten me?', '*yawn*', 'Been a while…'],
  planned: ['Ready when you are.', 'Waiting patiently.', 'Still on the list!', 'Any minute now…', 'I can wait.'],
  today: ["Today's the day!", 'Today, right?', "Let's do this today."],
  late: ['Uh… I\'m late.', 'Still waiting on me?', 'Psst. Overdue.', 'Running late!'],
  focus: ['On stage!', "Let's go!", 'All eyes on me.', 'Top three, baby.', 'Ready to shine.'],
  done: ['Done and dusted.', 'Ahh, rest.', 'Nice work.', 'Nap time.', 'Feels good.', 'Off duty!'],
};
function lineFor(it){
  const pick2 = a => a[Math.floor(Math.random()*a.length)];
  if (it.state==='done') return pick2(LINES.done);
  if (it.state==='focus') return pick2(LINES.focus);
  if (it.overdue) return pick2(LINES.late);
  if (it.subsOpen && Math.random() < .5) return it.subsOpen===1 ? 'One step to go!' : `${it.subsOpen} steps to go!`;
  if (it.state==='loose') return pick2(it.ageDays > 3 ? LINES.stale : LINES.loose);
  if (it.dueToday) return pick2(LINES.today);
  return pick2(LINES.planned); }
function stepTalk(dt){
  nextTalk -= dt;
  if (!reducedMotion && nextTalk <= 0 && bubbles.length < 2 && opts.visible() && labelMode!=='off'){
    nextTalk = 3 + Math.random()*4;
    const pool = [...agents.values()].filter(a => a.drop===0 && !a.hidden && !a.cap && !a.dragging && tierMode[tierOf(a)]===mode && !bubbles.some(b => b.a===a) && tierA[tierOf(a)] > .6 && a.shown && !a.mini && !a.ex);
    const vis = pool.filter(a => { const [x, y] = w2s(a.x, a.y); return x > VP.x0+40 && x < VP.x1-40 && y > VP.y0+80 && y < VP.y1; });
    if (vis.length){ const a = vis[Math.floor(Math.random()*vis.length)]; const el = document.createElement('div'); el.className = 'wl say'; el.innerHTML = '<div class="in"><div class="bub"></div></div>'; el.querySelector('.bub').textContent = lineFor(a.item);
      el.addEventListener('pointerdown', e => { e.stopPropagation(); opts.onSelect && opts.onSelect(a.id); }); labelsEl.appendChild(el); bubbles.push({a, el, t:0}); if (a.item.state!=='loose') a.cheerSmall = .8; } }
  for (let i=bubbles.length-1;i>=0;i--){ const b = bubbles[i]; b.t += dt; const a = b.a;
    if (b.t > 3.4 || !agents.has(a.id) || tierMode[tierOf(a)]!==mode || a.hidden || a.drop || a.ex){ b.el.remove(); bubbles.splice(i,1); continue; }
    const lift = a.shown && !a.mini ? (a.ex ? 30 + Math.min(9, a.train.length)*14 : 30) : 4; const [x, y] = w2s(a.x, a.y - 102);
    b.el.style.transform = `translate(${x}px,${y - lift}px)`; b.el.style.opacity = b.t < .2 ? b.t/.2 : b.t > 2.9 ? (3.4-b.t)/.5 : 1; } }

/* ===================== labels (grouping) ===================== */
let labelMode = 'all'; let reducedMotion = false;
export function setReducedMotion(v){ reducedMotion = !!v; } const qcards = new Map();
function qcardFor(pi){ let el = qcards.get(pi); if (el) return el; el = document.createElement('div'); el.className = 'wl qc'; el.innerHTML = '<div class="in"><div class="qcard"></div><div class="tail"></div></div>';
  el.querySelector('.qcard').addEventListener('pointerdown', e => { e.stopPropagation(); const r = e.target.closest('[data-id]'); if (r){ opts.onSelect && opts.onSelect(r.dataset.id); return; } const L = model.lists[pi]; if (L && opts.onOpenList) opts.onOpenList(L.id); });
  labelsEl.appendChild(el); qcards.set(pi, el); return el; }
const escH = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function setLabelMode(m){ labelMode = m; }
function layout(){
  const lmax = cam.s < .3 ? 150 : cam.s < .45 ? 180 : 230; labelsEl.style.setProperty('--lmax', lmax+'px');
  const crowded = new Set(); const CROWD = 1;
  PLOTS.forEach((p, pi) => { const L = model.lists[pi]; const el = qcards.get(pi); const n = L ? (counts[L.id]||0) : 0;
    const show = L && mode===1 && n > CROWD && cam.s < .55 && labelMode!=='off' && !(filterList && filterList!==L.id);
    if (!show){ if (el && el.style.opacity!=='0'){ el.style.opacity = 0; el.style.pointerEvents = 'none'; } return; }
    crowded.add(L.id); const c = qcardFor(pi);
    const items = model.items.filter(i => i.state==='planned' && i.listId===L.id).sort((a,b) => a.order-b.order);
    const sig = L.name+L.color+items.map(i => i.id+i.title+(i.overdue?1:0)).join('|');
    if (c.sig !== sig){ c.sig = sig; const top = items.slice(0,4);
      c.querySelector('.qcard').innerHTML = `<div class="qh"><i style="background:${L.color}"></i>${escH(L.name)}<b>${items.length}</b></div>` + top.map(i => `<div class="qr${i.overdue?' late':''}" data-id="${i.id}"><span>${escH(i.title)}</span></div>`).join('') + (items.length > 4 ? `<div class="qm">+${items.length-4} more</div>` : ''); }
    const [x, y] = w2s(p.x, p.y - 470); c.style.transform = `translate(${x}px,${y+(narrow()?40:0)}px)`; c.style.setProperty('--qs', narrow() ? '.74' : '1'); c.style.opacity = tierA[p.tier] > .6 ? 1 : 0; c.style.pointerEvents = tierA[p.tier] > .6 ? '' : 'none'; });
  const cands = [];
  for (const a of agents.values()){
    const it = a.item, inMode = tierMode[tierOf(a)]===mode; let rank = -1;
    if (a.drop===0 && !a.hidden && !a.cap){
      if (hl===a.id || a.dragging || follow===a) rank = 0;
      else if (labelMode==='off') rank = -1;
      else if (it.state==='focus' && inMode) rank = 1;
      else if (inMode && it.state==='loose') rank = labelMode==='all' ? 2 : 3;
      else if (inMode && it.state==='planned' && labelMode==='all' && !crowded.has(it.listId)) rank = 2;
      else if (inMode && it.state==='done' && labelMode==='all' && cam.s > .5) rank = 4;
      if (rank > 0 && filterList && it.listId!==filterList) rank = -1; }
    a.cnt = 0;
    if (rank < 0){ if (a.shown){ a.el.style.opacity = 0; a.el.style.pointerEvents = 'none'; } a.shown = false; continue; }
    const [x, y] = w2s(a.x, a.y - 102); cands.push({a, rank, x, y});
  }
  cands.sort((p,q) => p.rank-q.rank || (q.a.shown?1:0)-(p.a.shown?1:0) || p.y-q.y);
  const placed = [];
  const hit = r => placed.find(p => !(r.x1 < p.r.x0 || r.x0 > p.r.x1 || r.y1 < p.r.y0 || r.y0 > p.r.y1));
  for (const c of cands){ const a = c.a;
    if (!a.natW){ a.note.style.maxWidth = 'none'; a.el.classList.remove('mini'); a.natW = Math.ceil(a.note.getBoundingClientRect().width) || 140; a.note.style.maxWidth = ''; }
    const w = Math.min(lmax, a.natW);
    const off = c.x < VP.x0-30 || c.x > VP.x1+30 || c.y < VP.y0-10 || c.y > VP.y1+60;
    if (off){ if (a.shown){ a.el.style.opacity = 0; a.el.style.pointerEvents = 'none'; } a.shown = false; continue; }
    const r = {x0:c.x-w/2-2, x1:c.x+w/2+2, y0:c.y-26, y1:c.y};
    const full = c.rank <= 1 || !hit(r);
    if (full) placed.push({a, r});
    else { const pr = {x0:c.x-9, x1:c.x+9, y0:c.y-34, y1:c.y-14}; if (hit(pr)){ if (a.shown){ a.el.style.opacity = 0; a.el.style.pointerEvents = 'none'; } a.shown = false; continue; } placed.push({a, r:pr}); }
    if (a.mini !== !full){ a.mini = !full; a.el.classList.toggle('mini', a.mini); }
    const ex = full && a.train.length > 0 && (hl===a.id || follow===a) && cam.s <= .55; if (a.ex !== ex){ a.ex = ex; a.el.classList.toggle('ex', ex); }
    a.shown = true; a.el.style.transform = `translate(${c.x}px,${c.y}px)`; a.el.style.opacity = 1; a.el.style.pointerEvents = ''; a.cnt = 0; }
  // step labels for minions: shown when zoomed in, or when their leader is highlighted/followed
  for (const a of agents.values()){ const show = a.train.length && a.drop===0 && !a.hidden && !a.cap && tierMode[tierOf(a)]===mode && labelMode!=='off' && cam.s > .55;
    for (const m of a.train){
      if (!show){ if (m.shown){ m.el.style.opacity = 0; m.shown = false; } continue; }
      if (!m.el){ m.el = document.createElement('div'); m.el.className = 'wl stepl'; m.el.innerHTML = '<div class="in"><div class="snote"><span class="t"></span></div></div>'; m.el.querySelector('.t').textContent = m.text; m.el.addEventListener('pointerdown', e => { e.stopPropagation(); opts.onSelect && opts.onSelect(a.id); }); labelsEl.appendChild(m.el); }
      const [x, y] = w2s(m.x, m.y - 66); const w = Math.min(120, 14 + m.text.length*5.6); const r = {x0:x-w/2, x1:x+w/2, y0:y-18, y1:y};
      if (hit(r)){ if (m.shown){ m.el.style.opacity = 0; m.shown = false; } continue; }
      placed.push({a, r}); m.el.style.transform = `translate(${x}px,${y}px)`; m.el.style.opacity = 1; m.shown = true; } }
  for (const p of placed){ const n = p.a.cnt; if (p.a.lastCnt !== n){ p.a.plusEl.textContent = n ? '+'+n : ''; p.a.plusEl.style.display = n ? '' : 'none'; p.a.lastCnt = n; } }
}

/* ===================== input ===================== */
function agentAt(cx, cy){ let best=null, bd=1e9; for (const a of agents.values()){ if (a.drop>0 || a.hidden) continue; if (tierA[tierOf(a)] < .6) continue; const [sx, sy] = w2s(a.x, a.y); const k = cam.s*1.05;
  if (a.cap) continue; if (cx > sx-24*k && cx < sx+24*k && cy > sy-92*k && cy < sy+6*k){ const d = Math.abs(cy-(sy-45*k)); if (d < bd){ bd = d; best = a; } } } return best; }
const ptrs = new Map(); let gesture = null, vel = {x:0, y:0};
function bindInput(){
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (ptrs.size===2){ const [a,b] = [...ptrs.values()]; gesture = {type:'pinch', d0:Math.hypot(a.x-b.x,a.y-b.y), s0:cam.s}; return; }
    fly = null; follow = null; const ag = agentAt(e.clientX, e.clientY);
    if (ag){ gesture = {type:'drag', a:ag, moved:false, x0:e.clientX, y0:e.clientY}; }
    else { gesture = {type:'pan', moved:false, t0:performance.now(), x0:e.clientX, y0:e.clientY}; vel = {x:0, y:0}; } });
  canvas.addEventListener('pointermove', e => { const p = ptrs.get(e.pointerId);
    if (!p){ const ag = agentAt(e.clientX, e.clientY); canvas.style.cursor = ag ? 'pointer' : ''; return; }
    const dx = e.clientX-p.x, dy = e.clientY-p.y; p.x = e.clientX; p.y = e.clientY; if (!gesture) return;
    if (gesture.type==='pinch' && ptrs.size===2){ const [a,b] = [...ptrs.values()]; const d = Math.hypot(a.x-b.x,a.y-b.y); zoomAt((a.x+b.x)/2, (a.y+b.y)/2, gesture.s0*d/gesture.d0); return; }
    if (gesture.type==='drag'){ if (!gesture.moved && Math.hypot(e.clientX-gesture.x0, e.clientY-gesture.y0) > 6){ gesture.moved = true; gesture.a.dragging = true; canvas.classList.add('drag'); }
      if (!gesture.moved) return;
      const [wx, wy] = s2w(e.clientX, e.clientY + 40*cam.s); gesture.a.x = wx; gesture.a.y = wy;
      hoverPlot = -1; hoverStage = false; hoverTier = -1;
      PLOTS.forEach((q, i) => { if (hoverPlot<0 && model.lists[i] && Math.abs(wx-q.x) < 210 && wy > q.y-460 && wy < q.y+200) hoverPlot = i; });
      if (hoverPlot<0 && Math.hypot((wx-STAGE.x)/1.25, (wy-(STAGE.y-60))*2) < 330) hoverStage = true;
      hoverTier = hoverPlot>=0 ? PLOTS[hoverPlot].tier : hoverStage ? STAGE.tier : tierAt(wx, wy);
      const m = 70; gesture.edge = {vx: e.clientX < VP.x0+m ? -1 : e.clientX > VP.x1-m ? 1 : 0, vy: e.clientY < VP.y0+m ? -1 : e.clientY > VP.y1-m ? 1 : 0}; return; }
    if (gesture.type==='pan'){ if (Math.hypot(e.clientX-gesture.x0, e.clientY-gesture.y0) > 6) gesture.moved = true; cam.x -= dx/cam.s; cam.y -= dy/cam.s; vel = {x:dx, y:dy}; clampCam(); } });
  const end = e => { ptrs.delete(e.pointerId); if (!gesture) return;
    if (gesture.type==='drag'){ const a = gesture.a; a.dragging = false; canvas.classList.remove('drag');
      if (!gesture.moved){ opts.onSelect && opts.onSelect(a.id); }
      else { a.route = []; a.tgt = null; a.planKey = null; a.prev = null; a.node = null; a.hidden = false; let target = null;
        if (hoverPlot>=0) target = {type:'list', listId:model.lists[hoverPlot].id}; else if (hoverStage) target = {type:'focus'}; else if (hoverTier===0) target = {type:'inbox'}; else if (hoverTier===3) target = {type:'done'};
        if (target){ ping(target.type==='done' ? 0 : 740); puff(a.x, a.y, target.type==='list' ? model.lists[hoverPlot].color : target.type==='focus' ? '#f2c14e' : '#ffffff'); follow = a; }
        opts.onDrop && opts.onDrop(a.id, target); }
      hoverPlot = -1; hoverStage = false; hoverTier = -1; gesture = null; return; }
    if (gesture.type==='pan' && !gesture.moved && performance.now()-gesture.t0 < 300){ const [wx, wy] = s2w(e.clientX, e.clientY); const ti = tierAt(wx, wy);
      if (ti >= 0 && tierMode[ti] !== mode) setMode(tierMode[ti]); else opts.onBackground && opts.onBackground(); }
    gesture = ptrs.size===1 ? {type:'pan', moved:true, t0:0, x0:0, y0:0} : null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', e => { e.preventDefault(); fly = null; follow = null; zoomAt(e.clientX, e.clientY, cam.s*Math.exp(-e.deltaY*.0015)); }, {passive:false});
}
function zoomAt(cx, cy, s){ const [wx, wy] = s2w(cx, cy); cam.s = Math.max(minS(), Math.min(1.6, s)); cam.x = wx - (cx-vcx())/cam.s; cam.y = wy - (cy-vcy())/cam.s; clampCam(); }
export function zoomBy(f){ if (!ready) return; zoomAt(vcx(), vcy(), cam.s*f); }

/* ===================== boot ===================== */
function resize(){ DPR = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR); }
export async function initWorld(o){
  opts = o; canvas = o.canvas; ctx = canvas.getContext('2d'); labelsEl = o.labels;
  const bkeys = ['work','school','gym','home','money','ideas','gazebo'];
  const pkeys = ['stage-day','stage-night','dock','lily','bench','bench-l','bench-r','lamp-day','lamp-night','planter','flowerbed','board'];
  const [ims, day, nightImg, bm, pm, bimgs, nights, pimgs] = await Promise.all([Promise.all(TER.map(t => loadImg(t.img))), loadImg('art/sky-day.webp'), loadImg('art/sky-night.webp'),
    fetch('art/buildings.json').then(r => r.json()), fetch('art/props.json').then(r => r.json()),
    Promise.all(bkeys.map(k => loadImg(`art/b-${k}-day.webp`))), Promise.all(bkeys.map(k => loadImg(`art/b-${k}-night.webp`))), Promise.all(pkeys.map(k => loadImg(`art/p-${k}.webp`)))]);
  try { CHIBI = await loadImg('art/chibi.webp'); } catch { CHIBI = null; }
  ims.forEach((im,i) => TER[i].im = im); IMG.day = day; IMG.night = nightImg; BMETA = bm; PMETA = pm;
  bkeys.forEach((k,i) => { BIMG[k] = bimgs[i]; BIMG[k+'-night'] = nights[i]; }); pkeys.forEach((k,i) => PIMG[k] = pimgs[i]);
  buildWorld(); resize(); addEventListener('resize', () => { resize(); clampCam(); }); bindInput();
  ready = true; sync(model); setMode(mode, false);
  let last = performance.now(), lastSlow = 0;
  const frame = now => { const dt = Math.min(.05, (now-last)/1000); last = now; T += dt;
    if (document.hidden || !opts.visible()){ last = now; requestAnimationFrame(frame); return; }
    if (reducedMotion && now - lastSlow < 66){ requestAnimationFrame(frame); return; } lastSlow = now;
    for (const a of agents.values()) stepAgent(a, dt);
    for (let i=puffs.length-1;i>=0;i--){ const p = puffs[i]; p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 260*dt; if (p.t > .75) puffs.splice(i,1); }
    if (follow){ if (!agents.has(follow.id)) follow = null; else { const ti = tierOf(follow); if (tierMode[ti] !== mode){ mode = tierMode[ti]; opts.onMode && opts.onMode(mode); }
      cam.x += (follow.x-cam.x)*Math.min(1, dt*3); cam.y += (follow.y-60-cam.y)*Math.min(1, dt*3); clampCam();
      if (!follow.moving && !follow.route.length && !follow.tgt && follow.drop===0){ follow.idleT = (follow.idleT||0) + dt; if (follow.idleT > .8){ follow.idleT = 0; follow = null; } } else follow.idleT = 0; } }
    else if (fly){ fly.t = Math.min(1, fly.t + dt*1.6); const e = 1-Math.pow(1-fly.t,3); cam.x = fly.x0+(fly.x1-fly.x0)*e; cam.y = fly.y0+(fly.y1-fly.y0)*e; cam.s = fly.s0+(fly.s1-fly.s0)*e; clampCam(); if (fly.t>=1) fly = null; }
    else if (gesture && gesture.type==='drag' && gesture.edge && (gesture.edge.vx || gesture.edge.vy)){ cam.x += gesture.edge.vx*300*dt/cam.s; cam.y += gesture.edge.vy*300*dt/cam.s; clampCam(); }
    else if (!gesture && (Math.abs(vel.x)+Math.abs(vel.y)) > .3){ cam.x -= vel.x/cam.s; cam.y -= vel.y/cam.s; vel.x *= Math.pow(.02, dt); vel.y *= Math.pow(.02, dt); clampCam(); }
    for (let i=0;i<4;i++){ const on = tierMode[i]===mode || i===hoverTier || (follow && tierOf(follow)===i); tierA[i] += ((on ? 1 : DIM) - tierA[i]) * Math.min(1, dt*6); }
    stepFX(dt); draw(); layout(); stepTalk(dt); if (opts.debug) drawDebug(); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function drawDebug(){ ctx.save(); for (let i=0;i<400;i++){ const q = roamPoint({x:0,y:0}); if (!q) continue; const [x,y] = w2s(q.x,q.y); ctx.fillStyle = 'rgba(0,120,255,.6)'; ctx.fillRect(x-2,y-2,4,4); } ctx.lineWidth = 2; for (const n of nodes){ for (const m of n.adj){ const [a,b] = w2s(n.x,n.y), [c,d] = w2s(m.x,m.y); ctx.strokeStyle = 'rgba(255,0,0,.7)'; ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.stroke(); } const [x,y] = w2s(n.x,n.y); ctx.fillStyle = '#f00'; ctx.fillRect(x-4,y-4,8,8); } ctx.restore(); }
