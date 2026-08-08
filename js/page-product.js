/**
 * ATHAR | أثر — Product detail page.
 */
(function () {
  'use strict';

  var CURRENCY = 'ر.س';

  document.addEventListener('DOMContentLoaded', async function () {
    var content = document.getElementById('pdpContent');
    if (!content) return;

    var slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) { showNotFound(); return; }

    if (!window.AtharDB || !window.AtharDB.isConfigured) {
      content.innerHTML = window.AtharUI.emptyState('لم يتم توصيل المتجر بقاعدة البيانات بعد. راجعي supabase/README.md.');
      return;
    }

    var res = await window.AtharDB.products.getBySlug(slug);
    if (res.error || !res.data) { showNotFound(); return; }

    renderProduct(res.data);
    loadRelated(res.data);
    if (window.AtharWishlist) window.AtharWishlist.refresh();
  });

  function showNotFound() {
    var content = document.getElementById('pdpContent');
    content.innerHTML = window.AtharUI.emptyState('المنتج غير موجود أو تمت إزالته. <a href="products.html" style="color:var(--gold-dark);text-decoration:underline">تصفّحي كل المنتجات</a>');
  }

  function money(n) { return Number(n).toLocaleString('ar') + ' ' + CURRENCY; }

  function renderProduct(product) {
    document.title = product.name_ar + ' | أثر ATHAR';
    var descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', (product.description_ar || product.name_ar).slice(0, 160));

    var bcName = document.getElementById('pdpBreadcrumbName');
    if (bcName) bcName.textContent = product.name_ar;

    var images = (product.product_images || []).slice().sort(function (a, b) { return a.sort_order - b.sort_order; });
    if (!images.length) images = [{ image_url: 'assets/img/products/handles-placeholder.svg' }];

    var oos = window.AtharUI.outOfStock(product);
    var hasDiscount = product.discount_price != null && product.discount_price < product.price;
    var effectivePrice = hasDiscount ? product.discount_price : product.price;
    var categoryLabel = (product.category && product.category.name_ar) || '';

    var content = document.getElementById('pdpContent');
    content.innerHTML =
      '<div class="pdp-wrap">' +
        '<div data-reveal="scale">' +
          '<div class="pdp-gallery-main"><img id="pdpMainImage" src="' + images[0].image_url + '" alt="' + product.name_ar + '"></div>' +
          (images.length > 1 ? '<div class="pdp-thumbs">' + images.map(function (img, i) {
            return '<button type="button" class="pdp-thumb' + (i === 0 ? ' is-active' : '') + '" data-thumb="' + img.image_url + '"><img src="' + img.image_url + '" alt=""></button>';
          }).join('') + '</div>' : '') +
        '</div>' +
        '<div data-reveal>' +
          '<p class="pdp-category">' + categoryLabel + '</p>' +
          '<h1 class="pdp-title">' + product.name_ar + '</h1>' +
          '<div class="pdp-price-row">' +
            '<span class="pdp-price-now">' + money(effectivePrice) + '</span>' +
            (hasDiscount ? '<span class="pdp-price-old">' + money(product.price) + '</span>' : '') +
            (hasDiscount ? '<span class="pdp-discount-badge">خصم ' + Math.round((1 - product.discount_price / product.price) * 100) + '%</span>' : '') +
          '</div>' +
          '<div class="stock-badge ' + (oos ? 'out-stock' : 'in-stock') + '"><span class="dot"></span>' +
            (oos ? 'نفدت الكمية حالياً' : 'متوفر في المخزون (' + product.stock_quantity + ' قطعة)') +
          '</div>' +
          '<p class="pdp-desc">' + (product.description_ar || 'قطعة فاخرة من أثر، مصنوعة بعناية فائقة لتمنحك لمسة من الأناقة.') + '</p>' +
          (!oos ? (
            '<div class="qty-selector">' +
              '<button type="button" id="pdpQtyDec" aria-label="تقليل الكمية">−</button>' +
              '<input type="number" id="pdpQty" data-qty-input value="1" min="1" max="' + product.stock_quantity + '" aria-label="الكمية">' +
              '<button type="button" id="pdpQtyInc" aria-label="زيادة الكمية">+</button>' +
            '</div>'
          ) : '') +
          '<div class="pdp-actions">' +
            '<button class="btn btn-gold" ' + (oos ? 'disabled aria-disabled="true" style="opacity:.5;pointer-events:none"' : '') +
              ' data-add-cart data-use-qty-input="true" data-id="' + product.id + '" data-name="' + product.name_ar.replace(/"/g, '&quot;') + '" data-price="' + effectivePrice + '" data-image="' + images[0].image_url + '">' +
              (oos ? 'غير متوفر حالياً' : 'أضيفي إلى السلة') +
            '</button>' +
            '<button type="button" class="pdp-fav-btn" data-fav-toggle data-id="' + product.id + '" aria-label="أضف إلى المفضلة"><svg viewBox="0 0 24 24"><use href="#icon-heart"></use></svg></button>' +
          '</div>' +
          '<div class="pdp-meta">' +
            '<span>رمز المنتج (SKU): ' + product.sku + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    content.querySelectorAll('.pdp-thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        content.querySelectorAll('.pdp-thumb').forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
        document.getElementById('pdpMainImage').src = thumb.dataset.thumb;
      });
    });

    var qtyInput = document.getElementById('pdpQty');
    var dec = document.getElementById('pdpQtyDec');
    var inc = document.getElementById('pdpQtyInc');
    if (qtyInput && dec && inc) {
      dec.addEventListener('click', function () {
        qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
      });
      inc.addEventListener('click', function () {
        var max = parseInt(qtyInput.max, 10) || 99;
        qtyInput.value = Math.min(max, (parseInt(qtyInput.value, 10) || 1) + 1);
      });
    }
  }

  async function loadRelated(product) {
    if (!product.category_id) return;
    var res = await window.AtharDB.products.related(product.category_id, product.id, 4);
    var products = res.data || [];
    if (!products.length) return;

    document.getElementById('relatedSection').style.display = '';
    document.getElementById('relatedGrid').innerHTML = products.map(window.AtharUI.productCardHTML).join('');
    if (window.AtharWishlist) window.AtharWishlist.refresh();
  }
})();
