/**
 * ATHAR | أثر — Wishlist UI bindings (Supabase-backed, guest session id).
 * Depends on js/supabase-client.js + js/products-api.js.
 */
(function () {
  'use strict';

  var activeIds = {};

  document.addEventListener('DOMContentLoaded', async function () {
    await hydrate();
    bindToggle();
  });

  async function hydrate() {
    if (!window.AtharDB || !window.AtharDB.isConfigured) return;
    var sessionId = window.AtharDB.getSessionId();
    var res = await window.AtharDB.wishlist.list(sessionId);
    var rows = res.data || [];
    activeIds = {};
    rows.forEach(function (r) { activeIds[r.product_id] = true; });
    applyState();
    updateCount(rows.length);
  }

  function applyState() {
    document.querySelectorAll('[data-fav-toggle]').forEach(function (btn) {
      btn.classList.toggle('is-active', !!activeIds[btn.dataset.id]);
    });
  }

  function updateCount(n) {
    document.querySelectorAll('[data-fav-count]').forEach(function (el) { el.textContent = n; });
  }

  function bindToggle() {
    document.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-fav-toggle]');
      if (!btn) return;
      e.preventDefault();

      if (!window.AtharDB || !window.AtharDB.isConfigured) {
        if (window.AtharToast) window.AtharToast('المتجر غير متصل بقاعدة البيانات بعد');
        return;
      }

      var id = btn.dataset.id;
      var sessionId = window.AtharDB.getSessionId();
      btn.disabled = true;
      var res = await window.AtharDB.wishlist.toggle(sessionId, id);
      btn.disabled = false;

      activeIds[id] = res.active;
      btn.classList.toggle('is-active', res.active);
      updateCount(Object.keys(activeIds).filter(function (k) { return activeIds[k]; }).length);

      if (window.AtharToast) window.AtharToast(res.active ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
    });
  }

  window.AtharWishlist = { refresh: hydrate };
})();
