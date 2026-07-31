/* ============================================================
   RALLY LIVING GARDEN — a calm personal mirror.
   Fully modular: ground plate + grid-placed sprites.
   Deterministic from logs: no separate ledger, no sync drift.
   Structure is permanent; vitality breathes. Never decays.
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";

const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => dk(new Date());

let _gcfgP = null;
export function gdLoad() {
  if (!_gcfgP) _gcfgP = fetch("./garden/garden-config.json").then((r) => r.json()).catch(() => null);
  return _gcfgP;
}

/* grid → pixel — ONE 11×11 XL plate (1500×1500), no seams, no annexes.
   Lattice verified against ground-xl-calibration.png: origin (750,220),
   tile 127.2727×63.6364, anchor (750,1105). Do not infer from artwork. */
export const GD_TILE = [700 / 11, 350 / 11]; /* per-step deltas: half tile w, half tile h */
export const gdXY = (c, r) => [750 + (c - r) * GD_TILE[0], 220 + (c + r) * GD_TILE[1]];
export const GD_VIEW = { x0: 50, x1: 1450, y0: 220, y1: 1105 }; /* XL plate visible bounds */
export const GD_COTTAGE = [2, 2]; /* smoke anchor follows the cottage */

/* Build plan: ordered, cumulative point costs. el@state at grid [c,r].
   One plate, three zones by unlock day: center (day 0), east wing c−r≥2
   (day 22), west wing r−c≥3 (day 40). Layout is solver-verified: zero
   footprint overlaps, gdCheckPlan clean at XL geometry (see v39 changelog). */
export const GD_PLAN = [
  { at: 0, el: "path-stone-1", pos: [4, 4] },
  { at: 1, el: "grove", st: 1, slot: "gA", pos: [6, 5] },
  { at: 2, el: "flowerbed", slot: "fA", pos: [8, 8] },
  { at: 3, el: "path-stone-2", pos: [4, 5] },
  { at: 4, el: "grove", st: 2, slot: "gA" },
  { at: 5, el: "cottage", st: 1, slot: "ct", pos: [2, 2] },
  { at: 7, el: "pond", pos: [6, 7] },
  { at: 8, el: "grove", st: 3, slot: "gA" },
  { at: 9, el: "path-stone-3", pos: [4, 6] },
  { at: 12, el: "cottage", st: 2, slot: "ct" },
  { at: 13, el: "grove", st: 4, slot: "gA" },
  { at: 14, el: "bridge", pos: [6, 7] },
  { at: 18, el: "cottage", st: 3, slot: "ct" },
  { at: 20, el: "grove", st: 5, slot: "gA" },
  { at: 22, el: "flowerbed", slot: "eA", pos: [9, 4] },
  { at: 24, el: "grove", st: 1, slot: "gB", pos: [6, 3] },
  { at: 25, el: "arbor", pos: [5, 1] },
  { at: 26, el: "bench", pos: [8, 5] },
  { at: 27, el: "grove", st: 2, slot: "gB" },
  { at: 29, el: "flowerbed", slot: "eB", pos: [9, 7] },
  { at: 31, el: "grove", st: 3, slot: "gB" },
  { at: 34, el: "bamboo-cluster", pos: [9, 2] },
  { at: 37, el: "grove", st: 4, slot: "gB" },
  { at: 40, el: "flowerbed", slot: "wA", pos: [1, 9] },
  { at: 42, el: "grove", st: 1, slot: "gC", pos: [2, 7] },
  { at: 45, el: "grove", st: 2, slot: "gC" },
  { at: 48, el: "cherry-tree", pos: [2, 5] },
  { at: 51, el: "flowerbed", slot: "wB", pos: [4, 7] },
  { at: 54, el: "grove", st: 3, slot: "gC" },
  { at: 58, el: "grove", st: 5, slot: "gB" },
];









const GD_HABITS = [
  { el: "hb-steps", key: "steps", pos: [4, 3] },
  { el: "hb-reading", key: "readPages", pos: [7, 9] },
  { el: "hb-meditation", key: "meditationMin", pos: [8, 7] },
  { el: "hb-workout", key: "workoutMin", pos: [9, 9] },
  { el: "hb-sleep", key: "sleep", pos: [2, 9], at: 40 },
  { el: "hb-journal", key: "journal", pos: [5, 9], at: 40 },
]; /* `at` replaces the old west-plate gating: these lived on plate 2, which
      only existed from day 40 — same reveal, now explicit. */










const hv = (l, k) => k === "journal" ? !!l.journal : (Number(l[k]) || 0) > 0;

/* Pure derivation: logs → the whole garden. `layout` is a cosmetic overlay
   {key:[c,r]} — logs still decide what exists; layout only decides where it
   sits. Delete the overlay and solver defaults return intact. */
export function gdDerive(logs, scoreFn, dayKey, layout) {
  const lay = layout || {};
  const days = Object.keys(logs || {}).sort();
  const active = days.filter((d) => scoreFn(logs[d]) > 0);
  const points = active.length;
  const d0 = new Date(dayKey); let last30 = 0;
  for (let i = 0; i < 30; i++) { const d = new Date(d0); d.setDate(d0.getDate() - i); if (scoreFn(logs[dk(d)] || {}) > 0) last30++; }
  const vitality = last30 / 30;
  const slots = {}, placed = [];
  let unlocked = 0;
  for (const p of GD_PLAN) {
    if (points < p.at) break;
    unlocked++;
    if (p.slot) { slots[p.slot] = { ...(slots[p.slot] || {}), k: p.slot, el: p.el, st: p.st, pos: p.pos || slots[p.slot]?.pos }; }
    else placed.push({ k: p.el, el: p.el, pos: p.pos });
  }
  for (const s of Object.values(slots)) placed.push({ k: s.k, el: s.el, st: s.st, pos: s.pos });
  const tl = (logs || {})[dayKey] || {};
  for (const h of GD_HABITS) {
    const lifetime = days.filter((d) => hv(logs[d], h.key)).length;
    if (lifetime >= 3 && points >= (h.at || 0)) placed.push({ k: h.el, el: h.el, pos: h.pos, full: hv(tl, h.key) });
  }
  /* apply arrange overlay; bridge follows a moved pond unless moved itself */
  const pond = placed.find((p) => p.k === "pond");
  for (const p of placed) {
    if (lay[p.k]) p.pos = lay[p.k];
    else if (p.k === "bridge" && pond && lay.pond) p.pos = lay.pond;
  }
  return { points, vitality, ground: points >= 6 ? "ground-xl-grassy" : "ground-xl-tilled", placed, unlocked };
}

export const gdSpriteId = (cfg, p, vitality) => {
  const base = p.st ? `${p.el}-${p.st}` : p.el;
  if (cfg.sprites[base]) {
    const withState = p.full != null ? `${p.el}-${p.full ? "full" : "quiet"}` : (cfg.sprites[`${base}-full`] && vitality >= 0.5 ? `${base}-full` : base);
    return cfg.sprites[withState] ? withState : base;
  }
  const q = `${base}-quiet`, f = `${base}-full`;
  if (p.full != null) return p.full ? f : q;
  return cfg.sprites[f] && vitality >= 0.5 ? f : (cfg.sprites[q] ? q : base);
};

/* Render layers: 0 ground, 1 flat terrain/water/paths, 2 water-crossing structures,
   3 depth-sorted world objects, 4 ambient. Water can never overdraw a bench again. */
export const GD_SCALE = {"cottage": 0.72, "grove": 0.71, "cherry-tree": 0.85, "bamboo-cluster": 0.62, "flowerbed": 1.0, "pond": 0.93, "stream": 0.74, "bridge": 0.68, "path-stone-1": 0.91, "path-stone-2": 1.0, "path-stone-3": 1.0, "bench": 0.55, "arbor": 0.5, "stone-lantern": 0.5, "hb-reading": 0.6, "hb-meditation": 0.53, "hb-workout": 0.5, "hb-sleep": 0.6, "hb-steps": 0.62, "hb-journal": 0.5}; /* tile-honest: contact width fitted to footprint span at the OLD 116px tile */
/* XL plate tile is 127.27px wide (was 116): one global factor keeps every
   v2 sprite tile-honest without retouching per-element values. */
export const GD_XLK = GD_TILE[0] / 58;
export const gdScaleOf = (el) => (GD_SCALE[el] || 1) * GD_XLK;
export const gdLayer = (el) => (el === "pond" || el === "shimmer" || el.indexOf("path-stone") === 0) ? 1 : el === "bridge" ? 2 : 3;

/* Plan sanity: pixel-bounds overlap check for world objects (water, paths, bridges exempt).
   Uses sprite canvas bounds shrunk 18% to approximate visible mass incl. overhang. */
export function gdCheckPlan(cfg) {
  const warns = [];
  const rects = [];
  for (const p of GD_PLAN) {
    if (!p.pos) continue;
    const sid = p.st ? p.el + "-" + p.st : p.el;
    const sp = cfg.sprites[sid] || cfg.sprites[sid + "-quiet"] || cfg.sprites[sid + "-full"];
    if (!sp || gdLayer(p.el) !== 3) continue;
    const [x, y] = gdXY(p.pos[0], p.pos[1]);
    const cw = (sp.c && sp.c[0]) || sp.a[0] * 2, ch = (sp.c && sp.c[1]) || sp.a[1] + 40;
    const m = 0.18;
    rects.push({ el: p.el + (p.slot ? ":" + p.slot : ""), x0: x - sp.a[0] + cw * m, x1: x - sp.a[0] + cw * (1 - m), y0: y - sp.a[1] + ch * m, y1: y - sp.a[1] + ch * (1 - m) });
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    if (a.el.split(":")[0] === b.el.split(":")[0] && a.el.includes(":") ) continue;
    const ox = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
    const oy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    const inter = ox * oy;
    const small = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
    if (small > 0 && inter / small > 0.35) warns.push(a.el + " vs " + b.el);
  }
  return warns;
}

/* ============ ARRANGE MODE ============
   Player-facing placement rules — tile-honest and predictable:
   - containment: tile footprint inside the 9×9 interior
   - collisions:  tile footprints must not overlap (depth-sort handles
                  canopy/visual overlap naturally — measured: the solver's
                  own defaults carry up to 76% visual-rect overlap and read
                  beautifully, so a visual gate would be noise)
   - water:       pond tiles are off-limits to world objects; the bridge may
                  cross water, path stones become stepping stones on it
   Layout overlay is cosmetic: stored per-device, never part of progress. */
export const GD_LAYOUT_KEY = "rt1:gd:layout";
export const gdLoadLayout = () => { try { return JSON.parse(localStorage.getItem(GD_LAYOUT_KEY) || "{}"); } catch { return {}; } };
export const gdSaveLayout = (lay) => localStorage.setItem(GD_LAYOUT_KEY, JSON.stringify(lay));

const gdFp = (cfg, p) => {
  const sid = p.st ? `${p.el}-${p.st}` : p.el;
  const sp = cfg.sprites[sid] || cfg.sprites[sid + "-quiet"] || cfg.sprites[sid + "-full"];
  return (sp && sp.fp) || [1, 1];
};
const gdTileRect = (cfg, p, pos) => {
  const [w, h] = gdFp(cfg, p);
  return [pos[0] - w / 2, pos[0] + w / 2, pos[1] - h / 2, pos[1] + h / 2];
};
const gdRectOv = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));

/* Can `key` (one of g.placed[].k) sit at pos, given everything else placed? */
export function gdCanPlace(cfg, placed, key, pos) {
  const me = placed.find((q) => q.k === key);
  if (!me) return false;
  const myRect = gdTileRect(cfg, me, pos);
  if (myRect[0] < 0.5 || myRect[2] < 0.5 || myRect[1] > 9.5 || myRect[3] > 9.5) return false; /* interior */
  const isStone = (q) => q.el.indexOf("path-stone") === 0;
  for (const q of placed) {
    if (q.k === key || !q.pos) continue;
    const tileOv = gdRectOv(myRect, gdTileRect(cfg, q, q.pos)) > 1e-9;
    if (q.k === "pond") {
      if (key === "bridge" || isStone(me)) continue;      /* bridge + stepping stones cross water */
      if (tileOv) return false;                            /* nothing else lands in the pond */
      continue;
    }
    if (key === "pond") {
      if (q.k === "bridge" || isStone(q)) continue;        /* pond may slide under bridge/stones */
      if (tileOv) return false;
      continue;
    }
    if (isStone(me) !== isStone(q)) continue;              /* stones slide under the world */
    if (tileOv) return false;                              /* stones vs stones, world vs world */
  }
  return true;
}

/* All tiles where `key` may go right now. */
export function gdValidTargets(cfg, placed, key) {
  const out = [];
  for (let c = 1; c <= 9; c++) for (let r = 1; r <= 9; r++)
    if (gdCanPlace(cfg, placed, key, [c, r])) out.push([c, r]);
  return out;
}

export function useGarden({ me, dayScore }) {
  const [cfg, setCfg] = useState(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState(() => gdLoadLayout());
  useEffect(() => { gdLoad().then(setCfg); }, []);
  const g = useMemo(() => me ? gdDerive(me.logs || {}, dayScore, today(), layout) : null, [me?.logs, dayScore, layout]);
  const seen = Number(localStorage.getItem("rt1:gd:seen") || 0);
  const fresh = g ? g.unlocked > seen : false;
  const openG = () => { if (g) localStorage.setItem("rt1:gd:seen", String(g.unlocked)); setOpen(true); };
  const moveItem = (key, pos) => setLayout((l) => { const n = { ...l, [key]: pos }; gdSaveLayout(n); return n; });
  const resetLayout = () => { gdSaveLayout({}); setLayout({}); };
  return { ready: !!(cfg && g), cfg, g, open, setOpen, openG, fresh, layout, moveItem, resetLayout };
}

export function GardenTablet({ gd }) {
  if (!gd.ready) return null;
  return (
    <button onClick={gd.openG} aria-label="Your garden" style={{ position: "relative", border: "none", background: "none", padding: 0, cursor: "pointer", width: 34, height: 44 }}>
      <img src="./garden/stone-tablet-button-128.webp" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(60,50,30,.35))" }} draggable={false} />
      {gd.fresh && <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 99, background: "#7FA05C", border: "2px solid #FFFDF6", boxShadow: "0 0 8px rgba(127,160,92,.9)" }} />}
    </button>
  );
}

export function GardenScreen({ gd }) {
  const { cfg, g } = gd;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.45);
  const [tick, setTick] = useState(0);
  const [intro, setIntro] = useState(() => !localStorage.getItem("rt1:gd:intro"));
  const [arrange, setArrange] = useState(false);
  const [sel, setSel] = useState(null); /* key of item being moved */
  const closeIntro = () => { localStorage.setItem("rt1:gd:intro", "1"); setIntro(false); };
  const still = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const fit = () => { if (wrapRef.current) setScale(wrapRef.current.clientWidth); };
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, []);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setTick((x) => x + 1), 900);
    return () => clearInterval(t);
  }, [still]);
  useEffect(() => { if (!arrange) setSel(null); }, [arrange]);
  const targets = useMemo(() => (arrange && sel && cfg && g) ? gdValidTargets(cfg, g.placed, sel) : [], [arrange, sel, cfg, g]);
  const items = useMemo(() => {
    if (!cfg || !g) return [];
    return g.placed.map((p, i) => {
      const sid = gdSpriteId(cfg, p, g.vitality);
      const sp = cfg.sprites[sid];
      if (!sp || !p.pos) return null;
      const [x, y] = gdXY(p.pos[0], p.pos[1]);
      return { k: p.k, sid, sp, x, y, s: gdScaleOf(p.el), layer: gdLayer(p.el), z: y + (sp.z || 0), i };
    }).filter(Boolean).sort((a, b) => a.layer - b.layer || (a.layer === 3 ? a.z - b.z : a.i - b.i));
  }, [cfg, g]);
  if (!cfg || !g) return null;
  const cot = g.placed.find((p) => p.el === "cottage" && p.st === 3);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 87, background: "linear-gradient(180deg, #EFE6CE, #E4D7B8)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 18px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="rh" style={{ fontSize: 24, fontFamily: '"IM Fell English", Georgia, serif', fontVariant: "small-caps", letterSpacing: ".04em" }}>Your Garden</div>
          <button onClick={() => setIntro(true)} aria-label="About the garden" style={{ width: 24, height: 24, borderRadius: 99, border: "1.5px solid #C9BC9C", background: "#F6EFDD", color: "#8E8266", fontWeight: 900, fontSize: 13, cursor: "pointer", lineHeight: 1 }}>?</button>
          <button className="rghost" style={{ marginLeft: "auto" }} onClick={() => setArrange((a) => !a)}>{arrange ? "Done" : "Arrange"}</button>
          {arrange && Object.keys(gd.layout || {}).length > 0 && <button className="rghost" onClick={() => { gd.resetLayout(); setSel(null); }}>Reset</button>}
          {!arrange && <button className="rghost" onClick={() => gd.setOpen(false)}>Close</button>}
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
          {[[String(g.points), "days tended"], [String(Math.round(g.vitality * 30)) + " of 30", "days this month"], [g.vitality >= 0.7 ? "Flourishing" : g.vitality >= 0.35 ? "Growing" : "Resting", "spirit"]].map((x) => (
            <div key={x[1]} style={{ background: "rgba(255,252,242,.75)", border: "1.5px solid #E4D9BC", borderRadius: 13, padding: "7px 12px" }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: "#4A4234" }}>{x[0]}</div>
              <div style={{ fontSize: 8.5, fontWeight: 800, color: "#9A8F78", letterSpacing: ".06em" }}>{x[1].toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
      <div ref={wrapRef} style={{ flex: 1, overflow: "hidden", display: "grid", placeItems: "center" }}>
        {(() => {
          const { x0: ex0, x1: ex1, y0: ey0, y1: ey1 } = GD_VIEW;
          const s = Math.min(scale / (ex1 - ex0), 1.0);
          return (
        <div style={{ width: (ex1 - ex0) * s, height: (ey1 - ey0) * s, overflow: "hidden", borderRadius: 18 }}>
          <div style={{ width: 1500, height: 1500, transform: "scale(" + s + ") translate(" + (-ex0) + "px, " + (-ey0) + "px)", transformOrigin: "top left", position: "relative" }}>
            <img src={"./garden/" + g.ground + ".webp"} alt="" style={{ position: "absolute", left: 0, top: 0, width: 1500 }} draggable={false} />
            {items.map((it) => {
              const useF2 = it.sp.f2 && !still && (tick + it.i) % 2 === 1;
              const isSel = arrange && sel === it.k;
              return <img key={it.sid + it.i} src={`./garden/${it.sid}${useF2 ? "-f2" : ""}.webp`} alt=""
                onClick={arrange ? (e) => { e.stopPropagation(); setSel(sel === it.k ? null : it.k); } : undefined}
                style={{ position: "absolute", left: it.x - it.sp.a[0], top: it.y - it.sp.a[1], transform: (it.s !== 1 ? "scale(" + it.s + ")" : "") + (isSel ? " translateY(-14px)" : ""), transformOrigin: it.sp.a[0] + "px " + it.sp.a[1] + "px", pointerEvents: arrange ? "auto" : "none", cursor: arrange ? "pointer" : undefined, filter: isSel ? "drop-shadow(0 0 14px rgba(255,236,160,.95)) drop-shadow(0 6px 10px rgba(60,50,20,.4))" : undefined, transition: "filter .18s, transform .18s" }} draggable={false} />;
            })}
            {arrange && sel && (
              <svg width="1500" height="1500" viewBox="0 0 1500 1500" style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
                {targets.map(([c, r]) => {
                  const p0 = gdXY(c, r), p1 = gdXY(c + 1, r), p2 = gdXY(c + 1, r + 1), p3 = gdXY(c, r + 1);
                  return <polygon key={c + "-" + r} points={`${p0[0]},${p0[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`}
                    onClick={() => { gd.moveItem(sel, [c, r]); setSel(null); }}
                    style={{ fill: "rgba(255,244,180,.28)", stroke: "rgba(190,168,90,.85)", strokeWidth: 2, pointerEvents: "auto", cursor: "pointer" }} />;
                })}
              </svg>
            )}
            {cot && !still && (() => { const [cx, cy] = gdXY(GD_COTTAGE[0], GD_COTTAGE[1]); return (
              <img src={`./garden/smoke${tick % 2 ? "-f2" : ""}.webp`} alt="" style={{ position: "absolute", left: cx - 66, top: cy - 515, opacity: .8, pointerEvents: "none" }} draggable={false} />); })()}
            {g.vitality >= 0.6 && <img src={`./garden/fireflies${!still && tick % 2 ? "-f2" : ""}.webp`} alt="" style={{ position: "absolute", left: 300, top: 560, opacity: .85, pointerEvents: "none" }} draggable={false} />}
            {!still && <img src="./garden/petals.webp" alt="" style={{ position: "absolute", left: 0, top: 0, width: 600, animation: "gdrift 14s linear infinite", opacity: .6, pointerEvents: "none" }} draggable={false} />}
            <style>{`@keyframes gdrift { 0% { transform: translate(975px,-120px) rotate(0deg); } 100% { transform: translate(-225px,1050px) rotate(40deg); } }`}</style>
          </div>
        </div>
          ); })()}
      </div>
      <div style={{ padding: "8px 22px 24px", textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "#8E8371", lineHeight: 1.5 }}>
        {g.vitality < 0.35 ? "Your progress is still here. Continue whenever you're ready." : "Every logged day feeds the garden. Nothing here is ever lost."}
      </div>
      {intro && (
        <div style={{ position: "fixed", inset: 0, zIndex: 93, display: "grid", placeItems: "center", padding: 26 }} onClick={closeIntro}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(30,26,16,.55)", backdropFilter: "blur(2px)" }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", background: "#FBF5E4", border: "1.5px solid #E0D3B2", borderRadius: 22, padding: "22px 20px", maxWidth: 330, boxShadow: "0 18px 50px rgba(40,32,18,.4)" }}>
            <div className="rh" style={{ fontSize: 20, fontFamily: '"IM Fell English", Georgia, serif', fontVariant: "small-caps", marginBottom: 8 }}>A garden that grows as you do</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#5C5443", lineHeight: 1.65 }}>
              Every day you log anything, your garden grows — paths are laid, sprouts rise, and in time a tree, a pond, and a cottage take shape.
              <br /><br />Keep a habit going and it plants something of its own: a bench for reading, a lotus pool for meditation, moonflowers for sleep.
              <br /><br />Quiet weeks simply rest the garden. Nothing ever wilts, and nothing you grow is ever taken away.
            </div>
            <button className="rbtn" style={{ width: "100%", marginTop: 16 }} onClick={closeIntro}>Tend it well</button>
          </div>
        </div>
      )}
    </div>
  );
}