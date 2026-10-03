import { create } from "zustand";
import type { AuthSessionResponse, MobileCustomer, TokenResponse } from "@shared/api-types";
import { api, ApiError, setUnauthorizedHandler } from "@/api";
import { queryClient, queryKeys } from "@/api/query-client";
import { clearToken, getToken, getTokenStatus, saveToken } from "./token-storage";

// Who is using the app.
//
// - unknown: still checking at start-up.
// - guest: no valid token.
// - signedIn: a token is stored. `verified` is false when the server could
//   not be reached to confirm it (offline start); the token is kept and
//   checked again when the app comes back to the foreground.
//
// `ended` says why the last session ended, so the Account and sign-in
// screens can tell the customer when it expired (30 days, a password
// change elsewhere, or a deleted account).
export type SessionStatus = "unknown" | "guest" | "signedIn";
export type SessionEnd = "signedOut" | "expired";

type SessionState = {
  status: SessionStatus;
  customer: MobileCustomer | null;
  verified: boolean;
  ended: SessionEnd | null;
  hydrate: () => Promise<void>;
  revalidate: () => Promise<void>;
  signIn: (session: AuthSessionResponse) => Promise<void>;
  replaceToken: (token: TokenResponse) => Promise<void>;
  signOut: (reason?: SessionEnd) => Promise<void>;
  clearEnded: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "unknown",
  customer: null,
  verified: false,
  ended: null,

  hydrate: async () => {
    const tokenStatus = await getTokenStatus();
    if (tokenStatus !== "valid") {
      set({ status: "guest", customer: null, verified: false, ended: tokenStatus === "expired" ? "expired" : null });
      return;
    }
    set({ status: "signedIn", verified: false });
    await get().revalidate();
  },

  // Confirms a stored token with the server (at start-up, and when the app
  // returns to the foreground while still unconfirmed).
  revalidate: async () => {
    if (get().status !== "signedIn") return;
    const token = await getToken();
    if (!token) {
      await get().signOut("expired");
      return;
    }
    if (get().verified) return;
    try {
      const { customer } = await api.getMe();
      if (get().status === "signedIn" && (await getToken()) === token) set({ customer, verified: true });
    } catch (error) {
      // Only if this is still the session that was checked.
      if (error instanceof ApiError && error.status === 401 && (await getToken()) === token) {
        await get().signOut("expired");
        return;
      }
      // Offline or the server is unreachable: keep the session, unconfirmed.
    }
  },

  signIn: async (session) => {
    await saveToken(session);
    set({ status: "signedIn", customer: session.customer, verified: true, ended: null });
  },

  // After a password change the server signs out every other session and
  // returns a fresh token for this one.
  replaceToken: async (token) => {
    await saveToken(token);
  },

  signOut: async (reason = "signedOut") => {
    await clearToken();
    queryClient.removeQueries({ queryKey: queryKeys.me });
    set({ status: "guest", customer: null, verified: false, ended: reason });
  },

  clearEnded: () => set({ ended: null }),
}));

// A token the server rejects (expired, revoked by a password change, account
// deleted), or one that expired on the phone, ends the session. A slow
// request sent with an older token is ignored once the customer has signed
// in again with a new one.
async function onUnauthorized(rejectedToken: string | null): Promise<void> {
  if (useSessionStore.getState().status !== "signedIn") return;
  const current = await getToken();
  if (rejectedToken && current && current !== rejectedToken) return;
  if (useSessionStore.getState().status === "signedIn") await useSessionStore.getState().signOut("expired");
}

setUnauthorizedHandler((rejectedToken) => void onUnauthorized(rejectedToken));
