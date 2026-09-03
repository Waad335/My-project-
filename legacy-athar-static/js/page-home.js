/**
 * ATHAR | أثر — Home page: loads Featured / New Arrivals / Best Sellers from Supabase.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    var featured = document.getElementById('featuredGrid');
    var newArrivals = document.getElementById('newArrivalsGrid');
    var bestSellers = document.getElementById('bestSellersGrid');
    if (!featured && !newArrivals && !bestSellers) return;

    if (!window.AtharDB || !window.AtharDB.isConfigured) {
      var msg = window.AtharUI.emptyState('لم يتم توصيل المتجر بقاعدة البيانات بعد. راجعي supabase/README.md.');
      [featured, newArrivals, bestSellers].forEach(function (el) { if (el) el.innerHTML = msg; });
      return;
    }

    [featured, newArrivals, bestSellers].forEach(function (el) {
      if (el) el.innerHTML = window.AtharUI.productGridSkeleton(4);
    });

    var results = await Promise.all([
      window.AtharDB.products.list({ featuredOnly: true, limit: 8 }),
      window.AtharDB.products.list({ newArrivalOnly: true, limit: 4 }),
      window.AtharDB.products.list({ bestsellerOnly: true, limit: 4 })
    ]);

    fill(featured, results[0], 'لا توجد منتجات مميزة حالياً.');
    fill(newArrivals, results[1], 'لا توجد وصولات جديدة حالياً.');
    fill(bestSellers, results[2], 'لا توجد منتجات أكثر مبيعاً حالياً.');

    if (window.AtharWishlist) window.AtharWishlist.refresh();
  });

  function fill(el, res, emptyMsg) {
    if (!el) return;
    var products = res.data || [];
    if (res.error) {
      el.innerHTML = window.AtharUI.emptyState('تعذّر تحميل المنتجات.');
      console.error(res.error);
      return;
    }
    el.innerHTML = products.length
      ? products.map(window.AtharUI.productCardHTML).join('')
      : window.AtharUI.emptyState(emptyMsg);
  }
})();
