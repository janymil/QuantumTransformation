import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async (): Promise<User | null> => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log("Auth Hook - User:", userData);
        console.log("Auth Hook - Is Loading:", false);
        console.log("Auth Hook - Error:", null);
        console.log("Auth Hook - Is Authenticated:", !!userData);
        return userData;
      } catch (err) {
        console.error("Auth error:", err);
        console.log("Auth Hook - User:", null);
        console.log("Auth Hook - Is Loading:", false);
        console.log("Auth Hook - Error:", err);
        console.log("Auth Hook - Is Authenticated:", false);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - increased cache time
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 1,
    networkMode: 'online'
  });