import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { TokenResponse } from "@shared/api-types";

// The customer's sign-in token lives in the iPhone Keychain / Android
// Keystore, readable only by this app on this device (never backed up to
// another device), and is never written to ordinary storage or logs.
//
// The web preview (development only) has no secure store, so there the
// token is kept in memory and forgotten on reload — never in localStorage.

const TOKEN_KEY = "dodana.session";

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

type StoredToken = { token: string; expiresAt: string };

let memoryValue: string | null = null;
let cache: StoredToken | null | undefined;

const useSecureStore = Platform.OS !== "web";

async function readRaw(): Promise<string | null> {
  if (!useSecureStore) return memoryValue;
  return SecureStore.getItemAsync(TOKEN_KEY, secureOptions);
}

async function writeRaw(value: string): Promise<void> {
  if (!useSecureStore) {
    memoryValue = value;
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, value, secureOptions);
}

async function deleteRaw(): Promise<void> {
  if (!useSecureStore) {
    memoryValue = null;
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY, secureOptions);
}

function parse(raw: string | null): StoredToken | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredToken>;
    if (typeof value.token === "string" && typeof value.expiresAt === "string") {
      return { token: value.token, expiresAt: value.expiresAt };
    }
  } catch {
    // Unreadable entry: treat as signed out.
  }
  return null;
}

function isExpired(stored: StoredToken, now: number): boolean {
  const expiresAt = Date.parse(stored.expiresAt);
  return Number.isNaN(expiresAt) || expiresAt <= now;
}

export async function saveToken(session: Pick<TokenResponse, "token" | "expiresAt">): Promise<void> {
  const stored: StoredToken = { token: session.token, expiresAt: session.expiresAt };
  await writeRaw(JSON.stringify(stored));
  cache = stored;
}

// The stored token, or null when there is none or it has expired (an
// expired token is removed).
export async function getToken(now: number = Date.now()): Promise<string | null> {
  if (cache === undefined) cache = parse(await readRaw().catch(() => null));
  if (cache && isExpired(cache, now)) {
    await clearToken();
    return null;
  }
  return cache?.token ?? null;
}

// Whether a usable token is stored. An expired one is removed and reported
// as "expired", so the app can tell the customer their session ended.
export async function getTokenStatus(now: number = Date.now()): Promise<"none" | "valid" | "expired"> {
  if (cache === undefined) cache = parse(await readRaw().catch(() => null));
  if (!cache) return "none";
  if (isExpired(cache, now)) {
    await clearToken();
    return "expired";
  }
  return "valid";
}

export async function clearToken(): Promise<void> {
  cache = null;
  await deleteRaw().catch(() => undefined);
}

// Tests only: forget the in-memory cache.
export function resetTokenCacheForTests(): void {
  cache = undefined;
  memoryValue = null;
}
