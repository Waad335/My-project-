/**
 * ATHAR | أثر — Shopping cart + toast notifications.
 * Cart state lives in localStorage (persists across visits) and is snapshotted
 * into the `orders` / `order_items` tables in Supabase at checkout time.
 * See js/wishlist-ui.js for the (Supabase-backed) wishlist/favorites feature.
 */
(function () {
  'use strict';

  var CART_KEY = 'athar_cart_v1';
  var CURRENCY = 'جنيه مصري';

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
    add: function (item, qty) {
      qty = qty || 1;
      var existing = this.items.find(function (i) { return i.id === item.id; });
      if (existing) existing.qty += qty;
      else this.items.push(Object.assign({ qty: qty }, item));
      this.save();
    },
    setQty: function (id, qty) {
      var item = this.items.find(function (i) { return i.id === id; });
      if (!item) return;
      if (qty <= 0) { this.remove(id); return; }
      item.qty = qty;
      this.save();
    },
    remove: function (id) {
      this.items = this.items.filter(function (i) { return i.id !== id; });
      this.save();
    },
    clear: function () {
      this.items = [];
      this.save();
    },
    count: function () {
      return this.items.reduce(function (sum, i) { return sum + i.qty; }, 0);
    },
    total: function () {
      return this.items.reduce(function (sum, i) { return sum + i.qty * i.price; }, 0);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateBadges();
    bindAddToCart();
    bindDrawer();
    renderDrawer();
  });

  function updateBadges() {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = Cart.count();
    });
  }

  function bindAddToCart() {
    // Delegated so it also works for product cards rendered dynamically after load.
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add-cart]');
      if (!btn || btn.disabled) return;
      e.preventDefault();
      var qtyInput = document.querySelector('[data-qty-input]');
      var qty = (qtyInput && btn.dataset.useQtyInput) ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;

      Cart.add({
        id: btn.dataset.id,
        name: btn.dataset.name || 'منتج أثر',
        price: parseFloat(btn.dataset.price || '0'),
        image: btn.dataset.image || ''
      }, qty);

      updateBadges();
      renderDrawer();
      showToast('تمت إضافة المنتج إلى سلتك بنجاح');
      btn.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(0.85)' }, { transform: 'scale(1)' }],
        { duration: 380, easing: 'ease-out' }
      );
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

    window.AtharCartDrawer = { open: open, close: close };
  }

  function renderDrawer() {
    var body = document.querySelector('[data-cart-body]');
    var totalEl = document.querySelector('[data-cart-total]');
    var checkoutLink = document.querySelector('[data-checkout-link]');
    if (!body) return;

    if (!Cart.items.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/></svg>' +
        '<p>سلتك فارغة حالياً</p>' +
        '</div>';
      if (checkoutLink) checkoutLink.classList.add('is-disabled-link');
    } else {
      body.innerHTML = Cart.items.map(function (i) {
        var img = i.image || 'assets/img/products/handles-placeholder.svg';
        return (
          '<div class="cart-row">' +
          '<div class="cart-row-media"><img src="' + img + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:contain;border-radius:inherit"></div>' +
          '<div class="cart-row-info">' +
          '<h4>' + i.name + '</h4>' +
          '<div class="qty-stepper" style="display:flex;align-items:center;gap:10px;margin-top:6px">' +
          '<button type="button" class="qty-btn" data-qty-dec="' + i.id + '" aria-label="تقليل الكمية">−</button>' +
          '<span>' + i.qty + '</span>' +
          '<button type="button" class="qty-btn" data-qty-inc="' + i.id + '" aria-label="زيادة الكمية">+</button>' +
          '<span style="margin-inline-start:auto;color:var(--ink-soft);font-size:.85rem">' + (i.qty * i.price).toLocaleString('ar') + ' ' + CURRENCY + '</span>' +
          '</div>' +
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
      body.querySelectorAll('[data-qty-inc]').forEach(function (el) {
        el.addEventListener('click', function () {
          var item = Cart.items.find(function (i) { return i.id === el.dataset.qtyInc; });
          if (item) Cart.setQty(item.id, item.qty + 1);
          updateBadges();
          renderDrawer();
        });
      });
      body.querySelectorAll('[data-qty-dec]').forEach(function (el) {
        el.addEventListener('click', function () {
          var item = Cart.items.find(function (i) { return i.id === el.dataset.qtyDec; });
          if (item) Cart.setQty(item.id, item.qty - 1);
          updateBadges();
          renderDrawer();
        });
      });
      if (checkoutLink) checkoutLink.classList.remove('is-disabled-link');
    }

    if (totalEl) totalEl.textContent = Cart.total().toLocaleString('ar') + ' ' + CURRENCY;

    document.dispatchEvent(new CustomEvent('athar:cart-updated'));
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
  window.AtharToast = showToast;
  window.AtharRenderCartDrawer = renderDrawer;
})();
