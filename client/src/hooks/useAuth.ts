import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, isFetching, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        queryClient.setQueryData(["/api/auth/user"], null);
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const isAuthenticated = !!user && !error;
  const isVerifying = isLoading || isFetching;

  return {
    user,
    isLoading: isVerifying,
    isAuthenticated,
    error,
  };
}
