/* ============================================================
   RALLY WILDS — fantasy hiking layer. The Fernreach, region 1.
   Constitution: mirror-not-motive · nothing real gated · one body
   one log · no loss, no guilt · receipts, not battlers.
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { sGet, sSet } from "./storage.js";

const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => dk(new Date());

export const WD_TIER = {
  Common: { ink: "#6B4226", name: "Parchment" },
  Bronze: { ink: "#9C5A2E", name: "Bronze" },
  Silver: { ink: "#5A6B7E", name: "Silver" },
  Gold:   { ink: "#B9860B", name: "Gold leaf" },
};
const PARCH = "#F3EAD7", INKD = "#4A4234", MUTB = "#9A8F78";

/* ---------------- config (fetched once, cached) ---------------- */
let _cfgP = null;
export function wdLoad() {
  if (!_cfgP) _cfgP = Promise.all([
    fetch("./wilds/wilds-config.json").then((r) => r.json()),
    fetch("./wilds/wilds-routes.json").then((r) => r.json()),
  ]).then(([cfg, routes]) => {
    const byId = Object.fromEntries(cfg.trails.map((t) => [t.id, t]));
    return { ...cfg, byId, routes };
  }).catch(() => null);
  return _cfgP;
}

/* ---------------- pure engine (exported for tests) ---------------- */
export const wdSegBounds = (trail) => {
  let acc = 0;
  return trail.segments.map((s) => { const b = { ...s, from: acc, to: acc + s.steps }; acc += s.steps; return b; });
};
export const wdGateMet = (g, daySteps, dawnSteps) =>
  g.type === "day" ? daySteps >= g.threshold :
  g.type === "dawn" ? (dawnSteps || 0) >= g.threshold : false;

/* Apply today's fuel to a trail. Pure: returns { applied, used, events, laurels, blockedAt }.
   fuel = raw day steps + workout conversion (ordinary distance only).
   Gates are checked against RAW daySteps / dawn record — never fuel, never spillover. */
export function wdAdvance(trail, alreadyApplied, fuel, daySteps, dawnSteps) {
  const bounds = wdSegBounds(trail);
  let pos = alreadyApplied, used = 0;
  const laurels = [], events = [];
  let blockedAt = null;
  while (fuel > 0 && pos < trail.routeSteps) {
    const seg = bounds.find((b) => pos < b.to);
    if (!seg) break;
    if (seg.gates && pos <= seg.from) {
      const unmet = seg.gates.filter((g) => !wdGateMet(g, daySteps, dawnSteps));
      if (unmet.length) { blockedAt = { seg: seg.terrain, gates: unmet }; break; }
      for (const g of seg.gates) {
        laurels.push(g.type === "dawn" ? `Dawn start — ${(dawnSteps || 0).toLocaleString()} before first light`
          : `Crossed the ${seg.terrain} — ${daySteps.toLocaleString()}-step day`);
      }
    }
    const room = seg.to - pos, take = Math.min(room, fuel);
    pos += take; used += take; fuel -= take;
    if (pos >= seg.to) events.push({ seg: seg.terrain });
  }
  return { applied: pos, used, laurels, events, blockedAt, completed: pos >= trail.routeSteps };
}

/* Full day-application over state. Handles camps, peak, spillover, completion.
   dayUsed is STATE-level: one body, one day-budget — switching trails can never
   re-spend the same day's steps (adopted rule: only spillover advances a second
   trail on the completion day). */
export function wdApplyDay(state, cfg, dayKey, daySteps, workoutMin, nowHour) {
  const st = JSON.parse(JSON.stringify(state || {}));
  st.progress = st.progress || {}; st.completed = st.completed || {}; st.dawn = st.dawn || {};
  if (nowHour < 8 && daySteps > (st.dawn[dayKey] || 0)) st.dawn[dayKey] = daySteps;
  if (!st.dayUsed || st.dayUsed.day !== dayKey) st.dayUsed = { day: dayKey, used: 0 };
  if (st.spillover && st.spillover.day !== dayKey) st.spillover = null;
  const tid = st.active;
  const out = { changed: false, completedTrail: null, blocked: null };
  if (!tid || st.completed[tid]) return { st, ...out };
  const trail = cfg.byId[tid];
  if (!trail) return { st, ...out };
  const p = st.progress[tid] = st.progress[tid] || { cv: cfg.configVersion, applied: 0, camps: [], peak: 0, laurels: [], lastDay: dayKey };
  /* camp: a new day dawned while mid-trail */
  if (p.lastDay !== dayKey) {
    if (p.applied > 0 && !p.camps.some((c) => c.day === p.lastDay)) { p.camps.push({ day: p.lastDay, at: p.applied }); out.changed = true; }
    p.lastDay = dayKey;
  }
  const fuelToday = Math.max(0, daySteps + Math.round((workoutMin || 0) * (cfg.workoutStepsPerMin || 80)));
  const fresh = Math.max(0, fuelToday - st.dayUsed.used);
  const spill = st.spillover && st.spillover.forTrail !== tid ? st.spillover.steps : 0;
  if (fresh + spill <= 0) return { st, ...out };
  const adv = wdAdvance(trail, p.applied, fresh + spill, daySteps, st.dawn[dayKey] || 0);
  if (adv.used > 0) {
    out.changed = true;
    const fromFresh = Math.min(adv.used, fresh);
    st.dayUsed.used += fromFresh;
    if (spill > 0) { const usedSpill = adv.used - fromFresh; st.spillover = usedSpill >= spill ? null : { ...st.spillover, steps: spill - usedSpill }; }
    p.applied = adv.applied;
    p.peak = Math.max(p.peak || 0, daySteps);
    for (const l of adv.laurels) if (!p.laurels.includes(l)) p.laurels.push(l);
  }
  if (adv.blockedAt) out.blocked = adv.blockedAt;
  if (adv.completed) {
    st.completed[tid] = {
      cv: p.cv || cfg.configVersion, completedAt: Date.now(), day: dayKey,
      routeSteps: trail.routeSteps, qualifyingDayPeak: p.peak, days: p.camps.length + 1,
      camps: p.camps.slice(), gateLaurels: p.laurels.slice(),
    };
    const leftoverFresh = Math.max(0, fuelToday - st.dayUsed.used);
    if (leftoverFresh > 0) st.spillover = { steps: leftoverFresh, day: dayKey, forTrail: tid };
    st.dayUsed.used = Math.max(st.dayUsed.used, fuelToday); /* leftover lives ONLY as spillover — never as fresh budget */
    st.active = null;
    delete st.progress[tid];
    out.completedTrail = tid;
  }
  return { st, ...out };
}

export const wdOpenIds = (cfg, completed) => {
  const done = new Set(Object.keys(completed || {}));
  return new Set(cfg.trails.filter((t) => t.prereqs.every((p) => p === "trailhead" || done.has(p))).map((t) => t.id));
};
const wdSpotlight = (cfg, openIds, dayKey) => {
  const shorts = cfg.trails.filter((t) => openIds.has(t.id) && t.routeSteps <= 7000);
  if (!shorts.length) return [];
  let h = 0; for (const c of dayKey) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = shorts[h % shorts.length], b = shorts[(h >> 4) % shorts.length];
  return a.id === b.id ? [a] : [a, b];
};

/* ---------------- hook ---------------- */
export function useWilds({ me, setMe, teamCode, feedPost }) {
  const [cfg, setCfg] = useState(null);
  const [wd, setWd] = useState(null);
  const [open, setOpen] = useState(false);
  const [ceremony, setCeremony] = useState(null);
  const busy = useRef(false);
  useEffect(() => { wdLoad().then(setCfg); }, []);
  useEffect(() => {
    if (!me?.id) return;
    (async () => { try { const s = await sGet(`rt1:wd:${me.id}`, true); setWd(s || { enabled: false }); } catch { setWd({ enabled: false }); } })();
  }, [me?.id]);
  const persist = async (next) => { setWd(next); try { await sSet(`rt1:wd:${me.id}`, next, true); } catch { } };
  const log = (me?.logs || {})[today()] || {};
  const daySteps = Number(log.steps) || 0, woMin = Number(log.workoutMin) || 0;
  useEffect(() => {
    if (!cfg || !wd || !wd.enabled || !me?.id || busy.current) return;
    const { st, changed, completedTrail } = wdApplyDay(wd, cfg, today(), daySteps, woMin, new Date().getHours());
    if (changed || completedTrail || JSON.stringify(st.dawn) !== JSON.stringify(wd.dawn || {})) {
      busy.current = true;
      persist(st).finally(() => { busy.current = false; });
      if (completedTrail) {
        const t = cfg.byId[completedTrail];
        setCeremony({ trail: t, rec: st.completed[completedTrail] });
        if (teamCode && feedPost) feedPost(teamCode, { pid: me.id, name: me.name, icon: "flag", text: `completed the ${t.name} — ${t.miles} miles through the Fernreach` });
      }
    }
  }, [cfg, wd, daySteps, woMin, me?.id]);
  const openIds = useMemo(() => cfg && wd ? wdOpenIds(cfg, wd.completed) : new Set(), [cfg, wd]);
  return {
    ready: !!(cfg && wd), cfg, wd, openIds, open, setOpen, ceremony, setCeremony,
    spotlight: cfg && wd ? wdSpotlight(cfg, openIds, today()) : [],
    enable: () => persist({ ...(wd || {}), enabled: true }),
    disable: () => persist({ ...wd, enabled: false }),
    setOut: (tid) => persist({ ...wd, active: tid, progress: { ...(wd.progress || {}), [tid]: (wd.progress || {})[tid] || { cv: cfg.configVersion, applied: 0, camps: [], peak: 0, laurels: [], dayUsed: { day: today(), used: 0 } } } }),
    rest: () => persist({ ...wd, active: null }),
  };
}

/* ---------------- route SVG ---------------- */
export function RouteSVG({ d, kind, progress = 1, camps = [], tier = "Common", height = 190, live }) {
  const ref = useRef(null);
  const [geo, setGeo] = useState(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      const L = ref.current.getTotalLength();
      const at = (f) => { const p = ref.current.getPointAtLength(Math.max(0, Math.min(1, f)) * L); return [p.x, p.y]; };
      setGeo({ L, marker: at(progress), camps: camps.map((c) => at(c)), end: at(1), start: at(0) });
    } catch { }
  }, [d, progress, camps.join?.(",")]);
  const ink = WD_TIER[tier]?.ink || WD_TIER.Common.ink;
  return (
    <svg viewBox="0 0 1000 420" style={{ width: "100%", height, display: "block" }} aria-hidden="true">
      <path d={d} fill="none" stroke="#FFFBEE" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      <path d={d} fill="none" stroke="#2E2618" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={progress <= 0 && !live ? ".5" : ".92"} />
      <path ref={ref} d={d} fill="none" stroke={ink} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round"
        opacity={progress <= 0 && !live ? ".92" : "1"}
        strokeDasharray={geo && !(progress <= 0 && !live) ? String(geo.L) : undefined}
        strokeDashoffset={geo && !(progress <= 0 && !live) ? String(geo.L * (1 - Math.max(0.02, Math.min(1, progress)))) : undefined} />
      {geo && <circle cx={geo.start[0]} cy={geo.start[1]} r="8" fill="#FFFBEE" stroke="#2E2618" strokeWidth="3" />}
      {geo && camps.map((c, i) => { const [x, y] = geo.camps[i]; return (
        <g key={i} transform={`translate(${x},${y})`}>
          <path d="M -13 8 L 0 -12 L 13 8 Z" fill="#F6EFDD" stroke="#4A4234" strokeWidth="3" />
          <path d="M 0 -12 L 0 8" stroke="#4A4234" strokeWidth="2.5" />
        </g>); })}
      {geo && (kind === "ascent" || kind === "epic") && (
        <g transform={`translate(${geo.end[0]},${geo.end[1] - 4})`}>
          <path d="M -10 10 h20 M -7 4 h14 M -4 -2 h8 M -1.5 -8 h3" stroke="#4A4234" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </g>)}
      {geo && live && progress < 1 && (
        <g transform={`translate(${geo.marker[0]},${geo.marker[1]})`}>
          <circle r="13" fill={ink} opacity=".25"><animate attributeName="r" values="9;16;9" dur="2.2s" repeatCount="indefinite" /></circle>
          <circle r="7" fill={ink} stroke="#FFFDF6" strokeWidth="2.5" />
        </g>)}
    </svg>
  );
}

/* ---------------- passport stamp seal ---------------- */
export function StampSeal({ trail, rec, size = 108 }) {
  const MARQ = { r03: "elderpine", r04: "glimmermere", r09: "veilfall", r14: "highshoulder", r15: "summitcairn", r23: "thornreach", r26: "oldmill", r44: "stonebrook", r52: "kniferidge" };
  const pict = MARQ[trail.id] || trail.canvas;
  let h = 0; for (const c of trail.id) h = h * 31 + c.charCodeAt(0);
  const rot = (h % 13) - 6;
  const date = rec ? new Date(rec.completedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "";
  const R = size / 2;
  return (
    <div style={{ width: size, height: size, position: "relative", transform: `rotate(${rot}deg)`, opacity: .92, mixBlendMode: "multiply" }}>
      <svg viewBox="0 0 120 120" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><path id={`ring-${trail.id}`} d="M 60 12 a 48 48 0 1 1 -0.01 0" fill="none" /></defs>
        <circle cx="60" cy="60" r="56" fill="none" stroke="#7A3D2E" strokeWidth="3.4" opacity=".9" />
        <circle cx="60" cy="60" r="41" fill="none" stroke="#7A3D2E" strokeWidth="1.6" opacity=".85" />
        <text style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".14em", fill: "#7A3D2E", fontFamily: "Georgia, serif" }}>
          <textPath href={`#ring-${trail.id}`} startOffset="2%">{(trail.name + " · THE FERNREACH · " + date).toUpperCase()}</textPath>
        </text>
      </svg>
      <img src={`./wilds/stamp-${pict}.webp`} alt="" style={{ position: "absolute", left: "26%", top: "26%", width: "48%", height: "48%", objectFit: "contain", opacity: .9 }} draggable={false} />
    </div>
  );
}

/* ---------------- trophy card ---------------- */
export function TrophyCard({ trail, rec, route, compact }) {
  const T = WD_TIER[trail.finish] || WD_TIER.Common;
  const camps = (rec?.camps || []).map((c) => c.at / trail.routeSteps);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "5/7", borderRadius: 18, overflow: "hidden", background: PARCH, boxShadow: "0 18px 50px rgba(40,32,18,.35)" }}>
      <img src={`./wilds/canvas-${trail.id}.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
      <div style={{ position: "absolute", inset: 6, borderRadius: 13, border: `1.5px solid ${T.ink}`, opacity: .75, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "4%", right: "4%", top: "44%", height: "31%" }}>
        <RouteSVG d={route.d} kind={route.kind} progress={1} camps={camps} tier={trail.finish} height="100%" />
      </div>
      <div style={{ position: "absolute", left: "6%", right: "6%", bottom: compact ? "3%" : "3.5%", textAlign: "center", color: INKD, fontFamily: '"IM Fell English", Georgia, "Times New Roman", serif' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 8% 4px" }}>
          <div style={{ flex: 1, height: 1.5, background: T.ink, opacity: .7 }} />
          <svg width="30" height="13" viewBox="0 0 30 13"><path d="M2 12 L9 3 L14 9 L19 2 L28 12 Z" fill="none" stroke={T.ink} strokeWidth="1.6" /></svg>
          <div style={{ flex: 1, height: 1.5, background: T.ink, opacity: .7 }} />
        </div>
        <div style={{ fontSize: compact ? 15 : 21, letterSpacing: ".1em", fontVariant: "small-caps", fontWeight: 700 }}>{trail.name}</div>
        <div style={{ fontSize: compact ? 8.5 : 11, letterSpacing: ".06em", opacity: .85 }}>The Fernreach · {trail.area}</div>
        <div style={{ fontSize: compact ? 8.5 : 11.5, marginTop: 3 }}>{trail.miles} miles · {trail.routeSteps.toLocaleString()} route steps{rec ? ` · ${rec.days} day${rec.days === 1 ? "" : "s"} · ${rec.camps.length} camp${rec.camps.length === 1 ? "" : "s"}` : ""}</div>
        {rec?.gateLaurels?.length > 0 && !compact && (
          <div style={{ fontSize: 10.5, marginTop: 3, color: "#6B5A35" }}>⛰ {rec.gateLaurels[0]}{rec.gateLaurels[1] ? ` · ☀ ${rec.gateLaurels[1].split(" — ")[0]}` : ""}</div>)}
        {rec?.qualifyingDayPeak > 0 && !compact && (
          <div style={{ fontSize: 9.5, marginTop: 1, opacity: .75 }}>Qualifying-day peak · {rec.qualifyingDayPeak.toLocaleString()} steps</div>)}
        {rec && <div style={{ fontSize: compact ? 8 : 10.5, marginTop: 2, opacity: .85 }}>Completed {new Date(rec.completedAt).toLocaleDateString(undefined, { day: "numeric", month: "long" })}</div>}
      </div>
      {rec && !compact && (
        <div style={{ position: "absolute", right: "5%", top: "38%" }}>
          <StampSeal trail={trail} rec={rec} size={92} />
        </div>)}
    </div>
  );
}

/* ---------------- ceremony ---------------- */
export function WildsCeremony({ trail, rec, route, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 96, display: "grid", placeItems: "center", padding: 22 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(24,20,12,.78)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", width: "min(340px, 88vw)", animation: "wdpop .5s cubic-bezier(.2,1.4,.4,1)" }} onClick={(e) => e.stopPropagation()}>
        <style>{`@keyframes wdpop{0%{transform:scale(.6) rotate(-3deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}`}</style>
        <div style={{ textAlign: "center", color: "#F0E7CF", fontWeight: 900, letterSpacing: ".18em", fontSize: 12, marginBottom: 12 }}>TRAIL COMPLETE</div>
        <TrophyCard trail={trail} rec={rec} route={route} />
        <button onClick={onClose} style={{ margin: "16px auto 0", display: "block", background: "#F0E7CF", border: "none", borderRadius: 99, padding: "11px 26px", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>Into the journal</button>
      </div>
    </div>
  );
}

/* ---------------- goals-tab strip ---------------- */
export function WildsStrip({ w }) {
  if (!w.ready) return null;
  const { wd, cfg } = w;
  const t = wd.enabled && wd.active ? cfg.byId[wd.active] : null;
  const p = t ? (wd.progress || {})[t.id] : null;
  const pct = t && p ? Math.min(1, p.applied / t.routeSteps) : 0;
  const done = Object.keys(wd.completed || {}).length;
  return (
    <button className="rtap" onClick={() => wd.enabled ? w.setOpen(true) : w.enable()}
      style={{ position: "relative", width: "100%", border: "none", borderRadius: 24, overflow: "hidden", cursor: "pointer", padding: 0, textAlign: "left", minHeight: 96, boxShadow: "0 8px 26px rgba(30,40,28,.22)" }}>
      <img src="./wilds/map-preview.webp" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} draggable={false} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(92deg, rgba(22,30,20,.88) 22%, rgba(22,30,20,.55) 58%, rgba(22,30,20,.25))" }} />
      <div style={{ position: "relative", padding: "16px 18px", display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: ".16em", color: "#C9BB8E" }}>RALLY WILDS</div>
          <div style={{ fontFamily: '"IM Fell English", Georgia, serif', fontVariant: "small-caps", fontSize: 21, color: "#F3EDDA", lineHeight: 1.1, marginTop: 1 }}>
            {!wd.enabled ? "The Fernreach awaits" : t ? t.name : "The Fernreach"}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#CFC7AC", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {!wd.enabled ? "Turn daily steps into painted journeys \u2014 optional, habits untouched"
              : t ? `${(p.applied / 2100).toFixed(1)} of ${t.miles} mi${p.camps.length ? ` \u00b7 camped ${p.camps.length}\u00d7` : ""}` : `${done} of ${cfg.trails.length} trails walked \u00b7 choose your next`}
          </div>
          {t && <div style={{ height: 4.5, borderRadius: 99, background: "rgba(255,251,238,.25)", marginTop: 7, overflow: "hidden", maxWidth: 220 }}><div style={{ width: `${Math.max(3, pct * 100)}%`, height: "100%", background: "#E8C86A" }} /></div>}
        </div>
        <div style={{ flexShrink: 0, background: "rgba(243,237,218,.16)", border: "1.5px solid rgba(243,237,218,.5)", color: "#F3EDDA", borderRadius: 99, padding: "8px 15px", fontWeight: 900, fontSize: 12, whiteSpace: "nowrap" }}>{!wd.enabled ? "Explore" : "Open"}</div>
      </div>
    </button>
  );
}

/* ---------------- full wilds screen ---------------- */
export function WildsScreen({ w, me }) {
  const { cfg, wd, openIds } = w;
  const [sec, setSec] = useState("trails");
  const [det, setDet] = useState(null);
  const [card, setCard] = useState(null);
  useEffect(() => {
    if (document.getElementById("wd-font")) return;
    const l = document.createElement("link"); l.id = "wd-font"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap";
    document.head.appendChild(l);
  }, []);
  const done = wd.completed || {};
  const trail = det ? cfg.byId[det] : null;
  const areas = useMemo(() => {
    const m = {};
    for (const t of cfg.trails) (m[t.area] = m[t.area] || []).push(t);
    return Object.entries(m);
  }, [cfg]);
  const status = (t) => done[t.id] ? "done" : wd.active === t.id ? "active" : openIds.has(t.id) ? "open" : "locked";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 88, background: "#F2E9D4", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px solid #E2D5B4" }}>
        <div>
          <div className="rh" style={{ fontSize: 21, fontFamily: '"IM Fell English", Georgia, serif', fontVariant: "small-caps", letterSpacing: ".06em" }}>The Fernreach</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: MUTB, letterSpacing: ".08em" }}>{Object.keys(done).length} OF {cfg.trails.length} TRAILS WALKED</div>
        </div>
        <button className="rghost" style={{ marginLeft: "auto" }} onClick={() => w.setOpen(false)}>Close</button>
      </div>
      <div style={{ display: "flex", gap: 6, padding: "10px 14px" }}>
        {[["map", "Map"], ["trails", "Trails"], ["journal", "Journal"], ["passport", "Passport"]].map(([id, n]) => (
          <button key={id} onClick={() => setSec(id)} style={{ flex: 1, padding: "8px 0", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 900, fontSize: 12, background: sec === id ? INKD : "#E9DEC2", color: sec === id ? "#F6EFDD" : "#6E6450" }}>{n}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px 90px" }}>
        {sec === "map" && (
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1.5px solid #D8C9A4" }}>
            <img src="./wilds/map.webp" alt="Map of the Fernreach" style={{ width: "100%", display: "block" }} draggable={false} />
            {cfg.trails.map((t) => { const s = status(t); if (s === "locked") return null; return (
              <button key={t.id} onClick={() => { setDet(t.id); setSec("trails"); }} title={t.name}
                style={{ position: "absolute", left: `${t.map[0] * 100}%`, top: `${t.map[1] * 100}%`, transform: "translate(-50%,-50%)", width: s === "active" ? 17 : 13, height: s === "active" ? 17 : 13, borderRadius: 99, border: "2px solid #FFFDF6", cursor: "pointer", background: s === "done" ? "#B9860B" : s === "active" ? "#7A3D2E" : "#4A4234", boxShadow: "0 1px 5px rgba(30,24,10,.5)" }} />); })}
            <div style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(246,239,221,.92)", borderRadius: 10, padding: "7px 10px", fontSize: 9.5, fontWeight: 800, color: INKD }}>● walked in gold · undiscovered trails stay hidden</div>
          </div>
        )}
        {sec === "trails" && !trail && (<>
          {w.spotlight.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".1em", color: MUTB, margin: "6px 2px" }}>TODAY'S WALKS</div>
              {w.spotlight.map((t) => (
                <button key={t.id} className="rtap" onClick={() => setDet(t.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 11, background: "#FBF5E6", border: "1.5px solid #E8DCBC", borderRadius: 14, padding: "10px 13px", marginBottom: 7, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 17 }}>🥾</span>
                  <span style={{ flex: 1, fontWeight: 800, fontSize: 13, color: INKD }}>{t.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: MUTB }}>{t.miles} mi</span>
                </button>))}
            </div>)}
          {areas.map(([area, ts]) => {
            const visible = ts.filter((t) => status(t) !== "locked");
            const lockedN = ts.length - visible.length;
            if (!visible.length && !Object.keys(done).length) return null;
            return (
              <div key={area} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".1em", color: MUTB, margin: "6px 2px" }}>{area.toUpperCase()}{lockedN > 0 ? ` · ${lockedN} UNDISCOVERED` : ""}</div>
                {visible.map((t) => { const s = status(t); return (
                  <button key={t.id} className="rtap" onClick={() => setDet(t.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 11, background: "#FBF5E6", border: "1.5px solid #E8DCBC", borderRadius: 14, padding: "11px 13px", marginBottom: 7, cursor: "pointer", textAlign: "left", opacity: 1 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 99, flexShrink: 0, background: s === "done" ? "#B9860B" : s === "active" ? "#7A3D2E" : "#8A9A7B" }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 800, fontSize: 13.5, color: INKD }}>{t.name}{t.role === "marquee" ? " ★" : ""}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: MUTB }}>{t.miles} mi · {t.routeSteps.toLocaleString()} steps · {t.archetype}{t.gateText ? " · gated" : ""}</span>
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: WD_TIER[t.finish].ink }}>{WD_TIER[t.finish].name.toUpperCase()}</span>
                  </button>); })}
              </div>);
          })}
        </>)}
        {sec === "trails" && trail && (() => {
          const s = status(trail), p = (wd.progress || {})[trail.id], rec = done[trail.id];
          const pct = rec ? 1 : p ? Math.min(1, p.applied / trail.routeSteps) : 0;
          const route = cfg.routes[trail.id];
          return (
            <div>
              <button className="rghost" onClick={() => setDet(null)} style={{ marginBottom: 10 }}>← All trails</button>
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #D8C9A4", marginBottom: 12, position: "relative" }}>
                <img src={`./wilds/canvas-${trail.id}.webp`} alt="" style={{ width: "100%", display: "block", marginBottom: -2, maxHeight: 210, objectFit: "cover", objectPosition: "top" }} draggable={false} />
              </div>
              <div className="rh" style={{ fontSize: 22, fontFamily: '"IM Fell English", Georgia, serif', fontVariant: "small-caps" }}>{trail.name}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTB, marginBottom: 8 }}>{trail.area} · {trail.archetype} · <b style={{ color: WD_TIER[trail.finish].ink }}>{WD_TIER[trail.finish].name}</b></div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: INKD, marginBottom: 6 }}>{trail.miles} miles · {trail.routeSteps.toLocaleString()} route steps</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTB, marginBottom: 10 }}>
                {trail.segments.map((sg) => `${sg.miles} mi ${sg.terrain}`).join(" → ")}
                {trail.gateText && <span style={{ display: "block", marginTop: 4, color: "#7A3D2E" }}>⛰ Gate: {trail.gateText} — unlocks passage; the miles still cost their steps.</span>}
              </div>
              <div style={{ position: "relative", background: "#EFE5CC", borderRadius: 14, padding: "10px 8px", marginBottom: 12, overflow: "hidden" }}>
                <img src={"./wilds/canvas-" + trail.id + ".webp"} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 62%", opacity: .55, filter: "saturate(.85)" }} draggable={false} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(243,234,215,.5), rgba(243,234,215,.12) 30%, rgba(243,234,215,.12) 70%, rgba(243,234,215,.5))" }} />
                <div style={{ position: "relative" }}>
                <RouteSVG d={route.d} kind={route.kind} progress={rec ? 1 : pct} camps={(rec?.camps || p?.camps || []).map((c) => c.at / trail.routeSteps)} tier={trail.finish} live={s === "active"} height={150} />
                {s === "active" && p && <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "#4A4234", textShadow: "0 1px 2px rgba(255,251,238,.9)" }}>{p.applied.toLocaleString()} of {trail.routeSteps.toLocaleString()} steps walked{p.camps.length ? ` · camped ${p.camps.length}×` : ""}</div>}
                </div>
              </div>
              {rec ? (
                <button className="rbtn" style={{ width: "100%" }} onClick={() => setCard(trail.id)}>View trophy card</button>
              ) : s === "active" ? (
                <button className="rghost" style={{ width: "100%" }} onClick={w.rest}>Rest here (progress is kept)</button>
              ) : s === "open" ? (
                <button className="rbtn" style={{ width: "100%" }} onClick={() => w.setOut(trail.id)}>{p ? "Continue this trail" : wd.active ? "Switch to this trail" : "Set out"}</button>
              ) : (
                <div style={{ textAlign: "center", fontSize: 11.5, fontWeight: 800, color: MUTB, padding: 10 }}>Undiscovered — complete {trail.prereqs.filter((x) => x !== "trailhead").map((x) => cfg.byId[x]?.name || x).join(", ")} first.</div>
              )}
              {wd.spillover?.steps > 0 && s === "open" && <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, fontWeight: 800, color: "#7A6A3A" }}>Your legs kept walking — {wd.spillover.steps.toLocaleString()} steps carry over if you set out today.</div>}
            </div>);
        })()}
        {sec === "journal" && (
          Object.keys(done).length === 0 ? <div style={{ textAlign: "center", padding: 40, fontWeight: 800, color: MUTB, fontSize: 13 }}>No trails completed yet.<br />The first card is waiting at the end of a walk.</div> :
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            {Object.entries(done).map(([tid, rec]) => { const t = cfg.byId[tid]; if (!t) return null; return (
              <button key={tid} onClick={() => setCard(tid)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
                <TrophyCard trail={t} rec={rec} route={cfg.routes[tid]} compact />
              </button>); })}
          </div>
        )}
        {sec === "passport" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, padding: "8px 2px" }}>
            {cfg.trails.filter((t) => done[t.id] || openIds.has(t.id)).map((t) => done[t.id] ? (
              <div key={t.id} style={{ display: "grid", placeItems: "center" }}><StampSeal trail={t} rec={done[t.id]} size={96} /></div>
            ) : (
              <div key={t.id} style={{ width: 96, height: 96, borderRadius: 99, border: "2.5px dashed #CFC1A0", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 800, color: "#B4A785", textAlign: "center", padding: 8, justifySelf: "center" }}>{t.name}</div>
            ))}
          </div>
        )}
      </div>
      {card && (() => { const t = cfg.byId[card]; return (
        <div style={{ position: "fixed", inset: 0, zIndex: 92, display: "grid", placeItems: "center", padding: 22 }} onClick={() => setCard(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(24,20,12,.72)", backdropFilter: "blur(3px)" }} />
          <div style={{ position: "relative", width: "min(340px, 88vw)" }} onClick={(e) => e.stopPropagation()}>
            <TrophyCard trail={t} rec={done[card]} route={cfg.routes[card]} />
            <button onClick={() => setCard(null)} style={{ margin: "14px auto 0", display: "block", background: "#F0E7CF", border: "none", borderRadius: 99, padding: "10px 24px", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>Close</button>
          </div>
        </div>); })()}
    </div>
  );
}
