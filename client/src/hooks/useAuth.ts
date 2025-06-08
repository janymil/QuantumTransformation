import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add debugging for authentication
  useEffect(() => {
    console.log("Auth Hook - User:", user);
    console.log("Auth Hook - Is Loading:", isLoading);
    console.log("Auth Hook - Error:", error);
    console.log("Auth Hook - Is Authenticated:", !!user);
  }, [user, isLoading, error]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
