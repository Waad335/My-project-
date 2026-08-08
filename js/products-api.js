/**
 * ATHAR | أثر — Public data-access layer over Supabase.
 * Depends on js/supabase-client.js (window.AtharDB) being loaded first.
 */
(function () {
  'use strict';

  function db() { return window.AtharDB && window.AtharDB.client; }
  function ready() {
    if (!window.AtharDB || !window.AtharDB.isConfigured) {
      console.warn('[ATHAR] Supabase not configured — see supabase/README.md');
      return false;
    }
    return true;
  }

  var PRODUCT_SELECT = '*, product_images(*), category:categories(*)';

  var Categories = {
    list: async function () {
      if (!ready()) return { data: [], error: null };
      return db().from('categories').select('*').order('sort_order', { ascending: true });
    }
  };

  var Products = {
    /**
     * opts: { categorySlug, search, minPrice, maxPrice, sort,
     *         featuredOnly, newArrivalOnly, bestsellerOnly, limit }
     */
    list: async function (opts) {
      opts = opts || {};
      if (!ready()) return { data: [], error: null };

      var query = db().from('products').select(
        opts.categorySlug ? '*, product_images(*), category:categories!inner(*)' : PRODUCT_SELECT
      ).eq('is_available', true);

      if (opts.categorySlug) query = query.eq('category.slug', opts.categorySlug);
      if (opts.search) {
        var term = '%' + opts.search.replace(/[%_]/g, '') + '%';
        query = query.or('name_ar.ilike.' + term + ',name_en.ilike.' + term + ',description_ar.ilike.' + term);
      }
      if (opts.minPrice != null) query = query.gte('price', opts.minPrice);
      if (opts.maxPrice != null) query = query.lte('price', opts.maxPrice);
      if (opts.featuredOnly) query = query.eq('is_featured', true);
      if (opts.newArrivalOnly) query = query.eq('is_new_arrival', true);
      if (opts.bestsellerOnly) query = query.eq('is_bestseller', true);

      switch (opts.sort) {
        case 'price-asc': query = query.order('price', { ascending: true }); break;
        case 'price-desc': query = query.order('price', { ascending: false }); break;
        case 'name': query = query.order('name_ar', { ascending: true }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      if (opts.limit) query = query.limit(opts.limit);
      return query;
    },

    getBySlug: async function (slug) {
      if (!ready()) return { data: null, error: null };
      return db().from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_available', true).single();
    },

    getById: async function (id) {
      if (!ready()) return { data: null, error: null };
      return db().from('products').select(PRODUCT_SELECT).eq('id', id).single();
    },

    related: async function (categoryId, excludeId, limit) {
      if (!ready()) return { data: [], error: null };
      return db().from('products').select(PRODUCT_SELECT)
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .neq('id', excludeId)
        .limit(limit || 4);
    }
  };

  var Wishlist = {
    list: async function (sessionId) {
      if (!ready()) return { data: [], error: null };
      return db().from('wishlist').select('product_id, product:products(' + PRODUCT_SELECT + ')').eq('session_id', sessionId);
    },
    has: async function (sessionId, productId) {
      if (!ready()) return false;
      var res = await db().from('wishlist').select('id').eq('session_id', sessionId).eq('product_id', productId).maybeSingle();
      return !!res.data;
    },
    toggle: async function (sessionId, productId) {
      if (!ready()) return { active: false };
      var existing = await db().from('wishlist').select('id').eq('session_id', sessionId).eq('product_id', productId).maybeSingle();
      if (existing.data) {
        await db().from('wishlist').delete().eq('id', existing.data.id);
        return { active: false };
      }
      await db().from('wishlist').insert({ session_id: sessionId, product_id: productId });
      return { active: true };
    }
  };

  var Orders = {
    /**
     * payload: { customer: {name,phone,email,country,city,address,notes},
     *            items: [{product_id, name, unit_price, quantity}],
     *            shipping }
     */
    create: async function (payload) {
      if (!ready()) return { data: null, error: { message: 'Supabase not configured' } };

      var subtotal = payload.items.reduce(function (sum, i) { return sum + i.unit_price * i.quantity; }, 0);
      var shipping = payload.shipping || 0;
      var total = subtotal + shipping;

      var orderRes = await db().from('orders').insert({
        customer_name: payload.customer.name,
        customer_phone: payload.customer.phone,
        customer_email: payload.customer.email || null,
        country: payload.customer.country,
        city: payload.customer.city,
        address: payload.customer.address,
        notes: payload.customer.notes || null,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        payment_method: payload.paymentMethod || 'cod'
      }).select().single();

      if (orderRes.error) return orderRes;

      var order = orderRes.data;
      var itemRows = payload.items.map(function (i) {
        return {
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.name,
          unit_price: i.unit_price,
          quantity: i.quantity,
          line_total: i.unit_price * i.quantity
        };
      });

      var itemsRes = await db().from('order_items').insert(itemRows);
      if (itemsRes.error) return { data: null, error: itemsRes.error };

      return { data: order, error: null };
    }
  };

  var Settings = {
    get: async function () {
      if (!ready()) return { data: null, error: null };
      return db().from('store_settings').select('*').eq('id', 1).single();
    },
    update: async function (fields) {
      if (!ready()) return { data: null, error: { message: 'Supabase not configured' } };
      return db().from('store_settings').update(fields).eq('id', 1).select().single();
    }
  };

  window.AtharDB.categories = Categories;
  window.AtharDB.products = Products;
  window.AtharDB.wishlist = Wishlist;
  window.AtharDB.orders = Orders;
  window.AtharDB.settings = Settings;
})();
