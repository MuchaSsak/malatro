import { QueryClient } from "@tanstack/react-query";

/** Module-level client is fine here: this is a purely client-side app. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true },
    mutations: { retry: false }, // a retried submit is a duplicate
  },
});
