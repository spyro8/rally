/* SPYR GYM launcher — v52.22
   Adds a vertical green tab on the Home screen that opens SPYR GYM (./gym/) in a
   full-screen same-origin iframe. Completed sessions are captured to
   localStorage under "spyr:gym:completions" for the host app to consume. */
(() => {
  'use strict';
  const GYM_URL = './gym/index.html';
  const STORE = 'spyr:gym:completions';
  const doc = document;

  /* ---------- styles ---------- */
  const css = doc.createElement('style');
  css.textContent = `
  .spyr-gym-tab{position:fixed;right:0;top:50%;transform:translateY(-50%) translateX(0);z-index:9000;
    writing-mode:vertical-rl;text-orientation:mixed;
    display:inline-flex;align-items:center;gap:10px;
    padding:16px 10px 16px 11px;border-radius:12px 0 0 12px;
    background:#2E6B3F;color:#F3ECE1;border:1px solid rgba(243,236,225,.28);border-right:0;
    box-shadow:-4px 0 18px rgba(0,0,0,.22);
    font:600 12px/1 -apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;letter-spacing:.16em;text-transform:uppercase;
    cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;
    transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .2s;}
  .spyr-gym-tab[hidden]{display:none}
  .spyr-gym-tab.away{transform:translateY(-50%) translateX(110%);opacity:0;pointer-events:none}
  .spyr-gym-tab:active{background:#255834}
  .spyr-gym-tab .dot{width:6px;height:6px;border-radius:50%;background:#dcefa3;box-shadow:0 0 8px #dcefa3}
  .spyr-gym-overlay{position:fixed;inset:0;z-index:9500;background:#101b18;display:none}
  .spyr-gym-overlay.open{display:block}
  .spyr-gym-overlay iframe{width:100%;height:100%;border:0;display:block;background:#101b18}
  @supports (height:100dvh){.spyr-gym-overlay{height:100dvh}}
  body.spyr-gym-open{overflow:hidden}
  `;
  doc.head.appendChild(css);

  /* ---------- elements ---------- */
  const tab = doc.createElement('button');
  tab.type = 'button';
  tab.className = 'spyr-gym-tab';
  tab.setAttribute('aria-label', 'Open SPYR GYM');
  tab.innerHTML = '<span class="dot"></span><span>SPYR GYM</span>';
  tab.hidden = true;

  const overlay = doc.createElement('div');
  overlay.className = 'spyr-gym-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'SPYR GYM');
  const frame = doc.createElement('iframe');
  frame.title = 'SPYR GYM';
  frame.allow = 'fullscreen; autoplay';
  overlay.appendChild(frame);

  doc.body.append(tab, overlay);

  /* ---------- open / close ---------- */
  let open = false;
  function openGym() {
    if (open) return;
    open = true;
    if (!frame.src) frame.src = GYM_URL;
    overlay.classList.add('open');
    doc.body.classList.add('spyr-gym-open');
    tab.classList.add('away');
    try { history.pushState({ spyrGym: true }, ''); } catch {}
    const meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) { meta.dataset.prev = meta.content; meta.content = '#101b18'; }
  }
  function closeGym() {
    if (!open) return;
    open = false;
    overlay.classList.remove('open');
    doc.body.classList.remove('spyr-gym-open');
    tab.classList.remove('away');
    const meta = doc.querySelector('meta[name="theme-color"]');
    if (meta && meta.dataset.prev) meta.content = meta.dataset.prev;
    // Drop the iframe so a resumed session starts from the library next time.
    frame.removeAttribute('src');
  }
  tab.addEventListener('click', openGym);
  window.addEventListener('popstate', () => { if (open) closeGym(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeGym(); });

  /* ---------- messages from the gym ---------- */
  window.addEventListener('message', e => {
    if (e.source !== frame.contentWindow || e.origin !== location.origin) return;
    const d = e.data || {};
    if (d.type === 'spyr:gym-exit') { closeGym(); return; }
    if (d.type === 'spyr:gym-complete' && d.record) {
      try {
        const list = JSON.parse(localStorage.getItem(STORE) || '[]');
        const rec = d.record;
        const entry = {
          logId: rec.logId || (rec.date + ':' + (rec.title || rec.id || 'session')),
          date: rec.date || new Date().toISOString(),
          title: rec.title || rec.id || 'SPYR GYM session',
          trainer: rec.trainer ?? null,
          elapsed: Number(rec.elapsed) || 0,
          complete: !!rec.complete,
          stamp: rec.stamp ?? null,
          source: 'spyr-gym'
        };
        const next = list.filter(x => x.logId !== entry.logId).concat(entry).slice(-200);
        localStorage.setItem(STORE, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('spyr:gym-complete', { detail: entry }));
      } catch {}
    }
  });

  /* ---------- show only on Home ---------- */
  function onHome() {
    const nav = doc.querySelector('nav.rnav');
    if (!nav) return false;
    const on = nav.querySelector('button.on');
    return !!on && /home/i.test(on.textContent || '');
  }
  function sync() { tab.hidden = !onHome(); }
  const mo = new MutationObserver(() => { sync(); });
  mo.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  sync();

  /* Small public surface for the host app to read/clear captured sessions. */
  window.SPYR_GYM = {
    open: openGym,
    close: closeGym,
    completions: () => { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; } },
    clear: () => localStorage.removeItem(STORE)
  };
})();
