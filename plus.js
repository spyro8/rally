/* SPYR+ gate for rooms (v52.56). SPYR works out what is locked and keeps it in localStorage "spyr:plus";
   rooms read it here. Locked controls look exactly the same: tapping one opens the SPYR+ screen. */
(function () {
  function st() { try { return JSON.parse(localStorage.getItem('spyr:plus') || 'null'); } catch (e) { return null; } }
  function can(k) { var s = st(); return !s || !Array.isArray(s.locked) || s.locked.indexOf(k) < 0; }
  function ask(k) {
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'spyr:paywall', from: k }, location.origin);
      else window.dispatchEvent(new CustomEvent('spyr:paywall', { detail: { from: k } }));
    } catch (e) {}
  }
  /* stop taps on matching controls while k is locked */
  function guard(k, selector) {
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest(selector);
      if (!t || can(k)) return;
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); ask(k);
    }, true);
  }
  window.SPYR_PLUS = { can: can, ask: ask, guard: guard, state: st };
})();
