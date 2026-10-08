// Procedural pixel "thought clouds": coloured cloud bodies with expressive faces.
const W = 30, H = 22;
const SHAPES = [
  [[9,13,6],[15,9,7.5],[21,12.5,6],[15,15,7.5],[6,16,4],[24,16,4]],
  [[8,14,5.5],[13,9,6],[19,8.5,6.5],[23,14,5.5],[15,15,8]],
  [[10,11,6.5],[18,10,7],[24,15,4.5],[6,15,4.5],[15,16,7.5]],
  [[7,15,5],[12,10,5.5],[17,7.5,6],[22,11,5.5],[15,16,8],[25,16,3.5]],
];
const cache = new Map();
const hex = c => { c = c.replace('#',''); if (c.length===3) c = c.split('').map(x=>x+x).join(''); return [0,2,4].map(i => parseInt(c.slice(i,i+2),16)); };
const mix = (a, b, t) => a.map((v,i) => Math.round(v + (b[i]-v)*t));
const css = c => `rgb(${c[0]},${c[1]},${c[2]})`;
function hsl(h, s, l){ s/=100; l/=100; const k = n => (n + h/30) % 12, a = s*Math.min(l, 1-l), f = n => l - a*Math.max(-1, Math.min(k(n)-3, 9-k(n), 1)); return [f(0), f(8), f(4)].map(v => Math.round(v*255)); }
export function hashId(id){ let h = 2166136261; for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
// Colour for a task's cloud: unsorted thoughts get their own pastel; planned ones take their list colour.
export function cloudColor(item, listColor, id){
  const seed = hashId(id);
  if (item.state==='loose' || !listColor){ const pal = [[350,80,82],[20,85,80],[45,90,76],[150,55,78],[190,65,78],[220,75,82],[265,65,84],[300,55,84]]; const p = pal[seed % pal.length]; return hsl(p[0], p[1], p[2]); }
  let c = mix(hex(listColor), [255,255,255], item.state==='done' ? .5 : .42);
  if (item.state==='done') c = mix(c, [215,205,230], .18);
  if (item.overdue && item.state!=='done') c = mix(c, [150,155,170], .28);
  return c;
}
// expression: calm | happy | wow | worried | sleepy | blink ; look: -1 | 0 | 1 ; back: no face
export function cloudSprite(rgb, shape, expr, look, back, mini){
  const key = rgb.join(',') + '|' + shape + expr + look + (back?1:0) + (mini?1:0);
  let cv = cache.get(key); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const bumps = SHAPES[shape % SHAPES.length];
  const inside = (x, y) => y <= 19.5 && bumps.some(([cx,cy,r]) => (x+.5-cx)**2 + (y+.5-cy)**2 <= r*r);
  const fill = Array.from({length:H}, (_, y) => Array.from({length:W}, (_, x) => inside(x, y)));
  const at = (x, y) => x>=0 && y>=0 && x<W && y<H && fill[y][x];
  const base = rgb, light = mix(rgb, [255,255,255], .62), shade = mix(rgb, [70,74,120], .28), deep = mix(rgb, [50,48,90], .45), line = mix(rgb, [27,24,34], .86);
  const px = (x, y, c) => { g.fillStyle = typeof c === 'string' ? c : css(c); g.fillRect(x, y, 1, 1); };
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    if (fill[y][x]){
      let c = base;
      if (!at(x, y+2) || y >= 18) c = shade;
      if (!at(x, y+1)) c = deep;
      if (!at(x, y-2) || !at(x-2, y-1)) c = light;
      if (!at(x, y-1)) c = mix(light, [255,255,255], .4);
      px(x, y, c);
    } else if (at(x-1,y) || at(x+1,y) || at(x,y-1) || at(x,y+1)) px(x, y, line);
  }
  if (!back){
    const ink = '#2a2433', cx = 15 + look, ey = 12;
    const L = cx - 3, R = cx + 3;
    const dot = (x, y) => { px(x, y, ink); px(x, y+1, ink); };
    if (expr==='happy' || expr==='cheer'){ for (const e of [L, R]){ px(e-1, ey+1, ink); px(e, ey, ink); px(e+1, ey+1, ink); }
      px(cx-2, ey+3, ink); px(cx+2, ey+3, ink); for (let x=cx-1;x<=cx+1;x++){ px(x, ey+3, ink); px(x, ey+4, x===cx ? '#e8707e' : ink); } }
    else if (expr==='wow'){ for (const e of [L, R]){ px(e, ey-1, ink); px(e+1, ey-1, ink); px(e, ey, ink); px(e+1, ey, '#ffffff'); } px(cx, ey+3, ink); px(cx+1, ey+3, ink); px(cx, ey+4, ink); px(cx+1, ey+4, ink); }
    else if (expr==='worried'){ dot(L, ey); dot(R, ey); px(L-1, ey-2, ink); px(L, ey-3, ink); px(R+1, ey-2, ink); px(R, ey-3, ink);
      px(cx-2, ey+4, ink); px(cx-1, ey+3, ink); px(cx, ey+4, ink); px(cx+1, ey+3, ink); px(cx+2, ey+4, ink); }
    else if (expr==='sleepy' || expr==='blink'){ for (const e of [L, R]){ px(e-1, ey+1, ink); px(e, ey+1, ink); px(e+1, ey+1, ink); } if (expr==='sleepy') px(cx, ey+4, ink); else { px(cx-1, ey+3, ink); px(cx, ey+4, ink); px(cx+1, ey+3, ink); } }
    else { dot(L, ey); dot(R, ey); px(cx-1, ey+3, ink); px(cx, ey+4, ink); px(cx+1, ey+3, ink); }
    if (!mini && expr!=='sleepy'){ g.fillStyle = 'rgba(240,110,130,.55)'; g.fillRect(L-3, ey+2, 2, 1); g.fillRect(R+2, ey+2, 2, 1); }
  }
  cache.set(key, cv); return cv;
}
