/**
 * ATHAR | أثر — Shared product/category card renderers.
 * Produces the same markup/classes as the original static cards so the
 * existing CSS (css/components.css) needs no changes.
 */
(function () {
  'use strict';

  var CURRENCY = 'ج.م';
  // Pages nested in a subfolder (e.g. admin/) set window.ATHAR_ASSET_BASE = '../'
  // before this script loads so local asset paths still resolve correctly.
  var ASSET_BASE = window.ATHAR_ASSET_BASE || '';
  var FALLBACK_IMG = ASSET_BASE + 'assets/img/products/handles-placeholder.svg';

  /**
   * Product image_urls are either full Storage URLs (uploaded via the admin —
   * always start with http) or root-relative seed paths like
   * "assets/img/products/x.svg" (portable across root-level pages AND
   * subpath deployments, e.g. GitHub Pages project sites). The latter only
   * resolve correctly from a page at the site root, so pages nested in a
   * subfolder need ASSET_BASE prefixed back on.
   */
  function resolveImageUrl(url) {
    if (!url) return FALLBACK_IMG;
    if (/^(https?:)?\/\//.test(url) || url.indexOf('data:') === 0) return url;
    return ASSET_BASE + url;
  }

  function firstImage(product) {
    var imgs = (product.product_images || []).slice().sort(function (a, b) { return a.sort_order - b.sort_order; });
    return imgs.length ? resolveImageUrl(imgs[0].image_url) : FALLBACK_IMG;
  }

  function money(n) {
    return Number(n).toLocaleString('ar') + ' ' + CURRENCY;
  }

  function badge(product) {
    if (product.is_bestseller) return '<span class="product-badge">الأكثر مبيعاً</span>';
    if (product.is_new_arrival) return '<span class="product-badge badge-gold">جديد</span>';
    return '';
  }

  function outOfStock(product) {
    return !product.is_available || product.stock_quantity <= 0;
  }

  function productCardHTML(product) {
    var oos = outOfStock(product);
    var hasDiscount = product.discount_price != null && product.discount_price < product.price;
    var effectivePrice = hasDiscount ? product.discount_price : product.price;
    var categoryLabel = (product.category && product.category.name_ar) || '';

    return (
      '<article class="product-card" data-product data-category="' + ((product.category && product.category.slug) || '') + '">' +
        '<a href="product.html?slug=' + encodeURIComponent(product.slug) + '" class="product-media" aria-label="' + product.name_ar + '">' +
          badge(product) +
          (oos ? '<span class="product-badge" style="inset-inline-start:auto;inset-inline-end:14px;background:#8a5a4a">نفدت الكمية</span>' : '') +
          '<img src="' + firstImage(product) + '" alt="' + product.name_ar + '" loading="lazy" style="width:100%;height:100%;object-fit:contain;position:absolute;inset:0">' +
        '</a>' +
        '<button class="fav-btn" data-fav-toggle data-id="' + product.id + '" aria-label="أضف إلى المفضلة"><svg viewBox="0 0 24 24"><use href="#icon-heart"></use></svg></button>' +
        '<div class="product-info">' +
          '<p class="product-cat">' + categoryLabel + (product.size ? ' · ' + product.size : '') + '</p>' +
          '<h3 class="product-name"><a href="product.html?slug=' + encodeURIComponent(product.slug) + '">' + product.name_ar + '</a></h3>' +
          '<div class="product-footer">' +
            '<div class="product-price">' +
              '<span class="price-now">' + money(effectivePrice) + '</span>' +
              (hasDiscount ? '<span class="price-old">' + Number(product.price).toLocaleString('ar') + '</span>' : '') +
            '</div>' +
            '<button class="add-cart-btn" ' + (oos ? 'disabled aria-disabled="true" style="opacity:.4;pointer-events:none"' : '') +
              ' data-add-cart data-id="' + product.id + '" data-name="' + product.name_ar.replace(/"/g, '&quot;') + '" data-price="' + effectivePrice + '" data-image="' + firstImage(product) + '" aria-label="أضف إلى السلة">' +
              '<svg viewBox="0 0 24 24"><use href="#icon-cart"></use></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function productGridSkeleton(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<div class="product-card" style="height:380px;background:linear-gradient(90deg,#F7F1E6 25%,#E3CFB1 37%,#F7F1E6 63%);background-size:400% 100%;animation:athar-skeleton 1.4s ease infinite"></div>';
    }
    return html;
  }

  function emptyState(message) {
    return '<div style="grid-column:1/-1;text-align:center;padding:var(--space-6) 0;color:var(--ink-soft)">' +
      '<svg viewBox="0 0 24 24" style="width:48px;height:48px;stroke:var(--gold);margin:0 auto var(--space-2);opacity:.6" fill="none" stroke-width="1.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
      '<p>' + message + '</p></div>';
  }

  window.AtharUI = {
    money: money,
    firstImage: firstImage,
    resolveImageUrl: resolveImageUrl,
    outOfStock: outOfStock,
    productCardHTML: productCardHTML,
    productGridSkeleton: productGridSkeleton,
    emptyState: emptyState
  };

  var style = document.createElement('style');
  style.textContent = '@keyframes athar-skeleton { 0%{background-position:100% 0} 100%{background-position:0 0} }';
  document.head.appendChild(style);
})();
