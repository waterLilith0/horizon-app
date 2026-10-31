import {
  getApiAuthMe,
  type UserProfile,
} from "@/api/generated/internal/horizonInternal";
import { useQuery } from "@tanstack/react-query";

export const currentUserQueryKey = ["auth", "me"] as const;

export function useCurrentUser() {
  const result = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async ({ signal }): Promise<UserProfile | null> => {
      const res = await getApiAuthMe({ signal });
      const status: number = res.status;
      if (res.status === 200) return res.data;
      if (res.status === 401) return null;
      throw new Error(`Failed to load user (HTTP ${status})`);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return result;
}
