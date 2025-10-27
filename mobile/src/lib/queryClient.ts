import Constants from 'expo-constants';
import { QueryClient } from '@tanstack/react-query';

const expoConfig = Constants.expoConfig ?? Constants.manifest;

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const configApiBaseUrl =
  (expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  DEFAULT_API_BASE_URL;

export const API_BASE_URL = configApiBaseUrl.replace(/\/+$/, '');

function buildRequestUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE_URL}${normalizedPath}`.replace(/([^:]\/)\/+/g, '$1');
}

function queryKeyToPath(queryKey: readonly unknown[]) {
  if (queryKey.length === 0) {
    throw new Error('queryKey must contain at least one segment');
  }

  const [first, ...rest] = queryKey;
  let baseSegment = String(first);

  if (/^https?:\/\//i.test(baseSegment)) {
    if (rest.length === 0) {
      return baseSegment;
    }
    const trailing = rest.map((segment) => encodeURIComponent(String(segment))).join('/');
    const separator = baseSegment.endsWith('/') ? '' : '/';
    return `${baseSegment}${separator}${trailing}`;
  }

  baseSegment = baseSegment.replace(/\/+$/, '');
  const trailing = rest.map((segment) => encodeURIComponent(String(segment))).join('/');
  const combined = trailing ? `${baseSegment}/${trailing}` : baseSegment;
  return combined.startsWith('/') ? combined : `/${combined}`;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const path = queryKeyToPath(queryKey);
        const response = await fetch(buildRequestUrl(path), {
          credentials: 'include',
        });

        if (!response.ok) {
          const text = (await response.text()) || response.statusText;
          throw new Error(`${response.status}: ${text}`);
        }

        return response.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export async function apiRequest(method: string, pathOrUrl: string, data?: unknown) {
  const response = await fetch(buildRequestUrl(pathOrUrl), {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}
