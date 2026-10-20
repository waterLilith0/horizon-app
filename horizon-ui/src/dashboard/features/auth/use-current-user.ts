import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/dashboard/features/auth/auth";

export const currentUserQueryKey = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
