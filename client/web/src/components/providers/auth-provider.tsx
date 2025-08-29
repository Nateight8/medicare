"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useLazyQuery, useMutation, ApolloError } from "@apollo/client";
import { meOperation } from "@/graphql/operations/me";

interface User {
  id: string;
  email: string;
  name?: string;
  onboarded?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: ApolloError | undefined;
  isAuthenticated: boolean;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [getMe, { data, loading, error }] = useLazyQuery(
    meOperation.Queries.me,
    {
      fetchPolicy: "network-only",
      errorPolicy: "ignore",
    }
  );
  const [logoutMutation] = useMutation(meOperation.Mutations.logout);
  const apiUrl = process.env.NEXT_PUBLIC_GRAPHQL_URI?.replace("/graphql", "");

  // 🔄 Refresh token before querying /me
  useEffect(() => {
    (async () => {
      try {
        await fetch(`${apiUrl}/api/auth/refresh-token`, {
          method: "POST",
          credentials: "include", // send cookies
        });
      } catch (err) {
        console.error("Silent refresh failed:", err);
      }
      getMe();
      setReady(true);
    })();
  }, [getMe]);

  const value = useMemo(() => {
    const user = data?.me || null;
    return {
      user,
      loading: !ready || loading,
      error,
      isAuthenticated: !!user,
      logout: () => logoutMutation().then((res) => res.data?.logout?.success),
    };
  }, [data, loading, error, logoutMutation, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
