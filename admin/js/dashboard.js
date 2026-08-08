/**
 * ATHAR | أثر — Admin Dashboard logic.
 * All writes go through the Supabase client authenticated as the signed-in
 * admin; Row Level Security (supabase/schema.sql) is what actually enforces
 * that only an admin account can perform them — this file is the UI layer.
 */
(function () {
  'use strict';

  var db, categoriesCache = [];
  var currentProductImages = []; // [{image_url, path}] for the product currently being edited
  var originalProductImageUrls = []; // snapshot at modal-open time, to detect removals on save

  document.addEventListener('DOMContentLoaded', async function () {
    var user = await window.AtharAdminGuard.requireAdmin();
    if (!user) return;
    db = window.AtharDB.client;
    document.getElementById('adminUserEmail').textContent = user.email;

    bindShell();
    bindProductsPanel();
    bindCategoriesPanel();
    bindOrdersPanel();
    bindInventoryPanel();
    bindSettingsPanel();

    await loadCategories();
    await loadProducts();
  });

  // ============================================================= SHELL =====
  function bindShell() {
    document.getElementById('signOutBtn').addEventListener('click', async function () {
      await window.AtharDB.auth.signOut();
      window.location.href = 'index.html';
    });

    document.getElementById('adminNavToggle').addEventListener('click', function () {
      document.getElementById('adminShell').classList.toggle('nav-open');
    });

    document.querySelectorAll('.admin-nav a[data-panel]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.admin-nav a[data-panel]').forEach(function (l) { l.classList.remove('is-active'); });
        link.classList.add('is-active');
        document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('is-active'); });
        document.getElementById('panel-' + link.dataset.panel).classList.add('is-active');
        document.getElementById('adminShell').classList.remove('nav-open');

        if (link.dataset.panel === 'orders') loadOrders();
        if (link.dataset.panel === 'inventory') loadInventory();
        if (link.dataset.panel === 'settings') loadSettings();
      });
    });
  }

  function showToast(message) {
    var toast = document.querySelector('.toast');
    toast.querySelector('span').textContent = message;
    toast.classList.add('is-visible');
    setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  function money(n) { return Number(n).toLocaleString('ar') + ' ر.س'; }

  // =========================================================== CATEGORIES ===
  async function loadCategories() {
    var res = await db.from('categories').select('*, products(count)').order('sort_order');
    categoriesCache = res.data || [];
    renderCategoryFilterOptions();
    renderCategoriesTable();
  }

  function renderCategoryFilterOptions() {
    var sel = document.getElementById('productCategoryFilter');
    var pfSel = document.getElementById('pfCategory');
    var optsHtml = categoriesCache.map(function (c) { return '<option value="' + c.id + '">' + c.name_ar + '</option>'; }).join('');
    pfSel.innerHTML = optsHtml;
    sel.innerHTML = '<option value="">كل الفئات</option>' + categoriesCache.map(function (c) {
      return '<option value="' + c.slug + '">' + c.name_ar + '</option>';
    }).join('');
  }

  function renderCategoriesTable() {
    var body = document.getElementById('categoriesTableBody');
    if (!categoriesCache.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد فئات بعد.</td></tr>';
      return;
    }
    body.innerHTML = categoriesCache.map(function (c) {
      var count = (c.products && c.products[0] && c.products[0].count) || 0;
      return (
        '<tr>' +
        '<td>' + c.name_ar + '</td>' +
        '<td>' + c.name_en + '</td>' +
        '<td style="color:var(--ink-soft)">' + c.slug + '</td>' +
        '<td>' + count + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="icon-action-btn" data-edit-category="' + c.id + '" aria-label="تعديل"><svg viewBox="0 0 24 24"><use href="#ai-edit"></use></svg></button>' +
          '<button class="icon-action-btn danger" data-del-category="' + c.id + '" aria-label="حذف"><svg viewBox="0 0 24 24"><use href="#ai-trash"></use></svg></button>' +
        '</td>' +
        '</tr>'
      );
    }).join('');

    body.querySelectorAll('[data-edit-category]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var category = categoriesCache.find(function (c) { return c.id === btn.dataset.editCategory; });
        openCategoryModal(category);
      });
    });
    body.querySelectorAll('[data-del-category]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('حذف هذه الفئة؟ لا يمكن حذف فئة تحتوي منتجات.')) return;
        var res = await db.from('categories').delete().eq('id', btn.dataset.delCategory);
        if (res.error) { alert('تعذّر الحذف: ' + res.error.message); return; }
        showToast('تم حذف الفئة');
        await loadCategories();
      });
    });
  }

  function bindCategoriesPanel() {
    var scrim = document.getElementById('categoryModalScrim');
    document.getElementById('addCategoryBtn').addEventListener('click', function () { openCategoryModal(null); });
    document.getElementById('closeCategoryModal').addEventListener('click', function () { scrim.classList.remove('is-open'); });
    scrim.addEventListener('click', function (e) { if (e.target === scrim) scrim.classList.remove('is-open'); });

    document.getElementById('cfNameAr').addEventListener('input', autoSlugSuggest);
    document.getElementById('cfSlug').addEventListener('input', function () { this.dataset.touched = 'true'; });

    document.getElementById('categoryForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var errorBox = document.getElementById('categoryFormError');
      var saveBtn = document.getElementById('saveCategoryBtn');
      errorBox.style.display = 'none';
      saveBtn.disabled = true;

      var id = document.getElementById('cfId').value;
      var payload = {
        name_ar: document.getElementById('cfNameAr').value.trim(),
        name_en: document.getElementById('cfNameEn').value.trim(),
        slug: document.getElementById('cfSlug').value.trim().toLowerCase()
      };
      var res = id
        ? await db.from('categories').update(payload).eq('id', id)
        : await db.from('categories').insert(payload);

      saveBtn.disabled = false;
      if (res.error) {
        errorBox.textContent = 'تعذّر الحفظ: ' + res.error.message;
        errorBox.style.display = '';
        return;
      }
      scrim.classList.remove('is-open');
      showToast(id ? 'تم تحديث الفئة' : 'تمت إضافة الفئة');
      await loadCategories();
    });
  }

  function openCategoryModal(category) {
    var form = document.getElementById('categoryForm');
    form.reset();
    document.getElementById('categoryFormError').style.display = 'none';
    document.getElementById('cfSlug').dataset.touched = category ? 'true' : '';
    document.getElementById('categoryModalTitle').textContent = category ? 'تعديل الفئة' : 'إضافة فئة';
    document.getElementById('cfId').value = category ? category.id : '';
    document.getElementById('cfNameAr').value = category ? category.name_ar : '';
    document.getElementById('cfNameEn').value = category ? category.name_en : '';
    document.getElementById('cfSlug').value = category ? category.slug : '';
    document.getElementById('categoryModalScrim').classList.add('is-open');
  }

  function autoSlugSuggest() {
    var slugField = document.getElementById('cfSlug');
    if (slugField.dataset.touched === 'true') return;
    var en = document.getElementById('cfNameEn').value || document.getElementById('cfNameAr').value;
    slugField.value = en.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // ============================================================= PRODUCTS ===
  async function loadProducts() {
    var search = document.getElementById('productSearch').value.trim();
    var categorySlug = document.getElementById('productCategoryFilter').value;

    var query = db.from('products').select('*, product_images(*), category:categories(*)').order('created_at', { ascending: false });
    if (search) query = query.or('name_ar.ilike.%' + search + '%,sku.ilike.%' + search + '%');
    if (categorySlug) {
      var cat = categoriesCache.find(function (c) { return c.slug === categorySlug; });
      if (cat) query = query.eq('category_id', cat.id);
    }

    var res = await query;
    renderProductsTable(res.data || []);
  }

  function renderProductsTable(products) {
    var body = document.getElementById('productsTableBody');
    if (!products.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="8">لا توجد منتجات مطابقة.</td></tr>';
      return;
    }
    body.innerHTML = products.map(function (p) {
      var img = window.AtharUI ? window.AtharUI.firstImage(p) : (p.product_images[0] && p.product_images[0].image_url) || '';
      var badges = '';
      if (p.is_featured) badges += '<span class="badge badge-warn">مميز</span> ';
      if (p.is_new_arrival) badges += '<span class="badge badge-success">جديد</span> ';
      if (p.is_bestseller) badges += '<span class="badge badge-warn">الأكثر مبيعاً</span> ';
      if (!p.is_available) badges += '<span class="badge badge-danger">غير متاح</span> ';
      if (p.stock_quantity <= 0) badges += '<span class="badge badge-muted">نفد المخزون</span>';

      return (
        '<tr>' +
        '<td><img class="admin-thumb" src="' + img + '" alt=""></td>' +
        '<td><strong>' + p.name_ar + '</strong><div style="margin-top:4px">' + badges + '</div></td>' +
        '<td style="color:var(--ink-soft)">' + p.sku + '</td>' +
        '<td>' + ((p.category && p.category.name_ar) || '—') + '</td>' +
        '<td>' + money(p.discount_price != null ? p.discount_price : p.price) + (p.discount_price != null ? '<br><s style="color:var(--ink-soft);font-size:.8rem">' + money(p.price) + '</s>' : '') + '</td>' +
        '<td class="' + (p.stock_quantity <= 5 ? 'stock-low' : '') + '">' + p.stock_quantity + '</td>' +
        '<td>' + (p.is_available ? '<span class="badge badge-success">نشط</span>' : '<span class="badge badge-muted">معطّل</span>') + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="icon-action-btn" data-edit-product="' + p.id + '" aria-label="تعديل"><svg viewBox="0 0 24 24"><use href="#ai-edit"></use></svg></button>' +
          '<button class="icon-action-btn danger" data-del-product="' + p.id + '" aria-label="حذف"><svg viewBox="0 0 24 24"><use href="#ai-trash"></use></svg></button>' +
        '</td>' +
        '</tr>'
      );
    }).join('');

    body.querySelectorAll('[data-edit-product]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var product = products.find(function (p) { return p.id === btn.dataset.editProduct; });
        openProductModal(product);
      });
    });
    body.querySelectorAll('[data-del-product]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        var product = products.find(function (p) { return p.id === btn.dataset.delProduct; });
        await deleteProductImages(product.product_images || []);
        var res = await db.from('products').delete().eq('id', product.id);
        if (res.error) { alert('تعذّر الحذف: ' + res.error.message); return; }
        showToast('تم حذف المنتج');
        await loadProducts();
      });
    });
  }

  async function deleteProductImages(images) {
    var paths = images.map(function (img) { return storagePathFromUrl(img.image_url); }).filter(Boolean);
    if (paths.length) await db.storage.from('product-images').remove(paths);
  }

  function storagePathFromUrl(url) {
    var marker = '/product-images/';
    var idx = url.indexOf(marker);
    return idx > -1 ? url.slice(idx + marker.length) : null;
  }

  function bindProductsPanel() {
    document.getElementById('productSearch').addEventListener('input', debounce(loadProducts, 350));
    document.getElementById('productCategoryFilter').addEventListener('change', loadProducts);
    document.getElementById('addProductBtn').addEventListener('click', function () { openProductModal(null); });
    document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
    document.getElementById('productModalScrim').addEventListener('click', function (e) {
      if (e.target === this) closeProductModal();
    });

    document.getElementById('imageUploadZone').addEventListener('click', function () {
      document.getElementById('imageInput').click();
    });
    document.getElementById('imageInput').addEventListener('change', handleImageSelect);

    document.getElementById('productForm').addEventListener('submit', saveProduct);
  }

  function openProductModal(product) {
    var form = document.getElementById('productForm');
    form.reset();
    document.getElementById('productFormError').style.display = 'none';
    currentProductImages = product ? (product.product_images || []).slice().sort(function (a, b) { return a.sort_order - b.sort_order; }) : [];
    originalProductImageUrls = currentProductImages.map(function (img) { return img.image_url; });
    renderImagePreviews();

    document.getElementById('productModalTitle').textContent = product ? 'تعديل المنتج' : 'إضافة منتج';
    document.getElementById('pfId').value = product ? product.id : '';
    document.getElementById('pfNameAr').value = product ? product.name_ar : '';
    document.getElementById('pfNameEn').value = product ? (product.name_en || '') : '';
    document.getElementById('pfDescAr').value = product ? (product.description_ar || '') : '';
    document.getElementById('pfSku').value = product ? product.sku : '';
    document.getElementById('pfCategory').value = product ? product.category_id : (categoriesCache[0] && categoriesCache[0].id) || '';
    document.getElementById('pfPrice').value = product ? product.price : '';
    document.getElementById('pfDiscount').value = product && product.discount_price != null ? product.discount_price : '';
    document.getElementById('pfStock').value = product ? product.stock_quantity : 0;
    document.getElementById('pfFeatured').checked = product ? product.is_featured : false;
    document.getElementById('pfNew').checked = product ? product.is_new_arrival : false;
    document.getElementById('pfBestseller').checked = product ? product.is_bestseller : false;
    document.getElementById('pfAvailable').checked = product ? product.is_available : true;

    document.getElementById('productModalScrim').classList.add('is-open');
  }

  function closeProductModal() {
    document.getElementById('productModalScrim').classList.remove('is-open');
  }

  function renderImagePreviews() {
    var grid = document.getElementById('imagePreviewGrid');
    grid.innerHTML = currentProductImages.map(function (img, i) {
      var src = window.AtharUI ? window.AtharUI.resolveImageUrl(img.image_url) : img.image_url;
      return '<div class="image-preview-item"><img src="' + src + '" alt=""><span class="remove-img" data-remove-img="' + i + '">✕</span></div>';
    }).join('');
    grid.querySelectorAll('[data-remove-img]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentProductImages.splice(Number(btn.dataset.removeImg), 1);
        renderImagePreviews();
      });
    });
  }

  async function handleImageSelect(e) {
    var files = Array.from(e.target.files || []);
    if (!files.length) return;
    var zone = document.getElementById('imageUploadZone');
    zone.textContent = 'جارٍ رفع الصور...';

    for (var i = 0; i < files.length; i++) {
      try {
        var optimized = await optimizeImage(files[i]);
        var path = 'products/' + Date.now() + '-' + Math.random().toString(16).slice(2) + '.jpg';
        var upload = await db.storage.from('product-images').upload(path, optimized, { contentType: 'image/jpeg' });
        if (upload.error) throw upload.error;
        var publicUrl = db.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        currentProductImages.push({ image_url: publicUrl, sort_order: currentProductImages.length });
      } catch (err) {
        alert('تعذّر رفع إحدى الصور: ' + err.message);
      }
    }

    renderImagePreviews();
    zone.textContent = 'اضغطي لاختيار صورة أو أكثر (يفضّل مربعة الشكل)';
    e.target.value = '';
  }

  /** Client-side resize + JPEG compression before upload (keeps storage light, pages fast). */
  function optimizeImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var img = new Image();
        img.onerror = reject;
        img.onload = function () {
          var MAX = 1200;
          var w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(function (blob) { resolve(blob); }, 'image/jpeg', 0.82);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function saveProduct(e) {
    e.preventDefault();
    var errorBox = document.getElementById('productFormError');
    errorBox.style.display = 'none';
    var saveBtn = document.getElementById('saveProductBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'جارٍ الحفظ...';

    var id = document.getElementById('pfId').value;
    var nameAr = document.getElementById('pfNameAr').value.trim();
    var price = parseFloat(document.getElementById('pfPrice').value);
    var discountRaw = document.getElementById('pfDiscount').value;
    var discount = discountRaw !== '' ? parseFloat(discountRaw) : null;

    if (discount != null && discount > price) {
      errorBox.textContent = 'سعر الخصم يجب أن يكون أقل من السعر الأصلي.';
      errorBox.style.display = '';
      saveBtn.disabled = false; saveBtn.textContent = 'حفظ المنتج';
      return;
    }

    var payload = {
      name_ar: nameAr,
      name_en: document.getElementById('pfNameEn').value.trim() || null,
      description_ar: document.getElementById('pfDescAr').value.trim() || null,
      sku: document.getElementById('pfSku').value.trim(),
      category_id: document.getElementById('pfCategory').value,
      price: price,
      discount_price: discount,
      stock_quantity: parseInt(document.getElementById('pfStock').value, 10) || 0,
      is_featured: document.getElementById('pfFeatured').checked,
      is_new_arrival: document.getElementById('pfNew').checked,
      is_bestseller: document.getElementById('pfBestseller').checked,
      is_available: document.getElementById('pfAvailable').checked
    };

    if (!id) {
      payload.slug = slugify(nameAr) + '-' + Math.random().toString(16).slice(2, 6);
    }

    var res = id
      ? await db.from('products').update(payload).eq('id', id).select().single()
      : await db.from('products').insert(payload).select().single();

    if (res.error) {
      errorBox.textContent = 'تعذّر الحفظ: ' + res.error.message;
      errorBox.style.display = '';
      saveBtn.disabled = false; saveBtn.textContent = 'حفظ المنتج';
      return;
    }

    var productId = res.data.id;
    await db.from('product_images').delete().eq('product_id', productId);
    if (currentProductImages.length) {
      var rows = currentProductImages.map(function (img, i) {
        return { product_id: productId, image_url: img.image_url, sort_order: i };
      });
      await db.from('product_images').insert(rows);
    }

    // Clean up storage for any images that were removed from the preview grid
    // (not just re-pointed) — otherwise deleted images pile up in the bucket forever.
    var keptUrls = currentProductImages.map(function (img) { return img.image_url; });
    var removedUrls = originalProductImageUrls.filter(function (url) { return keptUrls.indexOf(url) === -1; });
    if (removedUrls.length) {
      var removedPaths = removedUrls.map(storagePathFromUrl).filter(Boolean);
      if (removedPaths.length) await db.storage.from('product-images').remove(removedPaths);
    }

    saveBtn.disabled = false; saveBtn.textContent = 'حفظ المنتج';
    closeProductModal();
    showToast(id ? 'تم تحديث المنتج' : 'تمت إضافة المنتج بنجاح');
    await loadProducts();
  }

  function slugify(text) {
    return text
      .toString().trim().toLowerCase()
      .replace(/[؀-ۿ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product';
  }

  // =============================================================== ORDERS ===
  async function loadOrders() {
    var statusFilter = document.getElementById('orderStatusFilter').value;
    var query = db.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    var res = await query;
    var orders = res.data || [];
    renderOrderStats(orders);
    renderOrdersTable(orders);
  }

  function renderOrderStats(orders) {
    var totalRevenue = orders.filter(function (o) { return o.status !== 'cancelled'; }).reduce(function (s, o) { return s + Number(o.total); }, 0);
    var pending = orders.filter(function (o) { return o.status === 'pending'; }).length;
    document.getElementById('orderStatCards').innerHTML =
      statCard('إجمالي الطلبات', orders.length) +
      statCard('قيد الانتظار', pending) +
      statCard('إجمالي الإيرادات', money(totalRevenue)) +
      statCard('متوسط قيمة الطلب', orders.length ? money(totalRevenue / orders.length) : money(0));
  }
  function statCard(label, value) {
    return '<div class="stat-card"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>';
  }

  var STATUS_LABELS = {
    pending: 'قيد الانتظار', confirmed: 'مؤكد', preparing: 'قيد التجهيز',
    shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي'
  };

  function renderOrdersTable(orders) {
    var body = document.getElementById('ordersTableBody');
    if (!orders.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="7">لا توجد طلبات بعد.</td></tr>';
      return;
    }
    body.innerHTML = orders.map(function (o) {
      var date = new Date(o.created_at).toLocaleDateString('ar-SA');
      return (
        '<tr>' +
        '<td><a href="#" data-view-order="' + o.id + '" style="color:var(--gold-dark);font-weight:700">' + o.order_number + '</a></td>' +
        '<td>' + o.customer_name + '</td>' +
        '<td dir="ltr" style="text-align:end">' + o.customer_phone + '</td>' +
        '<td>' + money(o.total) + '</td>' +
        '<td><select class="status-select" data-status-select="' + o.id + '">' +
          Object.keys(STATUS_LABELS).map(function (s) {
            return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + STATUS_LABELS[s] + '</option>';
          }).join('') +
        '</select></td>' +
        '<td style="color:var(--ink-soft)">' + date + '</td>' +
        '<td><button class="icon-action-btn" data-view-order-btn="' + o.id + '" aria-label="عرض التفاصيل"><svg viewBox="0 0 24 24"><use href="#ai-search"></use></svg></button></td>' +
        '</tr>'
      );
    }).join('');

    body.querySelectorAll('[data-status-select]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var res = await db.from('orders').update({ status: sel.value }).eq('id', sel.dataset.statusSelect);
        if (res.error) { alert('تعذّر التحديث: ' + res.error.message); return; }
        showToast('تم تحديث حالة الطلب');
        loadOrders();
      });
    });

    [].concat(
      Array.from(body.querySelectorAll('[data-view-order]')),
      Array.from(body.querySelectorAll('[data-view-order-btn]'))
    ).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var id = el.dataset.viewOrder || el.dataset.viewOrderBtn;
        var order = orders.find(function (o) { return o.id === id; });
        openOrderModal(order);
      });
    });
  }

  function openOrderModal(order) {
    var itemsHtml = (order.order_items || []).map(function (i) {
      return '<div class="checkout-item"><div class="checkout-item-info"><h4>' + i.product_name + '</h4><span>' + i.quantity + ' × ' + money(i.unit_price) + '</span></div><strong>' + money(i.line_total) + '</strong></div>';
    }).join('');

    document.getElementById('orderModalContent').innerHTML =
      '<div class="admin-modal-head"><h3>طلب ' + order.order_number + '</h3><button class="icon-btn" id="closeOrderModal" aria-label="إغلاق"><svg viewBox="0 0 24 24" style="width:18px;height:18px"><use href="#ai-close"></use></svg></button></div>' +
      '<p style="font-weight:700;color:var(--olive-2);margin-bottom:6px">بيانات العميلة</p>' +
      '<p style="color:var(--ink-soft);margin-bottom:4px">' + order.customer_name + ' — <span dir="ltr">' + order.customer_phone + '</span></p>' +
      (order.customer_email ? '<p style="color:var(--ink-soft);margin-bottom:4px">' + order.customer_email + '</p>' : '') +
      '<p style="color:var(--ink-soft);margin-bottom:16px">' + order.country + '، ' + order.city + '، ' + order.address + '</p>' +
      (order.notes ? '<p style="color:var(--ink-soft);margin-bottom:16px"><strong>ملاحظات:</strong> ' + order.notes + '</p>' : '') +
      '<p style="font-weight:700;color:var(--olive-2);margin-bottom:6px">المنتجات</p>' +
      itemsHtml +
      '<div class="checkout-totals">' +
        '<div class="row"><span>المجموع الفرعي</span><span>' + money(order.subtotal) + '</span></div>' +
        '<div class="row"><span>الشحن</span><span>' + money(order.shipping) + '</span></div>' +
        '<div class="row grand"><span>الإجمالي</span><span>' + money(order.total) + '</span></div>' +
      '</div>';

    document.getElementById('closeOrderModal').addEventListener('click', function () {
      document.getElementById('orderModalScrim').classList.remove('is-open');
    });
    document.getElementById('orderModalScrim').classList.add('is-open');
  }

  function bindOrdersPanel() {
    document.getElementById('orderStatusFilter').addEventListener('change', loadOrders);
    document.getElementById('orderModalScrim').addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('is-open');
    });
  }

  // ============================================================= INVENTORY ==
  async function loadInventory() {
    var res = await db.from('products').select('id, sku, name_ar, stock_quantity, product_images(*)').order('stock_quantity', { ascending: true });
    var products = res.data || [];
    var body = document.getElementById('inventoryTableBody');
    if (!products.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد منتجات بعد.</td></tr>';
      return;
    }
    body.innerHTML = products.map(function (p) {
      var img = window.AtharUI ? window.AtharUI.firstImage(p) : '';
      return (
        '<tr>' +
        '<td><img class="admin-thumb" src="' + img + '" alt=""></td>' +
        '<td>' + p.name_ar + '</td>' +
        '<td style="color:var(--ink-soft)">' + p.sku + '</td>' +
        '<td class="' + (p.stock_quantity <= 5 ? 'stock-low' : '') + '">' + p.stock_quantity + '</td>' +
        '<td><input type="number" class="stock-input" min="0" value="' + p.stock_quantity + '" data-stock-id="' + p.id + '"> ' +
          '<button class="icon-action-btn" data-save-stock="' + p.id + '" aria-label="حفظ"><svg viewBox="0 0 24 24"><use href="#ai-edit"></use></svg></button></td>' +
        '</tr>'
      );
    }).join('');

    body.querySelectorAll('[data-save-stock]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var input = body.querySelector('[data-stock-id="' + btn.dataset.saveStock + '"]');
        var res2 = await db.from('products').update({ stock_quantity: parseInt(input.value, 10) || 0 }).eq('id', btn.dataset.saveStock);
        if (res2.error) { alert('تعذّر التحديث: ' + res2.error.message); return; }
        showToast('تم تحديث المخزون');
        loadInventory();
      });
    });
  }

  function bindInventoryPanel() {
    // Panel is loaded on nav click (see bindShell) to always show fresh stock levels.
  }

  // ============================================================= SETTINGS ===
  async function loadSettings() {
    var res = await window.AtharDB.settings.get();
    if (!res.data) return;
    document.getElementById('stStoreName').value = res.data.store_name;
    document.getElementById('stEmail').value = res.data.contact_email;
    document.getElementById('stPhone').value = res.data.contact_phone;
    document.getElementById('stWhatsapp').value = res.data.whatsapp_number;
    document.getElementById('stAddress').value = res.data.address;
    document.getElementById('stShipping').value = res.data.shipping_flat_rate;
    document.getElementById('stFreeShipping').value = res.data.free_shipping_threshold;
  }

  function bindSettingsPanel() {
    document.getElementById('settingsForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var res = await window.AtharDB.settings.update({
        store_name: document.getElementById('stStoreName').value.trim(),
        contact_email: document.getElementById('stEmail').value.trim(),
        contact_phone: document.getElementById('stPhone').value.trim(),
        whatsapp_number: document.getElementById('stWhatsapp').value.trim(),
        address: document.getElementById('stAddress').value.trim(),
        shipping_flat_rate: parseFloat(document.getElementById('stShipping').value) || 0,
        free_shipping_threshold: parseFloat(document.getElementById('stFreeShipping').value) || 0
      });
      var savedMsg = document.getElementById('settingsSaved');
      if (res.error) { alert('تعذّر الحفظ: ' + res.error.message); return; }
      savedMsg.style.display = '';
      showToast('تم حفظ الإعدادات');
      setTimeout(function () { savedMsg.style.display = 'none'; }, 3000);
    });
  }

  // =============================================================== UTIL =====
  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }
})();
