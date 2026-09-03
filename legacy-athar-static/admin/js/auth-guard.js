/**
 * ATHAR | أثر — Admin auth guard.
 * Real enforcement is Row Level Security on the server (see supabase/schema.sql,
 * is_admin()) — this guard only protects the UI/UX (redirects, session state).
 */
window.AtharAdminGuard = {
  /**
   * Call from dashboard.html on load. Redirects to the login page if there's
   * no session or the signed-in user isn't an admin. Resolves with the
   * Supabase user object on success.
   */
  requireAdmin: async function () {
    if (!window.AtharDB || !window.AtharDB.isConfigured) {
      window.location.href = 'index.html?reason=not-configured';
      return null;
    }
    var sessionRes = await window.AtharDB.auth.getSession();
    var session = sessionRes.data && sessionRes.data.session;
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    var isAdmin = await window.AtharDB.auth.isAdmin();
    if (!isAdmin) {
      await window.AtharDB.auth.signOut();
      window.location.href = 'index.html?reason=not-admin';
      return null;
    }
    return session.user;
  }
};
