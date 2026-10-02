import { AppState, Platform } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";

// Query keys. Everything under "me" belongs to the signed-in customer and
// is dropped on sign-out.
export const queryKeys = {
  settings: ["settings"] as const,
  home: ["home"] as const,
  me: ["me"] as const,
};

function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.code === "network" || error.code === "timeout" || error.status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Catalog responses are cacheable for 60 seconds on the server too.
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

// Refresh stale data when the app returns to the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    focusManager.setFocused(state === "active");
  });
}
