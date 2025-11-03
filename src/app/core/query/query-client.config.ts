import {
  QueryClient,
  DefaultOptions,
} from '@tanstack/angular-query-experimental';

/**
 * Default options for TanStack Query
 * Configures caching, retries, and stale time
 */
const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 0,
  },
};

/**
 * Create a new QueryClient instance with default configuration
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}
