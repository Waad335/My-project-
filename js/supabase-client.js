/**
 * ATHAR | أثر — Supabase client bootstrap.
 * Depends on: the Supabase JS CDN script + js/supabase-config.js (loaded before this file).
 */
(function () {
  'use strict';

  var url = window.ATHAR_SUPABASE_URL;
  var key = window.ATHAR_SUPABASE_ANON_KEY;
  var configured = !!(url && key && window.supabase);

  var client = configured
    ? window.supabase.createClient(url, key)
    : null;

  if (!configured) {
    console.warn(
      '[ATHAR] Supabase is not configured yet. Fill in js/supabase-config.js ' +
      '(see supabase/README.md) to connect the live store.'
    );
  }

  function getSessionId() {
    var KEY = 'athar_session_id';
    try {
      var id = localStorage.getItem(KEY);
      if (!id) {
        id = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'sess-' + Date.now() + '-' + Math.random().toString(16).slice(2);
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch (e) {
      return 'sess-fallback';
    }
  }

  var Auth = {
    signIn: function (email, password) {
      return client.auth.signInWithPassword({ email: email, password: password });
    },
    signUp: function (email, password) {
      return client.auth.signUp({ email: email, password: password });
    },
    signOut: function () {
      return client.auth.signOut();
    },
    getSession: function () {
      return client.auth.getSession();
    },
    onChange: function (cb) {
      return client.auth.onAuthStateChange(cb);
    },
    isAdmin: async function () {
      var sessionRes = await client.auth.getSession();
      var session = sessionRes.data && sessionRes.data.session;
      if (!session) return false;
      var profileRes = await client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      return !!(profileRes.data && profileRes.data.role === 'admin');
    }
  };

  window.AtharDB = {
    client: client,
    isConfigured: configured,
    getSessionId: getSessionId,
    auth: Auth
  };
})();
