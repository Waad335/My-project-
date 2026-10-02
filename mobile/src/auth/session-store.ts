import { create } from "zustand";
import type { AuthSessionResponse, MobileCustomer, TokenResponse } from "@shared/api-types";
import { api, ApiError, setUnauthorizedHandler } from "@/api";
import { queryClient, queryKeys } from "@/api/query-client";
import { clearToken, getToken, saveToken } from "./token-storage";

// Who is using the app. The sign-in screens arrive in Phase 5; this is the
// plumbing they will use.
//
// - unknown: still checking at start-up.
// - guest: no valid token.
// - signedIn: a token is stored. `verified` is false when the server could
//   not be reached to confirm it (offline start); the token is kept and
//   checked again later.
export type SessionStatus = "unknown" | "guest" | "signedIn";

type SessionState = {
  status: SessionStatus;
  customer: MobileCustomer | null;
  verified: boolean;
  hydrate: () => Promise<void>;
  signIn: (session: AuthSessionResponse) => Promise<void>;
  replaceToken: (token: TokenResponse) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "unknown",
  customer: null,
  verified: false,

  hydrate: async () => {
    const token = await getToken();
    if (!token) {
      set({ status: "guest", customer: null, verified: false });
      return;
    }
    try {
      const { customer } = await api.getMe();
      set({ status: "signedIn", customer, verified: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await get().signOut();
        return;
      }
      set({ status: "signedIn", customer: null, verified: false });
    }
  },

  signIn: async (session) => {
    await saveToken(session);
    set({ status: "signedIn", customer: session.customer, verified: true });
  },

  // After a password change the server signs out every other session and
  // returns a fresh token for this one.
  replaceToken: async (token) => {
    await saveToken(token);
  },

  signOut: async () => {
    await clearToken();
    queryClient.removeQueries({ queryKey: queryKeys.me });
    set({ status: "guest", customer: null, verified: false });
  },
}));

setUnauthorizedHandler(() => {
  void useSessionStore.getState().signOut();
});
