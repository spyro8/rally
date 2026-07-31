/* Supabase kv storage — faithful port of the original client semantics.
   Table: kv(key text PK, value jsonb, updated_at). Config: {url, key}. */
let CFG = null;
function cfgP() {
  if (CFG) return CFG;
  CFG = fetch("./config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    if (!c.url || !c.key || c.url.includes("PASTE")) throw new Error("config not set");
    const base = c.url.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    return { rest: `${base}/rest/v1/kv`, headers: { apikey: c.key, Authorization: `Bearer ${c.key}`, "Content-Type": "application/json" } };
  });
  return CFG;
}
export async function sSet(key, val, shared) {
  if (!shared) { localStorage.setItem(key, JSON.stringify(val)); return "synced"; }
  try {
    const c = await cfgP();
    const r = await fetch(c.rest, { method: "POST", headers: { ...c.headers, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key, value: val, updated_at: new Date().toISOString() }) });
    return r.ok ? "synced" : "local";
  } catch { return "local"; }
}
export async function sGet(key, shared) {
  if (!shared) { const n = localStorage.getItem(key); return n ? JSON.parse(n) : null; }
  try {
    const c = await cfgP();
    const r = await fetch(`${c.rest}?select=value&key=eq.${encodeURIComponent(key)}`, { headers: c.headers });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows.length ? rows[0].value : null;
  } catch { return null; }
}
export async function sList(prefix) {
  try {
    const c = await cfgP();
    const r = await fetch(`${c.rest}?select=key&key=like.${encodeURIComponent(prefix)}*`, { headers: c.headers });
    if (!r.ok) return [];
    return (await r.json()).map((x) => x.key);
  } catch { return []; }
}
export async function sDel(key, shared) {
  if (!shared) { localStorage.removeItem(key); return; }
  try { const c = await cfgP(); await fetch(`${c.rest}?key=eq.${encodeURIComponent(key)}`, { method: "DELETE", headers: c.headers }); } catch { }
}
