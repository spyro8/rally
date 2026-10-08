// SPYR MIND · generated chibi villagers, v2. 24×32 pixel grid, feet on row 31.
// Views: 0 front, 1 right, 2 back, 3 left (mirror of right).
// Poses: idle, walk0-3, wave, sit, panic0/1.

const GW = 24, GH = 32;
const SKIN = ['#FDE0C8','#F4C7A1','#E2A87F','#C68A5E','#A0653F','#7A4A2C','#58321D'];
const HAIRC = ['#231C22','#3A2A24','#5C3A26','#8A5530','#B97A3E','#E0B062','#F2DDA4','#C2462F','#8E8F98','#EDE6DA','#2F3F6B','#6B3A7A','#2E6B5E','#D9668A'];
const CLOTH = ['#E5484D','#E5734F','#F2A93B','#E8CF57','#7CB55A','#2F9E6B','#2C9AA8','#4C8DE0','#3E63DD','#5B5BD6','#8E4EC6','#D6409F','#F4F1EA','#2E2E36','#8A6B4E','#C9B79C','#6E8B3D','#9B2C3A','#1F4E79','#F2C3CF'];
const DENIM = ['#3B5B8C','#2C4570','#5A79A8','#26324A'];
const PANTC = ['#2F3A4A','#3B3B44','#4A3B30','#6C6F78','#8A6B4E','#C9B79C','#1F2733','#4B5A3A'];
const HAIRS = ['short','messy','long','wavy','bun','topknot','pony','twintails','bob','buzz','afro','curly','spiky','braids','sidepart','undercut','mohawk','bald'];
const TOPS = ['tee','tee','polo','shirt','hoodie','jacket','blazer','sweater','cardigan','vest','stripe','dress','overalls','tank'];
const BOTTOMS = ['jeans','jeans','chinos','pants','shorts','skirt','joggers'];
const HATS = ['none','none','none','none','none','none','cap','capback','beanie','sunhat','bucket','beret','band','flower'];
const SHOES = ['sneaker','sneaker','boot','loafer','hightop','sandal'];
const EYEWEAR = ['none','none','none','none','none','none','none','none','none','none','none','none','none','round','square','shades','shades2'];

const rnd = seed => { let h = seed >>> 0; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
const pickR = (r, a) => a[Math.floor(r()*a.length)];
export function makeLook(id){
  let h = 2166136261; for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const r = rnd(h);
  const L = { key:String(h>>>0), skin:pickR(r,SKIN), hairC:pickR(r,HAIRC), hair:pickR(r,HAIRS), top:pickR(r,TOPS), topC:pickR(r,CLOTH), top2:pickR(r,CLOTH), accent:pickR(r,CLOTH),
    bottom:pickR(r,BOTTOMS), shoe:pickR(r,SHOES), shoeC:pickR(r,['#F4F1EA','#2E2E36','#E5484D','#3E63DD','#8A6B4E','#5A3A24','#2F9E6B']),
    hat:pickR(r,HATS), hatC:pickR(r,CLOTH), eyewear:pickR(r,EYEWEAR), eyes:pickR(r,['dot','dot','dot','shine','happy','lash']),
    beard: r() < .12 ? pickR(r,['stubble','stubble','full','moustache']) : 'none', freckles:r() < .14, earring:r() < .16, headphones:r() < .08,
    pack:r() < .18, packC:pickR(r,['#8A6B4E','#5A3A24','#3E63DD','#E5734F','#2F9E6B','#2E2E36']), strap:r() < .16, scarf:r() < .1, scarfC:pickR(r,CLOTH), necklace:r() < .12, tie:r() < .5 };
  L.bottomC = L.bottom==='jeans' ? pickR(r,DENIM) : L.bottom==='skirt' ? pickR(r,CLOTH) : pickR(r,PANTC);
  if (L.top==='dress' || L.top==='overalls') L.bottom = L.top==='dress' ? 'none' : 'jeans';
  if (L.top==='overalls') L.bottomC = pickR(r,DENIM);
  if (L.hair==='bald' && L.hat==='none' && r() < .4) L.hat = 'cap';
  if (L.hat!=='none') L.headphones = false;
  return L;
}

/* ---------- colour ---------- */
const hex = c => { if (c[0]==='#'){ const n = parseInt(c.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; } return c.match(/\d+/g).map(Number); };
const sh = (c, f) => { const [r,g,b] = hex(c); const m = v => Math.max(0,Math.min(255,Math.round(v*f))); return `rgb(${m(r)},${m(g)},${m(b)})`; };
const lt = (c, a) => { const [r,g,b] = hex(c); const m = v => Math.round(v + (255-v)*a); return `rgb(${m(r)},${m(g)},${m(b)})`; };
const OUT = '#1b1822', EYE = '#1b1822', WHITE = '#FFFFFF', GOLD = '#E8C35A';

const cache = new Map();
export function frame(look, view, pose){
  const key = look.key+'|'+view+'|'+pose; let c = cache.get(key); if (c) return c;
  const flip = view===3, v = flip ? 1 : view;
  const G = Array.from({length:GH}, () => new Array(GW).fill(null));
  const P = (x, y, col) => { x = Math.round(x); y = Math.round(y); if (col && x>=0 && x<GW && y>=0 && y<GH) G[y][x] = col; };
  const X = (x, y) => { x = Math.round(x); y = Math.round(y); if (x>=0 && x<GW && y>=0 && y<GH) G[y][x] = null; };
  const R = (x, y, w, h, col) => { for (let j=0;j<h;j++) for (let i=0;i<w;i++) P(x+i, y+j, col); };
  const E = (cx, cy, rx, ry, col, test) => { for (let y=Math.floor(cy-ry); y<=Math.ceil(cy+ry); y++) for (let x=Math.floor(cx-rx); x<=Math.ceil(cx+rx); x++){ if (((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1 && (!test || test(x,y))) P(x, y, col); } };
  const at = (x, y) => (y>=0 && y<GH && x>=0 && x<GW) ? G[y][x] : null;

  const sit = pose==='sit', wave = pose==='wave', panic = pose==='panic0' || pose==='panic1';
  const wf = pose.startsWith('walk') ? Number(pose[4]) : -1;
  const dy = (sit ? 4 : 0) + ((wf===1 || wf===3) ? 1 : 0);
  const S = look.skin, SD = sh(S,.86), SL = lt(S,.18);
  const HC = look.hairC, HD = sh(HC,.7), HL = lt(HC,.28);
  const TC = look.topC, TD = sh(TC,.76), TL = lt(TC,.2);
  const T2 = look.top2, T2D = sh(T2,.8);
  const BC = look.bottomC, BD = sh(BC,.78), BL = lt(BC,.18);
  const cx = 11.5, tY = 14 + dy, hY = 7.5 + dy, legY = 23 + dy;

  /* ===== BEHIND ===== */
  const H = look.hair;
  if (v!==2){
    if (H==='long' || H==='wavy'){ if (v===0){ R(4, hY, 3, 11, HD); R(17, hY, 3, 11, HD); } else R(5, hY-1, 5, 12, HD); }
    if (H==='braids' && v===1) R(6, hY, 3, 11, HD);
    if (H==='twintails'){ if (v===0){ E(3.5, hY+4, 2, 4, HC); E(19.5, hY+4, 2, 4, HC); } else E(6, hY+4, 2, 4.2, HC); }
    if (H==='pony' && v===1){ R(4, hY-2, 3, 2, HC); E(4.5, hY+3, 1.8, 4.5, HC); }
  }
  if (H==='afro') E(cx, hY-.5, 9.6, 8.4, HC);
  if (H==='curly') E(cx, hY-.5, 8.6, 7.6, HC);
  if (look.pack && v===1){ R(4, tY+1, 5, 8, look.packC); R(4, tY+1, 1, 8, sh(look.packC,.75)); R(5, tY+3, 3, 1, sh(look.packC,.8)); }

  /* ===== LEGS & SHOES ===== */
  const legC = ['shorts','skirt','none'].includes(look.bottom) ? S : BC, legD = legC===S ? SD : BD;
  const shoe = (x, y, w, facing) => { const sc = look.shoeC, scD = sh(sc,.75);
    switch (look.shoe){
      case 'boot': R(x, y-2, w, 2, '#5A3A24'); R(x, y, w, 2, '#4A2E1C'); break;
      case 'hightop': R(x, y-1, w, 1, sc); R(x, y, w, 1, sc); R(x, y+1, w, 1, '#F4F1EA'); break;
      case 'loafer': R(x, y, w, 1, '#3A2A24'); R(x, y+1, w, 1, '#2A1E1A'); break;
      case 'sandal': R(x, y, w, 1, S); P(x+Math.floor(w/2), y, '#8A6B4E'); R(x, y+1, w, 1, '#8A6B4E'); break;
      default: R(x, y, w, 1, sc); if (facing) P(facing>0 ? x+w-1 : x, y, scD); R(x, y+1, w, 1, '#F4F1EA'); } };
  if (sit){
    if (v===1){ R(9, legY-1, 7, 3, legC); R(9, legY+1, 7, 1, legD); shoe(15, legY-1, 3, 1); }
    else if (v===0){ R(7, legY, 4, 3, legC); R(13, legY, 4, 3, legD); shoe(7, legY+3, 4, 0); shoe(13, legY+3, 4, 0); }
    else { R(7, legY, 4, 2, legC); R(13, legY, 4, 2, legD); }
  } else if (v===1){
    const sw = [0, 2, 0, -2][Math.max(0, wf)] || 0;
    for (let j=0;j<6;j++){ const o = Math.round(sw*j/6); P(10+o, legY+j, legD); P(11+o, legY+j, legD); }
    for (let j=0;j<6;j++){ const o = Math.round(-sw*j/6); P(11+o, legY+j, legC); P(12+o, legY+j, legC); if (legC!==S) P(12+o, legY+j, BL); }
    shoe(10+sw, legY+6, 3, 1); shoe(11-sw, legY+6, 3, 1);
  } else {
    const lu = wf===1 ? -1 : 0, ru = wf===3 ? -1 : 0;
    R(8, legY, 3, 6+lu, legC); R(13, legY, 3, 6+ru, legD);
    if (legC!==S){ R(8, legY, 1, 6+lu, BL); }
    shoe(7, legY+6+lu, 4, -1); shoe(13, legY+6+ru, 4, 1);
  }
  if (look.bottom==='shorts' && !sit){ if (v===1){ R(10, legY, 4, 3, BC); } else { R(8, legY, 3, 3, BC); R(13, legY, 3, 3, BD); } }
  if (look.bottom==='joggers' && !sit && v===0){ R(8, legY+5, 3, 1, BD); R(13, legY+5, 3, 1, BD); P(10, legY+1, '#F4F1EA'); P(10, legY+2, '#F4F1EA'); P(10, legY+3, '#F4F1EA'); }

  /* ===== TORSO ===== */
  const W0 = v===1 ? 8 : 7, WW = v===1 ? 7 : 10;
  R(W0, tY, WW, 9, TC); R(W0+WW-2, tY+1, 2, 8, TD); R(W0, tY+1, 1, 7, TL);
  if (v!==1){ X(W0, tY); X(W0+WW-1, tY); }
  // bottom piece showing under top (waist)
  if (look.bottom==='skirt' && !sit){ if (v===1){ R(8, tY+8, 8, 3, BC); R(14, tY+9, 2, 2, BD); } else { R(6, tY+8, 12, 3, BC); R(16, tY+8, 2, 3, BD); R(6, tY+10, 12, 1, BD); } }
  else if (look.bottom!=='none' && look.top!=='dress'){ R(W0, tY+8, WW, 1, BD); if (v===0 && ['tee','polo','shirt','tank'].includes(look.top)) { R(W0, tY+8, WW, 1, '#3A2A24'); P(11, tY+8, GOLD); P(12, tY+8, GOLD); } }
  const front = v===0, side = v===1, back = v===2;
  switch (look.top){
    case 'tee': if (front){ R(10, tY, 4, 1, S); R(11, tY+1, 2, 1, SD); } break;
    case 'tank': if (front){ R(9, tY, 6, 2, S); R(10, tY+2, 4, 1, SD); } break;
    case 'polo': if (front){ P(9, tY, lt(TC,.45)); P(10, tY, lt(TC,.45)); P(13, tY, lt(TC,.45)); P(14, tY, lt(TC,.45)); R(11, tY, 2, 3, TD); P(11, tY+1, WHITE); P(11, tY+3, TD); } if (side) R(11, tY, 3, 1, lt(TC,.4)); break;
    case 'shirt': if (front){ P(9, tY, WHITE); P(10, tY, WHITE); P(13, tY, WHITE); P(14, tY, WHITE); R(11, tY, 2, 8, TD); for (let j=1;j<8;j+=2) P(11, tY+j, lt(TC,.6)); P(9, tY+3, TD); } if (side) R(11, tY, 3, 1, WHITE); break;
    case 'hoodie': if (front){ R(9, tY, 6, 2, TD); P(10, tY+2, WHITE); P(13, tY+2, WHITE); P(10, tY+3, WHITE); P(13, tY+3, WHITE); R(9, tY+5, 6, 2, TD); } if (back) R(8, tY-1, 8, 3, TD); if (side) R(8, tY-1, 4, 3, TD); break;
    case 'jacket': if (front){ R(10, tY, 4, 9, T2); R(11, tY+1, 2, 7, T2D); P(10, tY, TD); P(13, tY, TD); for (let j=1;j<8;j++){ P(10, tY+j, TD); P(13, tY+j, TD); } P(12, tY+2, '#C9C9CF'); } if (side) R(13, tY+1, 1, 8, T2); break;
    case 'blazer': if (front){ R(10, tY, 4, 8, WHITE); R(11, tY, 2, 1, '#E8E6E0'); P(9, tY+1, TD); P(10, tY+2, TD); P(14, tY+1, TD); P(13, tY+2, TD); if (look.tie){ R(11, tY+1, 2, 5, look.accent); P(11, tY+6, sh(look.accent,.75)); } P(9, tY+5, GOLD); } if (side) R(13, tY, 1, 6, WHITE); break;
    case 'sweater': if (front || back){ R(7, tY+7, 10, 1, TD); for (let x=7;x<17;x+=2) P(x, tY+7, sh(TC,.68)); R(10, tY, 4, 1, TD); } if (front){ for (let j=2;j<6;j++) for (let x=8;x<16;x+=3) P(x+(j%2), tY+j, lt(TC,.12)); } break;
    case 'cardigan': if (front){ R(10, tY, 4, 8, T2); R(10, tY, 1, 8, TD); R(13, tY, 1, 8, TD); P(14, tY+2, lt(TC,.5)); P(14, tY+4, lt(TC,.5)); P(14, tY+6, lt(TC,.5)); } break;
    case 'vest': { const sl = T2; if (front){ R(10, tY, 4, 1, S); for (let j=2;j<8;j+=2) R(7, tY+j, 10, 1, TD); R(11, tY, 2, 8, sh(TC,.7)); } else { for (let j=2;j<8;j+=2) R(W0, tY+j, WW, 1, TD); } break; }
    case 'stripe': for (let j=1;j<8;j+=2) R(W0, tY+j, WW, 1, T2); if (front) R(10, tY, 4, 1, S); break;
    case 'dress': if (side){ R(7, tY+5, 9, 5, TC); R(14, tY+5, 2, 5, TD); R(7, tY+9, 9, 1, TD); } else { R(6, tY+5, 12, 5, TC); R(16, tY+5, 2, 5, TD); R(6, tY+5, 1, 5, TL); R(6, tY+9, 12, 1, TD); R(7, tY+4, 10, 1, look.accent); } if (front){ R(10, tY, 4, 1, S); } break;
    case 'overalls': if (front){ R(8, tY+3, 8, 6, BC); R(8, tY, 1, 3, BC); R(15, tY, 1, 3, BC); P(9, tY+3, GOLD); P(14, tY+3, GOLD); R(10, tY+5, 4, 2, BD); } else if (side){ R(8, tY+3, 7, 6, BC); R(12, tY, 1, 3, BC); } else { R(8, tY+2, 8, 7, BC); R(9, tY, 1, 2, BC); R(14, tY, 1, 2, BC); } break;
  }
  if (look.necklace && front && ['tee','tank','dress','sweater'].includes(look.top)){ P(10, tY+1, GOLD); P(11, tY+2, GOLD); P(12, tY+2, GOLD); P(13, tY+1, GOLD); }
  if (look.scarf && !back){ R(W0, tY, WW, 2, look.scarfC); R(W0, tY+1, WW, 1, sh(look.scarfC,.82)); if (front){ R(13, tY+2, 2, 4, look.scarfC); P(13, tY+5, sh(look.scarfC,.7)); } }
  if (look.pack && back){ R(8, tY+1, 8, 8, look.packC); R(8, tY+1, 8, 1, lt(look.packC,.2)); R(9, tY+4, 6, 3, sh(look.packC,.82)); P(11, tY+4, GOLD); }
  if (look.pack && front){ R(7, tY+1, 1, 4, sh(look.packC,.8)); R(16, tY+1, 1, 4, sh(look.packC,.8)); }
  if (look.strap && front){ for (let j=0;j<8;j++) P(9+j, tY+j, '#5A3A24'); R(15, tY+6, 3, 3, '#8A6B4E'); P(16, tY+7, GOLD); }

  /* ===== ARMS ===== */
  const sleeveLen = ['tee','polo','dress','overalls'].includes(look.top) ? 2 : look.top==='tank' ? 0 : look.top==='vest' ? 7 : 7;
  const sleeve = look.top==='vest' ? T2 : look.top==='overalls' ? T2 : TC, sleeveD = sh(sleeve,.76);
  const armPx = (x, y, j, n, dark) => { const sk = j >= sleeveLen; P(x, y, j===n-1 ? (dark ? SD : S) : sk ? (dark ? SD : S) : (dark ? sleeveD : sleeve)); };
  if (panic){ const up = pose==='panic1' ? 1 : 0; for (let j=0;j<7;j++){ armPx(5, tY-5+j+up, 6-j, 7, false); armPx(18, tY-5+j+up, 6-j, 7, true); } }
  else if (side){ const sw = sit ? 2 : [0, 2, 0, -2][Math.max(0, wf)] || 0; const ac = sh(sleeve,.7);
    for (let j=0;j<7;j++){ const x = 11 + Math.round(-sw*j/6); const sk = j >= sleeveLen || j===6; P(x, tY+j, sk ? SD : ac); P(x+1, tY+j, sk ? S : sleeveD); P(x-1, tY+j, OUT); P(x+2, tY+j, OUT); } }
  else {
    const sw = wf===1 ? 1 : wf===3 ? -1 : 0;
    if (sit){ for (let j=0;j<6;j++){ armPx(6, tY+1+j, j, 6, false); armPx(17, tY+1+j, j, 6, true); } }
    else { for (let j=0;j<7;j++){ armPx(5, tY+1+j-sw, j, 7, false); armPx(6, tY+1+j-sw, j, 7, true); } }
    if (wave && front){ for (let j=0;j<7;j++){ armPx(18, tY-5+j, 6-j, 7, false); armPx(17, tY-4+j, 6-j, 7, true); } P(19, tY-7, S); P(17, tY-7, S); }
    else if (!sit){ for (let j=0;j<7;j++){ armPx(18, tY+1+j+sw, j, 7, true); armPx(17, tY+1+j+sw, j, 7, false); } }
  }

  /* ===== HEAD ===== */
  E(cx, hY, 7, 6.6, S);
  if (!back){ E(cx+3.6, hY+1, 3.4, 5.2, SD, (x,y) => x > cx+3); E(cx-3, hY-2, 2.4, 2, SL, (x,y) => true); }
  if (back) E(cx, hY, 7, 6.6, S);
  // ears
  if (front){ P(4, Math.round(hY+1), SD); P(19, Math.round(hY+1), SD); if (look.earring){ P(4, Math.round(hY+2), GOLD); P(19, Math.round(hY+2), GOLD); } }
  if (side){ P(8, Math.round(hY+1), SD); P(8, Math.round(hY+2), SD); if (look.earring) P(8, Math.round(hY+3), GOLD); }
  // face
  const ey = Math.round(hY + 1.5);
  if (front){
    const eye = (x) => { switch (look.eyes){
      case 'happy': P(x, ey+1, EYE); P(x+1, ey, EYE); break;
      case 'shine': R(x, ey, 2, 2, EYE); P(x, ey, WHITE); P(x+1, ey+1, '#5a5f80'); break;
      case 'lash': R(x, ey, 2, 2, EYE); P(x, ey, WHITE); P(x-1+(x>11?3:0), ey-1, EYE); break;
      default: R(x, ey, 2, 2, EYE); P(x, ey, WHITE); } };
    eye(8); eye(14);
    if (H!=='bald' && look.eyewear==='none' && (look.eyes==='dot' || look.eyes==='lash')) { P(8, ey-2, HC); P(9, ey-2, HC); P(14, ey-2, HC); P(15, ey-2, HC); }
    P(7, ey+2, '#EE9A9A'); P(16, ey+2, '#EE9A9A');
    if (look.freckles){ P(8, ey+3, SD); P(10, ey+2, SD); P(14, ey+3, SD); P(15, ey+2, SD); }
    if (panic) R(11, ey+3, 2, 2, '#7a2f35'); else if (wave || sit || look.eyes==='happy') { P(11, ey+3, sh(S,.55)); P(12, ey+3, sh(S,.55)); P(10, ey+2, null); }
    else P(11, ey+3, sh(S,.62)), P(12, ey+3, sh(S,.62));
    if (look.beard==='full'){ for (let x=6;x<=17;x++) for (let y=ey+3;y<=Math.round(hY+6);y++){ const d = ((x-cx)/7)**2 + ((y-hY)/6.6)**2; if (d<=1 && !(x>=11&&x<=12&&y===ey+3)) P(x, y, HC); } R(11, ey+3, 2, 1, '#7a3f3f'); }
    if (look.beard==='moustache'){ R(10, ey+2, 4, 1, HC); }
    if (look.beard==='stubble'){ for (let x=7;x<=16;x+=2) P(x, ey+5, SD); P(9, ey+4, SD); P(14, ey+4, SD); }
  }
  if (side){ R(15, ey, 2, 2, EYE); P(15, ey, WHITE);  P(17, ey+2, '#EE9A9A'); P(18, ey+1, S); P(19, ey+1, SD);
    if (panic) R(16, ey+3, 2, 1, '#7a2f35'); if (look.beard==='full') R(12, ey+3, 6, 3, HC); if (look.beard==='moustache') R(16, ey+2, 3, 1, HC); }

  /* ===== HAIR ===== */
  const cap = (lim, bang) => E(cx, hY, 7.3, 6.9, HC, (x,y) => y <= hY - 6.9 + lim + (bang ? bang(x) : 0));
  if (back){
    if (H!=='bald' && H!=='buzz') E(cx, hY, 7.3, 6.9, HC);
    if (H==='buzz') E(cx, hY, 7.1, 6.7, sh(HC,.9));
    if (H==='undercut') { E(cx, hY, 7.3, 6.9, sh(S,.8), (x,y) => y > hY+1); }
    if (H==='long' || H==='braids' || H==='wavy'){ R(5, hY+3, 14, 6, HC); if (H==='wavy') for (let x=5;x<19;x+=2) P(x, hY+9, HC); }
    if (H==='bob') R(5, hY+3, 14, 3, HC);
    if (H==='pony'){ R(10, hY+4, 4, 7, HC); R(10, hY+3, 4, 1, look.accent); }
    if (H==='bun' || H==='topknot') E(cx, hY-7.5, 2.6, 2.3, HC);
    if (H==='twintails'){ E(3.5, hY+4, 2, 4, HC); E(19.5, hY+4, 2, 4, HC); }
    E(cx-2, hY-3, 3.4, 2.4, HL, (x,y) => at(x,y)===HC);
  } else {
    switch (H){
      case 'short': cap(5, x => (x%3===0 ? 1 : 0)); break;
      case 'messy': cap(5, x => [1,0,2,0,1,2,0][x%7]); P(9, hY-8, HC); P(14, hY-8, HC); P(12, hY-8.5, HC); break;
      case 'long': cap(5, x => (side && x>cx+2) ? 0 : (x%4===1 ? 1 : 0)); if (front){ R(4, hY-2, 2, 12, HC); R(18, hY-2, 2, 12, HC); } if (side) R(5, hY-2, 4, 12, HC); break;
      case 'wavy': cap(5, x => x%3===0 ? 2 : 0); if (front){ for (let j=0;j<12;j++){ P(4+(j%3===1?-1:0), hY-2+j, HC); P(5, hY-2+j, HC); P(18, hY-2+j, HC); P(19+(j%3===1?1:0), hY-2+j, HC); } } if (side) for (let j=0;j<12;j++) R(5+(j%3===1?-1:0), hY-2+j, 4, 1, HC); break;
      case 'bun': cap(5, x => x%3===0 ? 1 : 0); E(cx + (side ? -2 : 0), hY-7.6, 2.6, 2.3, HC); R(Math.round(cx)-2+(side?-2:0), Math.round(hY-5.6), 4, 1, look.accent); break;
      case 'topknot': cap(4, x => x>=10 && x<=13 ? 0 : 1); E(cx, hY-8.2, 1.8, 1.8, HC); break;
      case 'pony': cap(5, x => x%3===1 ? 1 : 0); if (front){ P(18, hY-2, HC); P(19, hY-1, HC); P(19, hY, HC); } break;
      case 'twintails': cap(5, x => x>=10 && x<=13 ? 2 : 0); if (front){ P(5, hY-3, look.accent); P(18, hY-3, look.accent); } break;
      case 'bob': cap(5, x => x>=cx-3 && x<=cx+3 ? 2 : 0); if (front){ R(4, hY-2, 2, 8, HC); R(18, hY-2, 2, 8, HC); } if (side) R(5, hY-2, 4, 8, HC); break;
      case 'buzz': cap(3); break;
      case 'afro': cap(5, x => 1); break;
      case 'curly': cap(5, x => (x%2)*2); P(5, hY, HC); P(18, hY, HC); P(4, hY+2, HC); P(19, hY+2, HC); break;
      case 'spiky': cap(4); for (let x=6;x<=17;x+=2){ P(x, hY-8, HC); P(x+1, hY-9, HC); } break;
      case 'braids': cap(5, x => x%4===2 ? 1 : 0); if (front){ for (let j=0;j<12;j++){ P(5, hY+j, j%2 ? HC : HD); P(18, hY+j, j%2 ? HC : HD); } P(5, hY+12, look.accent); P(18, hY+12, look.accent); } break;
      case 'sidepart': cap(4, x => x < cx-1 ? 2 : x < cx+3 ? 1 : 0); if (front) R(5, hY-3, 2, 4, HC); break;
      case 'undercut': cap(4, x => x < cx+1 ? 2 : 0); if (front){ R(5, hY-2, 1, 3, sh(S,.8)); R(18, hY-2, 1, 3, sh(S,.8)); } break;
      case 'mohawk': R(10, Math.round(hY-9), 4, 6, HC); R(10, Math.round(hY-9), 4, 1, HL); E(cx, hY, 7.2, 6.8, sh(S,.84), (x,y) => y <= hY-4 && (x<10 || x>13)); break;
    }
    if (H!=='bald' && H!=='buzz' && H!=='mohawk') E(cx-2.6, hY-5.2, 2.6, 1.2, HL, (x,y) => at(x,y)===HC);
  }

  /* ===== HEADWEAR / EYEWEAR ===== */
  const hc = look.hatC, hcD = sh(hc,.74), hcL = lt(hc,.25), yy = Math.round(hY);
  switch (look.hat){
    case 'cap': E(cx, hY-1, 7.4, 6.4, hc, (x,y) => y <= hY-3); E(cx-2.5, hY-5.5, 2.4, 1, hcL, (x,y) => at(x,y)===hc); if (front) R(5, yy-3, 14, 1, hcD); if (side) R(15, yy-3, 6, 1, hcD); if (back) R(9, yy-3, 6, 1, hcD); P(Math.round(cx), yy-8, hcD); break;
    case 'capback': E(cx, hY-1, 7.4, 6.4, hc, (x,y) => y <= hY-3); if (front){ R(9, yy-4, 6, 1, hcD); } if (side) R(3, yy-3, 5, 1, hcD); if (back) R(5, yy-3, 14, 1, hcD); break;
    case 'beanie': E(cx, hY-1, 7.6, 6.7, hc, (x,y) => y <= hY-2); R(4, yy-2, 16, 2, hcD); for (let x=5;x<19;x+=2) P(x, yy-2, sh(hc,.62)); E(cx, hY-9, 1.6, 1.4, '#F4F1EA'); break;
    case 'sunhat': R(1, yy-3, 22, 2, hc); R(1, yy-2, 22, 1, hcD); E(cx, hY-5, 5.5, 3.6, hc, (x,y) => y <= hY-3); R(6, yy-4, 12, 1, look.accent); break;
    case 'bucket': E(cx, hY-3.5, 6.4, 4.5, hc, (x,y) => y <= hY-2); R(3, yy-2, 18, 2, hcD); R(3, yy-1, 18, 1, sh(hc,.62)); break;
    case 'beret': E(cx+ (side ? -1 : 0), hY-5.5, 7.4, 2.8, hc); P(Math.round(cx), yy-9, hcD); E(cx-2, hY-6.5, 2.4, 1, hcL, (x,y) => at(x,y)===hc); break;
    case 'band': if (H!=='bald'){ R(4, yy-3, 16, 1, hc); if (front) P(17, yy-4, hc); } break;
    case 'flower': if (!back){ const fx = front ? 16 : 10; P(fx, yy-4, '#F4F1EA'); P(fx+1, yy-5, '#F4F1EA'); P(fx-1, yy-5, '#F4F1EA'); P(fx, yy-6, '#F4F1EA'); P(fx, yy-5, GOLD); } break;
  }
  if (look.headphones && !back){ if (front){ for (let x=5;x<=18;x++) if (at(x, yy-7) || x===5 || x===18) {} E(cx, hY-1, 7.8, 7.2, '#2E2E36', (x,y) => y < hY-5 && ((x-cx)/7.8)**2 + ((y-hY+1)/7.2)**2 > .78); R(3, yy-1, 2, 4, '#2E2E36'); R(19, yy-1, 2, 4, '#2E2E36'); P(3, yy, look.accent); P(20, yy, look.accent); } else { R(8, yy-1, 3, 4, '#2E2E36'); P(9, yy, look.accent); } }
  const ew = look.eyewear;
  if (ew!=='none' && !back){
    if (front){
      if (ew==='shades' || ew==='shades2'){ const lc = ew==='shades' ? '#1b1822' : '#3a2a50'; R(7, ey-1, 4, 3, lc); R(13, ey-1, 4, 3, lc); R(11, ey-1, 2, 1, lc); P(7, ey-1, '#6b6f86'); P(13, ey-1, '#6b6f86'); P(8, ey, ew==='shades2' ? '#c58be8' : '#4a4e66'); P(14, ey, ew==='shades2' ? '#c58be8' : '#4a4e66'); P(6, ey-1, OUT); P(17, ey-1, OUT); }
      else if (ew==='round'){ for (const x0 of [7,13]){ P(x0+1, ey-1, OUT); P(x0+2, ey-1, OUT); P(x0, ey, OUT); P(x0+3, ey, OUT); P(x0, ey+1, OUT); P(x0+3, ey+1, OUT); P(x0+1, ey+2, OUT); P(x0+2, ey+2, OUT); } P(11, ey, OUT); P(12, ey, OUT); }
      else { R(7, ey-1, 4, 1, OUT); R(13, ey-1, 4, 1, OUT); P(7, ey, OUT); P(10, ey, OUT); P(13, ey, OUT); P(16, ey, OUT); P(7, ey+1, OUT); P(10, ey+1, OUT); P(13, ey+1, OUT); P(16, ey+1, OUT); R(7, ey+2, 4, 1, OUT); R(13, ey+2, 4, 1, OUT); R(11, ey, 2, 1, OUT); }
    } else {
      if (ew.startsWith('shades')){ R(14, ey-1, 4, 3, ew==='shades' ? '#1b1822' : '#3a2a50'); P(14, ey-1, '#6b6f86'); }
      else { R(14, ey-1, 4, 1, OUT); P(14, ey, OUT); P(17, ey, OUT); R(14, ey+2, 4, 1, OUT); }
      R(9, ey-1, 5, 1, OUT);
    }
  }

  /* ===== OUTLINE + PAINT ===== */
  c = document.createElement('canvas'); c.width = GW; c.height = GH; const g = c.getContext('2d');
  const id = g.createImageData(GW, GH), d = id.data;
  const put = (x, y, col) => { const [r,gg,b] = hex(col); const i = (y*GW + (flip ? GW-1-x : x))*4; d[i]=r; d[i+1]=gg; d[i+2]=b; d[i+3]=255; };
  for (let y=0;y<GH;y++) for (let x=0;x<GW;x++){ if (G[y][x]) put(x, y, G[y][x]); else if (at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)) put(x, y, OUT); }
  g.putImageData(id, 0, 0); cache.set(key, c); return c;
}
export const GRID = {w:GW, h:GH};
