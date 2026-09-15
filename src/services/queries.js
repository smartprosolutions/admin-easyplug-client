import { useQuery } from "@tanstack/react-query";
import { getUserProfileInfo } from "./authService";
import { hasAccessToken } from "../utils/accessControl";

// Centralized user profile query to reuse across the app
// Keyed to allow selective invalidation after profile updates/uploads
export function useUserProfileQuery(options = {}) {
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: ["user", "me", "full"],
    queryFn: getUserProfileInfo,
    // Reasonable defaults; allow callers to override via options
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    ...rest,
    enabled: Boolean(enabled) && hasAccessToken(),
  });
}
