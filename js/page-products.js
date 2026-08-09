/**
 * ATHAR | أثر — Products page: category pills + search + sort + price filter,
 * all backed by live Supabase queries. Filter state is reflected in the URL
 * query string so results are shareable/bookmarkable.
 */
(function () {
  'use strict';

  var grid = document.getElementById('productsGrid');
  var pillsWrap = document.getElementById('categoryPills');
  var searchInput = document.getElementById('searchInput');
  var sortSelect = document.getElementById('sortSelect');
  var minPrice = document.getElementById('minPrice');
  var maxPrice = document.getElementById('maxPrice');
  if (!grid) return;

  var state = readStateFromURL();
  var searchDebounce;

  document.addEventListener('DOMContentLoaded', async function () {
    if (!window.AtharDB || !window.AtharDB.isConfigured) {
      grid.innerHTML = window.AtharUI.emptyState('لم يتم توصيل المتجر بقاعدة البيانات بعد. راجعي supabase/README.md.');
      return;
    }

    hydrateControls();
    await renderCategoryPills();
    await loadProducts();

    searchInput.addEventListener('input', function () {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () {
        state.search = searchInput.value.trim();
        syncURL();
        loadProducts();
      }, 350);
    });

    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      syncURL();
      loadProducts();
    });

    [minPrice, maxPrice].forEach(function (el) {
      el.addEventListener('change', function () {
        state.min = minPrice.value || null;
        state.max = maxPrice.value || null;
        syncURL();
        loadProducts();
      });
    });
  });

  function readStateFromURL() {
    var params = new URLSearchParams(window.location.search);
    return {
      category: params.get('category') || 'all',
      search: params.get('search') || '',
      sort: params.get('sort') || 'newest',
      min: params.get('min') || null,
      max: params.get('max') || null
    };
  }

  function syncURL() {
    var params = new URLSearchParams();
    if (state.category && state.category !== 'all') params.set('category', state.category);
    if (state.search) params.set('search', state.search);
    if (state.sort && state.sort !== 'newest') params.set('sort', state.sort);
    if (state.min) params.set('min', state.min);
    if (state.max) params.set('max', state.max);
    var qs = params.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }

  function hydrateControls() {
    searchInput.value = state.search;
    sortSelect.value = state.sort;
    if (state.min) minPrice.value = state.min;
    if (state.max) maxPrice.value = state.max;
  }

  async function renderCategoryPills() {
    var res = await window.AtharDB.categories.list();
    var categories = res.data || [];

    var html = '<button class="filter-pill' + (state.category === 'all' ? ' is-active' : '') + '" data-filter="all">الكل</button>';
    categories.forEach(function (c) {
      html += '<button class="filter-pill' + (state.category === c.slug ? ' is-active' : '') + '" data-filter="' + c.slug + '">' + c.name_ar + '</button>';
    });
    pillsWrap.innerHTML = html;

    pillsWrap.querySelectorAll('.filter-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        pillsWrap.querySelectorAll('.filter-pill').forEach(function (p) { p.classList.remove('is-active'); });
        pill.classList.add('is-active');
        state.category = pill.dataset.filter;
        syncURL();
        loadProducts();
      });
    });
  }

  async function loadProducts() {
    grid.innerHTML = window.AtharUI.productGridSkeleton(8);

    var res = await window.AtharDB.products.list({
      categorySlug: state.category !== 'all' ? state.category : null,
      search: state.search || null,
      minPrice: state.min ? Number(state.min) : null,
      maxPrice: state.max ? Number(state.max) : null,
      sort: state.sort
    });

    if (res.error) {
      grid.innerHTML = window.AtharUI.emptyState('تعذّر تحميل المنتجات، حاولي مرة أخرى.');
      console.error(res.error);
      return;
    }

    var products = res.data || [];
    grid.innerHTML = products.length
      ? products.map(window.AtharUI.productCardHTML).join('')
      : window.AtharUI.emptyState('لا توجد منتجات مطابقة لبحثك.');

    if (window.AtharObserveReveal) window.AtharObserveReveal(grid);
    if (window.AtharWishlist) window.AtharWishlist.refresh();
  }
})();
