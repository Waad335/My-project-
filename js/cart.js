/**
 * ATHAR | أثر — Cart, favorites, and toast notifications.
 * Client-side only (localStorage) — a display/demo layer for the storefront UI.
 */
(function () {
  'use strict';

  var CART_KEY = 'athar_cart_v1';
  var FAV_KEY = 'athar_favs_v1';
  var CURRENCY = 'ر.س';

  var rowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 3h6M10 3v3.2c0 .4-.15.78-.42 1.06L6.9 10c-.6.62-.9 1.45-.9 2.32V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6.68c0-.87-.3-1.7-.9-2.32l-2.68-2.74A1.5 1.5 0 0 1 14 6.2V3"/></svg>';

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var Cart = {
    items: readStore(CART_KEY),
    save: function () { writeStore(CART_KEY, this.items); },
    add: function (item) {
      var existing = this.items.find(function (i) { return i.id === item.id; });
      if (existing) existing.qty += 1;
      else this.items.push(Object.assign({ qty: 1 }, item));
      this.save();
    },
    remove: function (id) {
      this.items = this.items.filter(function (i) { return i.id !== id; });
      this.save();
    },
    count: function () {
      return this.items.reduce(function (sum, i) { return sum + i.qty; }, 0);
    },
    total: function () {
      return this.items.reduce(function (sum, i) { return sum + i.qty * i.price; }, 0);
    }
  };

  var Favs = {
    ids: readStore(FAV_KEY),
    save: function () { writeStore(FAV_KEY, this.ids); },
    toggle: function (id) {
      var idx = this.ids.indexOf(id);
      if (idx > -1) { this.ids.splice(idx, 1); this.save(); return false; }
      this.ids.push(id); this.save(); return true;
    },
    has: function (id) { return this.ids.indexOf(id) > -1; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    hydrateFavButtons();
    updateBadges();
    bindAddToCart();
    bindFavToggle();
    bindDrawer();
    renderDrawer();
  });

  function hydrateFavButtons() {
    document.querySelectorAll('[data-fav-toggle]').forEach(function (btn) {
      if (Favs.has(btn.dataset.id)) btn.classList.add('is-active');
    });
  }

  function updateBadges() {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = Cart.count();
    });
    document.querySelectorAll('[data-fav-count]').forEach(function (el) {
      el.textContent = Favs.ids.length;
    });
  }

  function bindAddToCart() {
    document.querySelectorAll('[data-add-cart]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var card = btn.closest('[data-product]') || document;
        Cart.add({
          id: btn.dataset.id,
          name: btn.dataset.name || (card.querySelector('.product-name') || {}).textContent || 'منتج أثر',
          price: parseFloat(btn.dataset.price || '0')
        });
        updateBadges();
        renderDrawer();
        showToast('تمت إضافة المنتج إلى سلتك بنجاح');
        btn.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(0.85)' }, { transform: 'scale(1)' }],
          { duration: 380, easing: 'ease-out' }
        );
      });
    });
  }

  function bindFavToggle() {
    document.querySelectorAll('[data-fav-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var active = Favs.toggle(btn.dataset.id);
        btn.classList.toggle('is-active', active);
        updateBadges();
        showToast(active ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
      });
    });
  }

  function bindDrawer() {
    var drawer = document.querySelector('.cart-drawer');
    var scrim = document.querySelector('.overlay-scrim');
    if (!drawer) return;

    function open() {
      drawer.classList.add('is-open');
      if (scrim) scrim.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('is-open');
      if (scrim) scrim.classList.remove('is-visible');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-cart-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    document.querySelectorAll('[data-cart-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    if (scrim) scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function renderDrawer() {
    var body = document.querySelector('[data-cart-body]');
    var totalEl = document.querySelector('[data-cart-total]');
    if (!body) return;

    if (!Cart.items.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/></svg>' +
        '<p>سلتك فارغة حالياً</p>' +
        '</div>';
    } else {
      body.innerHTML = Cart.items.map(function (i) {
        return (
          '<div class="cart-row">' +
          '<div class="cart-row-media">' + rowIcon + '</div>' +
          '<div class="cart-row-info">' +
          '<h4>' + i.name + '</h4>' +
          '<span>الكمية: ' + i.qty + ' &times; ' + i.price + ' ' + CURRENCY + '</span>' +
          '<div class="cart-row-remove" data-remove="' + i.id + '">إزالة</div>' +
          '</div>' +
          '</div>'
        );
      }).join('');

      body.querySelectorAll('[data-remove]').forEach(function (el) {
        el.addEventListener('click', function () {
          Cart.remove(el.dataset.remove);
          updateBadges();
          renderDrawer();
        });
      });
    }

    if (totalEl) totalEl.textContent = Cart.total().toLocaleString('ar') + ' ' + CURRENCY;
  }

  var toastTimer;
  function showToast(message) {
    var toast = document.querySelector('.toast');
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  window.AtharCart = Cart;
  window.AtharFavs = Favs;
})();
