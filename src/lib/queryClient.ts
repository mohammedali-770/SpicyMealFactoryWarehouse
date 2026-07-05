import { QueryClient } from '@tanstack/react-query'

/** Shared TanStack Query client — all server state flows through this. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
