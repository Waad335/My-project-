/**
 * ATHAR | أثر — Checkout page: renders the cart summary, revalidates live
 * price/stock against Supabase right before submit, then creates a real
 * order (orders + order_items) via js/products-api.js.
 */
(function () {
  'use strict';

  var CURRENCY = 'ر.س';
  // Sensible fallbacks if store_settings hasn't loaded yet (or Supabase is offline) —
  // overwritten from the live table as soon as it resolves.
  var shippingFlat = 25;
  var freeShippingThreshold = 300;

  document.addEventListener('DOMContentLoaded', async function () {
    var cart = window.AtharCart;
    var emptyEl = document.getElementById('checkoutEmpty');
    var formWrap = document.getElementById('checkoutForm');
    var successEl = document.getElementById('checkoutSuccess');

    if (!cart || !cart.items.length) {
      emptyEl.style.display = '';
      formWrap.style.display = 'none';
      return;
    }

    if (window.AtharDB && window.AtharDB.isConfigured) {
      var settingsRes = await window.AtharDB.settings.get();
      if (settingsRes.data) {
        shippingFlat = Number(settingsRes.data.shipping_flat_rate);
        freeShippingThreshold = Number(settingsRes.data.free_shipping_threshold);
      }
    }

    renderSummary();
    document.getElementById('orderForm').addEventListener('submit', handleSubmit);

    function shippingFor(subtotal) {
      return subtotal >= freeShippingThreshold ? 0 : shippingFlat;
    }

    function renderSummary() {
      var itemsEl = document.getElementById('checkoutItems');
      var subtotal = cart.total();
      var shipping = shippingFor(subtotal);

      itemsEl.innerHTML = cart.items.map(function (i) {
        var img = i.image || 'assets/img/products/handles-placeholder.svg';
        return (
          '<div class="checkout-item">' +
          '<img src="' + img + '" alt="" loading="lazy">' +
          '<div class="checkout-item-info"><h4>' + i.name + '</h4><span>' + i.qty + ' × ' + i.price.toLocaleString('ar') + ' ' + CURRENCY + '</span></div>' +
          '<strong>' + (i.qty * i.price).toLocaleString('ar') + ' ' + CURRENCY + '</strong>' +
          '</div>'
        );
      }).join('');

      document.getElementById('sumSubtotal').textContent = subtotal.toLocaleString('ar') + ' ' + CURRENCY;
      document.getElementById('sumShipping').textContent = shipping === 0 ? 'مجاني' : shipping.toLocaleString('ar') + ' ' + CURRENCY;
      document.getElementById('sumTotal').textContent = (subtotal + shipping).toLocaleString('ar') + ' ' + CURRENCY;
    }

    async function handleSubmit(e) {
      e.preventDefault();
      var errorBox = document.getElementById('orderError');
      var btn = document.getElementById('placeOrderBtn');
      errorBox.style.display = 'none';

      if (!window.AtharDB || !window.AtharDB.isConfigured) {
        errorBox.textContent = 'تعذّر إتمام الطلب: المتجر غير متصل بقاعدة البيانات بعد.';
        errorBox.style.display = '';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'جارٍ التحقق من توفر المنتجات...';

      // Revalidate live price & stock right before creating the order —
      // the cart is only a snapshot, prices/stock may have changed since it was added.
      var revalidated = [];
      for (var idx = 0; idx < cart.items.length; idx++) {
        var item = cart.items[idx];
        var res = await window.AtharDB.products.getById(item.id);
        if (res.error || !res.data || !res.data.is_available) {
          fail('عذراً، المنتج "' + item.name + '" لم يعد متوفراً. الرجاء إزالته من السلة.');
          return;
        }
        if (res.data.stock_quantity < item.qty) {
          fail('الكمية المتوفرة من "' + item.name + '" هي ' + res.data.stock_quantity + ' فقط. الرجاء تعديل الكمية في السلة.');
          return;
        }
        var livePrice = (res.data.discount_price != null && res.data.discount_price < res.data.price)
          ? res.data.discount_price : res.data.price;
        revalidated.push({ product_id: item.id, name: item.name, unit_price: livePrice, quantity: item.qty });
      }

      var subtotal = revalidated.reduce(function (s, i) { return s + i.unit_price * i.quantity; }, 0);
      var shipping = shippingFor(subtotal);

      btn.textContent = 'جارٍ إرسال الطلب...';

      var orderRes = await window.AtharDB.orders.create({
        customer: {
          name: document.getElementById('fullName').value.trim(),
          phone: document.getElementById('phone').value.trim(),
          email: document.getElementById('email').value.trim(),
          country: document.getElementById('country').value.trim(),
          city: document.getElementById('city').value.trim(),
          address: document.getElementById('address').value.trim(),
          notes: document.getElementById('notes').value.trim()
        },
        items: revalidated,
        shipping: shipping,
        paymentMethod: 'cod'
      });

      if (orderRes.error) {
        fail('تعذّر إرسال طلبك، الرجاء المحاولة مرة أخرى. (' + orderRes.error.message + ')');
        return;
      }

      cart.clear();
      document.getElementById('orderNumberDisplay').textContent = orderRes.data.order_number;
      formWrap.style.display = 'none';
      successEl.style.display = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      function fail(msg) {
        errorBox.textContent = msg;
        errorBox.style.display = '';
        btn.disabled = false;
        btn.textContent = 'تأكيد الطلب';
      }
    }
  });
})();
