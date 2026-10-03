import { getToken } from "@/auth/token-storage";
import { useLocaleStore } from "@/i18n/locale-store";
import { createApiClient } from "./client";
import { apiConfig } from "./config";
import { createEndpoints } from "./endpoints";

export { apiConfig } from "./config";
export { ApiError } from "./errors";

type UnauthorizedHandler = (rejectedToken: string | null) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

// The session registers itself here so that a token the server rejects
// (expired, revoked by a password change, account deleted) signs the app out.
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export const apiClient = createApiClient({
  config: apiConfig,
  getToken: () => getToken(),
  getLocale: () => useLocaleStore.getState().locale,
  onUnauthorized: (rejectedToken) => unauthorizedHandler?.(rejectedToken),
});

export const api = createEndpoints(apiClient);
