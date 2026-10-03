import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { createJSONStorage } from "zustand/middleware";

// The cart and wishlist are kept on the phone (AsyncStorage), like the
// website keeps them in the browser. They hold product names, prices and
// photos only: nothing secret, so plain storage is fine. The sign-in token
// stays in the Keychain/Keystore (src/auth/token-storage.ts).
export const shoppingStorage = createJSONStorage(() => AsyncStorage);

type PersistedStore = {
  persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void };
};

// Resolves once a persisted store has loaded what was saved on the phone.
export function whenHydrated(store: PersistedStore): Promise<void> {
  return new Promise((resolve) => {
    if (store.persist.hasHydrated()) return resolve();
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

// True once the store has loaded, so screens can show a loading state
// instead of a misleading "empty" one for a moment at start-up.
export function useHydrated(store: PersistedStore): boolean {
  const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    let active = true;
    void whenHydrated(store).then(() => {
      if (active) setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [hydrated, store]);
  return hydrated;
}
