import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const QueryProvider = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 10, // 10 minutes
        retry: (failureCount, error) => {
          // Don't retry on 401, 403, 404
          if (error?.response?.status === 401 || 
              error?.response?.status === 403 || 
              error?.response?.status === 404) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
