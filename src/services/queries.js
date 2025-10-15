import { useQuery } from "@tanstack/react-query";
import { getUserProfileInfo } from "./authService";

// Centralized user profile query to reuse across the app
// Keyed to allow selective invalidation after profile updates/uploads
export function useUserProfileQuery(options = {}) {
  return useQuery({
    queryKey: ["user", "me", "full"],
    queryFn: getUserProfileInfo,
    // Reasonable defaults; allow callers to override via options
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    ...options
  });
}
