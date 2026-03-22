import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  fetchWorldBank,
  getAttendance,
  getVisits,
  getStatus,
  type WorldBankResponse,
  type AttendanceResponse,
  type VisitsResponse,
  type StatusResponse,
} from "@/lib/live-client";

// Check if running as static site (no backend) or with backend
const IS_STATIC = typeof window !== "undefined" && (
  window.location.hostname.includes("github.io") ||
  window.location.protocol === "file:" ||
  import.meta.env.VITE_STATIC_MODE === "true"
);

/**
 * Map endpoints to client-side functions for static deployment.
 */
async function fetchStatic(endpoint: string): Promise<unknown> {
  if (endpoint === "/api/live/worldbank") return fetchWorldBank();
  if (endpoint === "/api/live/attendance") return getAttendance();
  if (endpoint === "/api/live/visits") return getVisits();
  if (endpoint === "/api/live/status") return getStatus();
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

/**
 * Custom hook for live auto-refreshing data.
 * In static mode: calls client-side functions directly.
 * In server mode: uses API requests as before.
 */
export function useLiveData<T>(endpoint: string, refreshInterval = 30000) {
  return useQuery<T>({
    queryKey: [endpoint],
    queryFn: async () => {
      if (IS_STATIC) {
        return fetchStatic(endpoint) as Promise<T>;
      }
      const res = await apiRequest("GET", endpoint);
      return res.json() as Promise<T>;
    },
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    staleTime: refreshInterval - 1000,
    retry: 2,
  });
}
